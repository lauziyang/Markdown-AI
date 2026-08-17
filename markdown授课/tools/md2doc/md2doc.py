#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
md2doc.py —— Markdown 转公文 docx 工具（改进版 v2.0）

与原版（依赖 Windows + Word COM）相比的改进：
  1. 纯 Python 标准库实现，不依赖 Word / Office / 任何第三方包，跨平台（Windows 7 / macOS / Linux）；
  2. 直接生成符合《党政机关公文格式 GB/T 9704-2012》样式的 .docx：
     标题（方正小标宋 二号）、正文（仿宋_GB2312 三号、首行缩进 2 字符、行距 28.9pt）、
     一级标题（黑体）、二级标题（楷体_GB2312）、三级标题（仿宋加粗）；
  3. 支持 YAML 文件头（发文字号 / 主送机关 / 落款 / 成文日期）、多级标题、列表、表格、
     引用、代码块、图片、行内加粗 / 斜体 / 行内代码 / 链接；
  4. 批量转换目录、命令行 + 图形界面双模式。

用法：
  python3 md2doc.py 输入.md [输出.docx]      # 转换单个文件
  python3 md2doc.py --dir 文件夹              # 批量转换目录下所有 .md
  python3 md2doc.py --gui                     # 打开图形界面
"""

import argparse
import io
import os
import re
import struct
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

# ---------------------------------------------------------------------------
# 公文版式常量（GB/T 9704-2012）
# ---------------------------------------------------------------------------
FONT_TITLE = "方正小标宋简体"     # 标题字体（无该字体时 Word 会回退）
FONT_BODY = "仿宋_GB2312"         # 正文字体
FONT_H1 = "黑体"                  # 一级标题
FONT_H2 = "楷体_GB2312"           # 二级标题
FONT_CODE = "Consolas"            # 代码字体
FONT_LATIN = "Times New Roman"    # 西文字体

SZ_BODY = 32    # 三号 = 16pt（半磅单位）
SZ_TITLE = 44   # 二号 = 22pt
SZ_SMALL = 28   # 小四 = 14pt

LINE_BODY = 578        # 行距 28.9pt（twips），公文标准行距
INDENT_FIRST = 640     # 首行缩进 2 字符兜底值（twips）

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture"

ET.register_namespace("w", W)
ET.register_namespace("r", R)
ET.register_namespace("wp", WP)
ET.register_namespace("a", A)
ET.register_namespace("pic", PIC)

# ---------------------------------------------------------------------------
# WordprocessingML 元素构造辅助
# ---------------------------------------------------------------------------


def el(tag, **attrs):
    return ET.Element(tag, attrs)


def sub(parent, tag, **attrs):
    e = ET.SubElement(parent, tag)
    if attrs:
        e.attrib.update(attrs)
    return e


def make_p(text_or_runs, *, font=FONT_BODY, size=SZ_BODY, bold=False,
           align=None, indent_first=False, line=LINE_BODY, spacing_after=0,
           shade=None, keep_lines=False):
    """构造一个段落。text_or_runs 可为字符串，或 (text, style) 列表。"""
    p = el(f"{{{W}}}p")
    pPr = sub(p, f"{{{W}}}pPr")
    spacing = {"w:before": "0", "w:after": str(spacing_after), "w:line": str(line), "w:lineRule": "exact"}
    sub(pPr, f"{{{W}}}spacing", **spacing)
    if indent_first:
        sub(pPr, f"{{{W}}}ind", w_firstLineChars="200", w_firstLine=str(INDENT_FIRST))
    if align:
        sub(pPr, f"{{{W}}}jc", w_val=align)
    if shade:
        shd = sub(pPr, f"{{{W}}}shd")
        shd.set(f"{{{W}}}val", "clear")
        shd.set(f"{{{W}}}fill", shade)

    if isinstance(text_or_runs, str):
        text_or_runs = [(text_or_runs, {})]
    for text, style in text_or_runs:
        r = sub(p, f"{{{W}}}r")
        rPr = sub(r, f"{{{W}}}rPr")
        f = style.get("font", font)
        sub(rPr, f"{{{W}}}rFonts", w_ascii=FONT_LATIN, w_hAnsi=FONT_LATIN, w_eastAsia=f)
        sub(rPr, f"{{{W}}}sz", w_val=str(style.get("size", size)))
        sub(rPr, f"{{{W}}}szCs", w_val=str(style.get("size", size)))
        if style.get("bold") or bold:
            sub(rPr, f"{{{W}}}b")
            sub(rPr, f"{{{W}}}bCs")
        if style.get("italic"):
            sub(rPr, f"{{{W}}}i")
            sub(rPr, f"{{{W}}}iCs")
        if style.get("underline"):
            sub(rPr, f"{{{W}}}u", w_val="single")
        if style.get("color"):
            sub(rPr, f"{{{W}}}color", w_val=style["color"])
        if style.get("shade"):
            shd = sub(rPr, f"{{{W}}}shd")
            shd.set(f"{{{W}}}val", "clear")
            shd.set(f"{{{W}}}fill", style["shade"])
        lines = text.split("\n") if keep_lines else [text]
        for i, ln in enumerate(lines):
            if i > 0:
                sub(r, f"{{{W}}}br")
            t = sub(r, f"{{{W}}}t")
            t.text = ln
            t.set(f"{{{W}}}space", "preserve")
    return p


def make_table(rows, *, header=True):
    """构造三线表风格的表格。rows: 二维列表。"""
    tbl = el(f"{{{W}}}tbl")
    tblPr = sub(tbl, f"{{{W}}}tblPr")
    sub(tblPr, f"{{{W}}}tblW", w_w="0", w_type="auto")
    borders = sub(tblPr, f"{{{W}}}tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = sub(borders, f"{{{W}}}{side}")
        b.set(f"{{{W}}}val", "single")
        b.set(f"{{{W}}}sz", "4")            # 0.5pt
        b.set(f"{{{W}}}color", "000000")
    tblLook = sub(tblPr, f"{{{W}}}tblLook", w_firstRow="0", w_lastRow="0", w_firstColumn="0", w_lastColumn="0", w_noHBand="0", w_noVBand="0", w_val="04A0")

    cols = max(len(r) for r in rows) if rows else 0
    grid = sub(tbl, f"{{{W}}}tblGrid")
    for _ in range(max(cols, 1)):
        sub(grid, f"{{{W}}}gridCol")

    for ri, row in enumerate(rows):
        tr = sub(tbl, f"{{{W}}}tr")
        for cell in row:
            tc = sub(tr, f"{{{W}}}tc")
            tcPr = sub(tc, f"{{{W}}}tcPr")
            sub(tcPr, f"{{{W}}}tcW", w_w="0", w_type="auto")
            if header and ri == 0:
                vAlign = sub(tcPr, f"{{{W}}}vAlign")
                vAlign.set(f"{{{W}}}val", "center")
            tc.append(make_p(str(cell), bold=(header and ri == 0), align="center" if header and ri == 0 else None, size=SZ_SMALL))
    return tbl


def _png_size(data):
    """读取 PNG 尺寸（像素）。"""
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        w, h = struct.unpack(">II", data[16:24])
        return w, h
    return None


def _jpeg_size(data):
    """读取 JPEG 尺寸（像素）。"""
    if data[:2] != b"\xff\xd8":
        return None
    i = 2
    while i < len(data):
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        seg_len = struct.unpack(">H", data[i + 2:i + 4])[0]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        i += 2 + seg_len
    return None


def make_image_run(image_bytes, r_id, width_emu=None):
    """构造图片 run。默认按 96dpi 换算像素→EMU，最大宽 15cm。"""
    size = _png_size(image_bytes) or _jpeg_size(image_bytes) or (0, 0)
    w_px, h_px = size
    if w_px and h_px:
        cx = w_px * 9525
        cy = h_px * 9525
        max_cx = int(15 * 360000)  # 15cm
        if cx > max_cx:
            cy = int(cy * max_cx / cx)
            cx = max_cx
    else:
        cx, cy = 360000 * 8, 360000 * 5
    r = el(f"{{{W}}}r")
    drawing = sub(r, f"{{{W}}}drawing")
    inline = sub(drawing, f"{{{WP}}}inline", distT="0", distB="0", distL="0", distR="0")
    sub(inline, f"{{{WP}}}extent", cx=str(cx), cy=str(cy))
    sub(inline, f"{{{WP}}}docPr", id="1", name="图片")
    graphic = sub(inline, f"{{{A}}}graphic")
    data = sub(graphic, f"{{{A}}}graphicData", uri="http://schemas.openxmlformats.org/drawingml/2006/picture")
    pic = sub(data, f"{{{PIC}}}pic")
    nv = sub(pic, f"{{{PIC}}}nvPicPr")
    cnv = sub(nv, f"{{{PIC}}}cNvPr", id="1", name="图片")
    sub(nv, f"{{{PIC}}}cNvPicPr")
    blipfill = sub(pic, f"{{{PIC}}}blipFill")
    blip = sub(blipfill, f"{{{A}}}blip", **{f"{{{R}}}embed": r_id})
    stretch = sub(blipfill, f"{{{A}}}stretch")
    sub(stretch, f"{{{A}}}fillRect")
    spPr = sub(pic, f"{{{PIC}}}spPr")
    xfrm = sub(spPr, f"{{{A}}}xfrm")
    sub(xfrm, f"{{{A}}}off", x="0", y="0")
    sub(xfrm, f"{{{A}}}ext", cx=str(cx), cy=str(cy))
    prst = sub(spPr, f"{{{A}}}prstGeom", prst="rect")
    sub(prst, f"{{{A}}}avLst")
    return r


# ---------------------------------------------------------------------------
# Markdown 解析
# ---------------------------------------------------------------------------

INLINE_RE = re.compile(
    r"(!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\([^)]*\)|`[^`]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)"
)

FRONT_MATTER_RE = re.compile(r"^---\s*$")


def parse_front_matter(lines):
    """解析开头 --- 包裹的 YAML 简化键值。返回 (front_matter, 剩余行)。"""
    fm = {}
    if not lines or not FRONT_MATTER_RE.match(lines[0]):
        return fm, lines
    i = 1
    while i < len(lines) and not FRONT_MATTER_RE.match(lines[i]):
        m = re.match(r"^([^:#]+):\s*(.*)$", lines[i])
        if m:
            fm[m.group(1).strip()] = m.group(2).strip()
        i += 1
    if i < len(lines):
        return fm, lines[i + 1:]
    return fm, lines


def parse_inline(text):
    """把行内 Markdown 拆成 [(text, style), ...]。"""
    parts = INLINE_RE.split(text)
    out = []
    for part in parts:
        if not part:
            continue
        style = {}
        if part.startswith("![") and "]( " in part.replace(" ", "") or (part.startswith("![") and part.endswith(")")):
            m = re.match(r"!\[([^\]]*)\]\(([^)]*)\)", part)
            if m:
                out.append(("__IMG__:" + m.group(2), {"image": True, "alt": m.group(1)}))
                continue
        if part.startswith("`") and part.endswith("`") and len(part) > 1:
            style = {"font": FONT_CODE, "size": SZ_SMALL, "shade": "F2F2F2"}
            part = part[1:-1]
        elif part.startswith("**") and part.endswith("**") and len(part) > 4:
            style = {"bold": True}
            part = part[2:-2]
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            style = {"italic": True}
            part = part[1:-1]
        elif part.startswith("[") and part.endswith(")"):
            m = re.match(r"\[([^\]]*)\]\(([^)]*)\)", part)
            if m:
                style = {"underline": True, "color": "0563C1"}
                part = m.group(1)
        out.append((part, style))
    return out


def split_table_row(line):
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    return cells


def is_table_sep(line):
    return bool(re.match(r"^\s*\|?[\s:|-]+\|?\s*$", line)) and "-" in line and "|" in line


def looks_like_table(lines, i):
    if "|" not in lines[i]:
        return False
    if i + 1 < len(lines) and is_table_sep(lines[i + 1]):
        return True
    return False


def convert_markdown(md_text, base_dir, images, doc):
    """解析 Markdown 并填充 doc（body 元素列表）。images: 列表接收图片二进制。"""
    lines = md_text.split("\n")
    fm, lines = parse_front_matter(lines)
    body = []
    code_buf = []
    table_buf = []
    list_stack = []   # 未用，简化：列表项各自成段

    i = 0
    n = len(lines)
    while i < n:
        line = lines[i].rstrip()

        # 围栏代码块
        if line.startswith("```"):
            code_buf = [line[3:].strip()]
            i += 1
            while i < n and not lines[i].startswith("```"):
                code_buf.append(lines[i])
                i += 1
            i += 1  # 跳过结束围栏
            code_text = "\n".join(code_buf[1:]).rstrip()
            p = make_p(code_text, font=FONT_CODE, size=SZ_SMALL,
                       shade="F2F2F2", line=340, keep_lines=True)
            body.append(p)
            continue

        # 表格
        if looks_like_table(lines, i):
            table_buf = [split_table_row(lines[i])]
            i += 2  # 跳过表头和分隔行
            while i < n and "|" in lines[i] and lines[i].strip():
                table_buf.append(split_table_row(lines[i]))
                i += 1
            body.append(make_table(table_buf))
            continue

        # 空行 → 段落分隔
        if not line.strip():
            i += 1
            continue

        # 水平线
        if re.match(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", line):
            p = make_p("", line=40, spacing_after=200)
            body.append(p)
            i += 1
            continue

        # 标题
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            level = len(m.group(1))
            text = m.group(2)
            if level == 1:
                body.append(make_p(parse_inline(text), font=FONT_TITLE, size=SZ_TITLE,
                                   bold=True, align="center", spacing_after=300))
            else:
                f = {2: FONT_H1, 3: FONT_H2, 4: FONT_BODY, 5: FONT_BODY, 6: FONT_BODY}[min(level, 6)]
                b = level in (4, 5, 6)
                body.append(make_p(parse_inline(text), font=f, size=SZ_BODY,
                                   bold=b, indent_first=True, spacing_after=120))
            i += 1
            continue

        # 引用
        if line.startswith(">"):
            text = re.sub(r"^>\s?", "", line)
            body.append(make_p(parse_inline(text), font=FONT_H2, indent_first=True))
            i += 1
            continue

        # 列表
        m = re.match(r"^\s*[-*+]\s+(.*)$", line)
        if m:
            runs = parse_inline(m.group(1))
            runs.insert(0, ("● ", {"font": FONT_BODY}))
            body.append(make_p(runs, indent_first=False, line=400))
            i += 1
            continue
        m = re.match(r"^\s*(\d+)[.、)]\s+(.*)$", line)
        if m:
            runs = parse_inline(m.group(2))
            runs.insert(0, (m.group(1) + ". ", {"font": FONT_BODY}))
            body.append(make_p(runs, indent_first=False, line=400))
            i += 1
            continue

        # 单行图片
        m = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)\s*$", line)
        if m:
            img = load_image(m.group(2), base_dir)
            if img:
                r_id = add_image(images, img)
                p = el(f"{{{W}}}p")
                pPr = sub(p, f"{{{W}}}pPr")
                sub(pPr, f"{{{W}}}jc", w_val="center")
                p.append(make_image_run(img, r_id))
                body.append(p)
            else:
                body.append(make_p(f"（图片加载失败：{m.group(2)}）", font=FONT_BODY, size=SZ_SMALL))
            i += 1
            continue

        # 普通段落：合并后续非空行（同一段内硬换行）
        para_lines = [line]
        i += 1
        while i < n:
            nxt = lines[i].rstrip()
            if not nxt or nxt.startswith("#") or nxt.startswith("```") or \
               looks_like_table(lines, i) or re.match(r"^\s*[-*+]\s+", nxt) or \
               re.match(r"^\s*\d+[.、)]\s+", nxt) or nxt.startswith(">") or \
               re.match(r"^\s*(-{3,}|\*{3,}|_{3,})\s*$", nxt) or re.match(r"^!\[", nxt):
                break
            para_lines.append(nxt)
            i += 1
        para_text = "".join(s.strip() for s in para_lines)
        runs = parse_inline(para_text)
        # 行内图片展开
        final_runs = []
        for text, style in runs:
            if style.get("image"):
                img = load_image(text.split(":", 1)[1], base_dir)
                if img:
                    final_runs.append(("__IMG__", {"image_data": img}))
                else:
                    final_runs.append((f"（图片加载失败）", {}))
            else:
                final_runs.append((text, style))
        body.append(make_para_with_images(final_runs))
    return fm, body


def make_para_with_images(runs):
    p = el(f"{{{W}}}p")
    pPr = sub(p, f"{{{W}}}pPr")
    spacing = sub(pPr, f"{{{W}}}spacing", w_before="0", w_after="0",
                  w_line=str(LINE_BODY), w_lineRule="exact")
    sub(pPr, f"{{{W}}}ind", w_firstLineChars="200", w_firstLine=str(INDENT_FIRST))
    for text, style in runs:
        if style.get("image_data"):
            r_id = style["r_id"]
            p.append(make_image_run(style["image_data"], r_id))
        else:
            r = el(f"{{{W}}}r")
            rPr = sub(r, f"{{{W}}}rPr")
            sub(rPr, f"{{{W}}}rFonts", w_ascii=FONT_LATIN, w_hAnsi=FONT_LATIN, w_eastAsia=style.get("font", FONT_BODY))
            sub(rPr, f"{{{W}}}sz", w_val=str(style.get("size", SZ_BODY)))
            sub(rPr, f"{{{W}}}szCs", w_val=str(style.get("size", SZ_BODY)))
            if style.get("bold"):
                sub(rPr, f"{{{W}}}b"); sub(rPr, f"{{{W}}}bCs")
            if style.get("italic"):
                sub(rPr, f"{{{W}}}i"); sub(rPr, f"{{{W}}}iCs")
            if style.get("underline"):
                sub(rPr, f"{{{W}}}u", w_val="single")
            if style.get("color"):
                sub(rPr, f"{{{W}}}color", w_val=style["color"])
            if style.get("shade"):
                shd = sub(rPr, f"{{{W}}}shd")
                shd.set(f"{{{W}}}val", "clear")
                shd.set(f"{{{W}}}fill", style["shade"])
            t = sub(r, f"{{{W}}}t")
            t.text = text
            t.set(f"{{{W}}}space", "preserve")
            p.append(r)
    return p


# ---------------------------------------------------------------------------
# 图片与 docx 打包
# ---------------------------------------------------------------------------


def load_image(src, base_dir):
    """加载图片（本地路径或 http URL）。返回字节，失败返回 None。"""
    try:
        if re.match(r"^https?://", src):
            import urllib.request
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read()
        p = Path(src)
        if not p.is_absolute():
            p = base_dir / p
        if p.exists():
            return p.read_bytes()
    except Exception:
        return None
    return None


def add_image(images, data):
    """登记图片，返回关系 id。"""
    ext = "png" if data[:8] == b"\x89PNG\r\n\x1a\n" else "jpeg"
    r_id = f"rIdImg{len(images) + 1}"
    images.append((r_id, ext, data))
    return r_id


def build_docx(fm, body, images, out_path):
    """把解析结果打包成 docx 文件。"""
    doc = el(f"{{{W}}}document")
    body_el = sub(doc, f"{{{W}}}body")

    # 公文版头（可选，来自 front matter）
    title = fm.get("title")
    if title:
        body_el.append(make_p(parse_inline(title), font=FONT_TITLE, size=SZ_TITLE,
                              bold=True, align="center", spacing_after=200))
    doc_no = fm.get("发文字号") or fm.get("文号")
    if doc_no:
        body_el.append(make_p(parse_inline(doc_no), font=FONT_BODY, size=SZ_SMALL,
                              align="center", spacing_after=100))
    recipient = fm.get("主送机关") or fm.get("主送")
    if recipient:
        body_el.append(make_p(parse_inline(recipient), font=FONT_BODY, indent_first=False))

    for item in body:
        body_el.append(item)

    # 落款（右对齐）
    sign = fm.get("落款") or fm.get("成文机关")
    date = fm.get("成文日期") or fm.get("日期")
    if sign or date:
        for line in ([sign] if sign else []) + ([date] if date else []):
            body_el.append(make_p(parse_inline(line), font=FONT_BODY, align="right"))

    # 节属性（A4 页边距）
    sectPr = sub(body_el, f"{{{W}}}sectPr")
    pgSz = sub(sectPr, f"{{{W}}}pgSz", w_w="11906", w_h="16838")
    pgMar = sub(sectPr, f"{{{W}}}pgMar", w_top="1440", w_right="1440",
                w_bottom="1440", w_left="1440", w_header="851", w_footer="992",
                w_gutter="0")

    # ---- 打包 zip ----
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml
        types = ET.Element("{http://schemas.openxmlformats.org/package/2006/content-types}Types")
        for ext, ct in (("rels", "application/vnd.openxmlformats-package.relationships+xml"),
                        ("xml", "application/xml"),
                        ("png", "image/png"),
                        ("jpeg", "image/jpeg"),
                        ("jpg", "image/jpeg"),
                        ("gif", "image/gif")):
            d = ET.SubElement(types, "{http://schemas.openxmlformats.org/package/2006/content-types}Default")
            d.set("Extension", ext)
            d.set("ContentType", ct)
        o = ET.SubElement(types, "{http://schemas.openxmlformats.org/package/2006/content-types}Override")
        o.set("PartName", "/word/document.xml")
        o.set("ContentType", "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml")
        z.writestr("[Content_Types].xml", ET.tostring(types, encoding="unicode", xml_declaration=True))

        # _rels/.rels
        rels = ET.Element("{http://schemas.openxmlformats.org/package/2006/relationships}Relationships")
        r1 = ET.SubElement(rels, "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship")
        r1.set("Id", "rId1")
        r1.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument")
        r1.set("Target", "word/document.xml")
        z.writestr("_rels/.rels", ET.tostring(rels, encoding="unicode", xml_declaration=True))

        # word/document.xml
        z.writestr("word/document.xml", ET.tostring(doc, encoding="unicode", xml_declaration=True))

        # 图片
        if images:
            doc_rels = ET.Element("{http://schemas.openxmlformats.org/package/2006/relationships}Relationships")
            for idx, (r_id, ext, data) in enumerate(images):
                media_name = f"image{idx + 1}.{ext}"
                z.writestr(f"word/media/{media_name}", data)
                rel = ET.SubElement(doc_rels, "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship")
                rel.set("Id", r_id)
                rel.set("Type", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image")
                rel.set("Target", f"media/{media_name}")
            z.writestr("word/_rels/document.xml.rels", ET.tostring(doc_rels, encoding="unicode", xml_declaration=True))

        # word/styles.xml（基础样式，供 Word 正常识别）
        styles = ET.Element(f"{{{W}}}styles")
        style_doc = ET.SubElement(styles, f"{{{W}}}docDefaults")
        rPr = ET.SubElement(style_doc, f"{{{W}}}rPrDefault")
        rr = ET.SubElement(rPr, f"{{{W}}}rPr")
        ET.SubElement(rr, f"{{{W}}}rFonts", **{f"{{{W}}}ascii": FONT_LATIN, f"{{{W}}}hAnsi": FONT_LATIN, f"{{{W}}}eastAsia": FONT_BODY})
        ET.SubElement(rr, f"{{{W}}}sz", **{f"{{{W}}}val": str(SZ_BODY)})
        z.writestr("word/styles.xml", ET.tostring(styles, encoding="unicode", xml_declaration=True))


# ---------------------------------------------------------------------------
# 图形界面（tkinter）
# ---------------------------------------------------------------------------


def run_gui():
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox, scrolledtext
    except ImportError:
        print("当前 Python 缺少 tkinter，无法打开图形界面；请改用命令行方式：")
        print("  python3 md2doc.py 输入.md [输出.docx]")
        sys.exit(1)

    root = tk.Tk()
    root.title("Markdown 转公文工具 v2.0（改进版）")
    root.geometry("680x520")

    tk.Label(root, text="Markdown 转公文工具（不依赖 Word，直接生成 .docx）",
             font=("PingFang SC", 13, "bold")).pack(pady=(14, 4))
    tk.Label(root, text="支持：公文样式标题/正文、多级标题、表格、图片、列表、批量转换",
             fg="#666").pack()

    frame = tk.Frame(root)
    frame.pack(fill="x", padx=16, pady=10)

    files = []
    out_dir = tk.StringVar(value=str(Path.cwd()))

    def pick_files():
        nonlocal files
        files = list(filedialog.askopenfilenames(
            title="选择 Markdown 文件", filetypes=[("Markdown", "*.md"), ("所有文件", "*.*")]))
        lbl_files.config(text=f"已选择 {len(files)} 个文件" + ("：" + "；".join(Path(f).name for f in files[:3]) + ("…" if len(files) > 3 else "") if files else ""))

    def pick_outdir():
        d = filedialog.askdirectory(title="选择输出目录")
        if d:
            out_dir.set(d)

    def do_convert():
        if not files:
            messagebox.showwarning("提示", "请先选择 Markdown 文件")
            return
        ok = 0
        for f in files:
            try:
                out = Path(out_dir.get()) / (Path(f).stem + ".docx")
                convert_file(f, str(out))
                ok += 1
                log.insert("end", f"✓ {Path(f).name} → {out}\n")
                log.see("end")
            except Exception as e:
                log.insert("end", f"✗ {Path(f).name} 失败：{e}\n")
                log.see("end")
        log.insert("end", f"\n完成：成功 {ok}/{len(files)} 个文件\n")

    row1 = tk.Frame(frame)
    row1.pack(fill="x", pady=3)
    tk.Button(row1, text="选择 Markdown 文件…", command=pick_files, width=22).pack(side="left")
    lbl_files = tk.Label(row1, text="未选择文件", fg="#888")
    lbl_files.pack(side="left", padx=8)

    row2 = tk.Frame(frame)
    row2.pack(fill="x", pady=3)
    tk.Button(row2, text="选择输出目录…", command=pick_outdir, width=22).pack(side="left")
    tk.Label(row2, textvariable=out_dir, fg="#666", anchor="w").pack(side="left", padx=8)

    tk.Button(root, text="🚀 开始转换", command=do_convert,
              bg="#2f7d31", fg="white", font=("PingFang SC", 12, "bold"),
              padx=30, pady=6).pack(pady=8)

    log = scrolledtext.ScrolledText(root, height=14, state="normal")
    log.pack(fill="both", expand=True, padx=16, pady=(0, 14))
    log.insert("end", "使用说明：\n")
    log.insert("end", "1. 点击「选择 Markdown 文件…」选择要转换的 .md 文件（可多选）\n")
    log.insert("end", "2. 选择输出目录（默认当前目录），点击「开始转换」\n")
    log.insert("end", "3. 生成的 .docx 为公文格式：标题小标宋二号、正文仿宋三号、行距 28.9pt、首行缩进 2 字符\n")
    log.insert("end", "4. 支持 front matter：--- 块内写 title / 发文字号 / 主送机关 / 落款 / 成文日期\n\n")

    root.mainloop()


def convert_file(in_path, out_path):
    """转换单个文件。"""
    md_text = Path(in_path).read_text(encoding="utf-8")
    images = []
    fm, body = convert_markdown(md_text, Path(in_path).parent, images, None)
    build_docx(fm, body, images, out_path)


def convert_dir(in_dir, out_dir=None):
    """批量转换目录下所有 .md。"""
    in_dir = Path(in_dir)
    out_dir = Path(out_dir) if out_dir else in_dir / "output"
    out_dir.mkdir(parents=True, exist_ok=True)
    md_files = sorted(in_dir.glob("*.md"))
    if not md_files:
        print(f"（{in_dir} 下没有 .md 文件）")
        return
    for f in md_files:
        out = out_dir / (f.stem + ".docx")
        convert_file(str(f), str(out))
        print(f"✓ {f.name} → {out}")
    print(f"\n共转换 {len(md_files)} 个文件，输出目录：{out_dir}")


def main():
    ap = argparse.ArgumentParser(
        prog="md2doc",
        description="Markdown 转公文 docx 工具（GB/T 9704-2012 公文格式，不依赖 Word）")
    ap.add_argument("input", nargs="?", help="输入 .md 文件")
    ap.add_argument("output", nargs="?", help="输出 .docx 文件（默认与输入同名）")
    ap.add_argument("--dir", help="批量转换目录下所有 .md")
    ap.add_argument("--out-dir", help="批量转换的输出目录（默认 input/output）")
    ap.add_argument("--gui", action="store_true", help="打开图形界面")
    args = ap.parse_args()

    if args.gui:
        run_gui()
        return
    if args.dir:
        convert_dir(args.dir, args.out_dir)
        return
    if not args.input:
        ap.print_help()
        return
    out = args.output or (Path(args.input).with_suffix(".docx"))
    convert_file(args.input, out)
    print(f"✓ 已生成：{out}")


if __name__ == "__main__":
    main()
