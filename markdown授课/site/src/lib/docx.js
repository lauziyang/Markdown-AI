/* ============================================================
 * docx.js —— 纯前端 Markdown → 公文 docx 生成器
 * 零依赖（手写 ZIP STORED 格式 + WordprocessingML），
 * 完全在浏览器内运行，Windows 7 旧浏览器同样可用。
 * 样式遵循《党政机关公文格式 GB/T 9704-2012》：
 *   标题：方正小标宋 二号(22pt) 居中
 *   正文：仿宋_GB2312 三号(16pt)，首行缩进 2 字符，行距 28.9pt
 *   一级标题：黑体 三号；二级标题：楷体_GB2312 三号
 * API：
 *   markdownToDocxBlob(md) -> Blob          // 生成 docx Blob
 *   downloadDocx(md, filename)              // 生成并触发下载
 * ============================================================ */

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture'

const FONT_TITLE = '方正小标宋简体'
const FONT_BODY = '仿宋_GB2312'
const FONT_H1 = '黑体'
const FONT_H2 = '楷体_GB2312'
const FONT_CODE = 'Consolas'
const SZ_BODY = 32 // 三号 = 16pt（半磅）
const SZ_TITLE = 44 // 二号 = 22pt
const SZ_SMALL = 28 // 小四 = 14pt
const LINE_BODY = 578 // 行距 28.9pt（twips）

/* ---------------- XML 转义 ---------------- */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ---------------- 行内 Markdown 解析 ---------------- */
const INLINE_RE = /(!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\([^)]*\)|`[^`]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g

function inlineRuns(text) {
  const runs = []
  let last = 0
  let m
  const re = new RegExp(INLINE_RE.source, 'g')
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) })
    const tok = m[0]
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 1) {
      runs.push({ text: tok.slice(1, -1), code: true })
    } else if (tok.startsWith('**') && tok.endsWith('**')) {
      runs.push({ text: tok.slice(2, -2), bold: true })
    } else if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      runs.push({ text: tok.slice(1, -1), italic: true })
    } else if (tok.startsWith('[') && tok.endsWith(')')) {
      const lm = tok.match(/\[([^\]]*)\]\(([^)]*)\)/)
      if (lm) runs.push({ text: lm[1], link: lm[2] })
      else runs.push({ text: tok })
    } else {
      runs.push({ text: tok })
    }
    last = m.index + tok.length
  }
  if (last < text.length) runs.push({ text: text.slice(last) })
  return runs
}

/* ---------------- 段落/表格 XML ---------------- */
function runXml(text, st) {
  const rPr = `<w:rPr>` +
    `<w:rFonts w:ascii="${st.font || 'Times New Roman'}" w:hAnsi="${st.font || 'Times New Roman'}" w:eastAsia="${st.font || FONT_BODY}"/>` +
    `<w:sz w:val="${st.size || SZ_BODY}"/><w:szCs w:val="${st.size || SZ_BODY}"/>` +
    (st.bold ? '<w:b/><w:bCs/>' : '') +
    (st.italic ? '<w:i/><w:iCs/>' : '') +
    (st.underline ? '<w:u w:val="single"/>' : '') +
    (st.color ? `<w:color w:val="${st.color}"/>` : '') +
    (st.shade ? `<w:shd w:val="clear" w:fill="${st.shade}"/>` : '') +
    `</w:rPr>`
  return `<w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`
}

function pXml(content, opts = {}) {
  const ind = opts.indent ? `<w:ind w:firstLineChars="200" w:firstLine="640"/>` : ''
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : ''
  const line = opts.line || LINE_BODY
  const shade = opts.shade ? `<w:shd w:val="clear" w:fill="${opts.shade}"/>` : ''
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="${opts.after || 0}" w:line="${line}" w:lineRule="exact"/>${ind}${align}${shade}</w:pPr>${content}</w:p>`
}

function runsToXml(runs, base = {}) {
  return runs
    .map((r) => runXml(r.text, {
      font: r.code ? FONT_CODE : base.font,
      size: r.code ? SZ_SMALL : base.size,
      bold: r.bold || base.bold,
      italic: r.italic,
      underline: r.link ? true : undefined,
      color: r.link ? '0563C1' : undefined,
      shade: r.code ? 'F2F2F2' : undefined,
    }))
    .join('')
}

function tableXml(rows) {
  const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map((s) => `<w:${s} w:val="single" w:sz="4" w:color="000000"/>`)
    .join('')
  let x = `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${borders}</w:tblBorders></w:tblPr><w:tblGrid>`
  const cols = Math.max(...rows.map((r) => r.length), 1)
  for (let i = 0; i < cols; i++) x += '<w:gridCol/>'
  x += '</w:tblGrid>'
  rows.forEach((row, ri) => {
    x += '<w:tr>'
    row.forEach((cell) => {
      const runs = inlineRuns(String(cell))
      const bold = ri === 0
      const align = ri === 0 ? 'center' : null
      const p = `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="400" w:lineRule="exact"/>${align ? `<w:jc w:val="${align}"/>` : ''}</w:pPr>${runsToXml(runs, { size: SZ_SMALL, bold })}</w:p>`
      x += `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${p}</w:tc>`
    })
    x += '</w:tr>'
  })
  return x + '</w:tbl>'
}

/* ---------------- Markdown 解析 → body XML ---------------- */
function isTableSep(line) {
  return /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-') && line.includes('|')
}

function parseMd(md) {
  const lines = md.split(/\r?\n/)
  const fm = {}
  let i = 0
  // front matter
  if (lines.length && /^---\s*$/.test(lines[0])) {
    i = 1
    while (i < lines.length && !/^---\s*$/.test(lines[i])) {
      const m = lines[i].match(/^([^:#]+):\s*(.*)$/)
      if (m) fm[m[1].trim()] = m[2].trim()
      i++
    }
    i++
  }
  const out = []
  while (i < lines.length) {
    const line = lines[i].replace(/\s+$/, '')
    // 代码块
    if (line.startsWith('```')) {
      const buf = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      i++
      const code = buf.join('\n').replace(/\s+$/, '')
      // 保留换行：每行一个 run，行间插入换行符
      const codeRuns = code.split('\n').map((ln, idx) => (idx > 0 ? '<w:r><w:br/></w:r>' : '') + runXml(ln, { font: FONT_CODE, size: SZ_SMALL, shade: 'F2F2F2' })).join('')
      out.push(pXml(codeRuns, { line: 340, shade: 'F2F2F2' }))
      continue
    }
    // 表格
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const rows = [line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())]
      i += 2
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(lines[i].replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
        i++
      }
      out.push(tableXml(rows))
      continue
    }
    if (!line.trim()) { i++; continue }
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push(pXml('', { line: 40, after: 200 })); i++; continue }
    // 标题
    let m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const level = m[1].length
      const text = m[2]
      if (level === 1) {
        out.push(pXml(runsToXml(inlineRuns(text), { font: FONT_TITLE, size: SZ_TITLE, bold: true }), { align: 'center', after: 300, indent: false }))
      } else {
        const font = { 2: FONT_H1, 3: FONT_H2, 4: FONT_BODY, 5: FONT_BODY, 6: FONT_BODY }[level]
        out.push(pXml(runsToXml(inlineRuns(text), { font, bold: level >= 4 }), { indent: true, after: 120 }))
      }
      i++
      continue
    }
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s?/, '')
      out.push(pXml(runsToXml(inlineRuns(text), { font: FONT_H2 }), { indent: true }))
      i++
      continue
    }
    m = line.match(/^\s*[-*+]\s+(.*)$/)
    if (m) {
      const runs = inlineRuns(m[1])
      runs.unshift({ text: '● ', bold: false })
      out.push(pXml(runsToXml(runs), { line: 400, indent: false }))
      i++
      continue
    }
    m = line.match(/^\s*(\d+)[.、)]\s+(.*)$/)
    if (m) {
      const runs = inlineRuns(m[2])
      runs.unshift({ text: `${m[1]}. ` })
      out.push(pXml(runsToXml(runs), { line: 400, indent: false }))
      i++
      continue
    }
    // 图片（浏览器内无法嵌入远程图片，输出占位说明）
    m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (m) {
      out.push(pXml(runsToXml([{ text: `［图片：${m[1] || m[2]}］`, italic: true }]), { indent: false }))
      i++
      continue
    }
    // 普通段落：合并后续行
    const para = [line]
    i++
    while (i < lines.length) {
      const nxt = lines[i].replace(/\s+$/, '')
      if (!nxt || nxt.startsWith('#') || nxt.startsWith('```') || nxt.startsWith('>') ||
        /^\s*[-*+]\s+/.test(nxt) || /^\s*\d+[.、)]\s+/.test(nxt) ||
        /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(nxt) || /^!\[/.test(nxt) ||
        (nxt.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) break
      para.push(nxt)
      i++
    }
    const paraText = para.map((s) => s.trim()).join('')
    out.push(pXml(runsToXml(inlineRuns(paraText)), { indent: true }))
  }
  return { fm, body: out.join('\n') }
}

/* ---------------- ZIP（STORED 无压缩） ---------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function dosDateTime(d = new Date()) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  return { time, date }
}

function utf8Bytes(s) {
  return new TextEncoder().encode(s)
}

function makeZip(entries) {
  // entries: [{ name, data(Uint8Array) }]
  const chunks = []
  const central = []
  let offset = 0
  const { time, date } = dosDateTime()
  for (const e of entries) {
    const nameBytes = utf8Bytes(e.name)
    const crc = crc32(e.data)
    const hdr = new DataView(new ArrayBuffer(30))
    hdr.setUint32(0, 0x04034b50, true)
    hdr.setUint16(4, 20, true)
    hdr.setUint16(6, 0, true)
    hdr.setUint16(8, 0, true) // stored
    hdr.setUint16(10, time, true)
    hdr.setUint16(12, date, true)
    hdr.setUint32(14, crc, true)
    hdr.setUint32(18, e.data.length, true)
    hdr.setUint32(22, e.data.length, true)
    hdr.setUint16(26, nameBytes.length, true)
    hdr.setUint16(28, 0, true)
    chunks.push(new Uint8Array(hdr.buffer), nameBytes, e.data)
    central.push({ nameBytes, crc, size: e.data.length, offset })
    offset += 30 + nameBytes.length + e.data.length
  }
  const cdStart = offset
  const cdChunks = []
  for (const c of central) {
    const cd = new DataView(new ArrayBuffer(46))
    cd.setUint32(0, 0x02014b50, true)
    cd.setUint16(4, 20, true)
    cd.setUint16(6, 20, true)
    cd.setUint16(8, 0, true)
    cd.setUint16(10, 0, true)
    cd.setUint16(12, time, true)
    cd.setUint16(14, date, true)
    cd.setUint32(16, c.crc, true)
    cd.setUint32(20, c.size, true)
    cd.setUint32(24, c.size, true)
    cd.setUint16(28, c.nameBytes.length, true)
    cd.setUint16(30, 0, true)
    cd.setUint16(32, 0, true)
    cd.setUint16(34, 0, true)
    cd.setUint16(36, 0, true)
    cd.setUint32(38, 0, true)
    cd.setUint32(42, c.offset, true)
    cdChunks.push(new Uint8Array(cd.buffer), c.nameBytes)
  }
  const cdSize = cdChunks.reduce((s, c) => s + c.length, 0)
  const eocd = new DataView(new ArrayBuffer(22))
  eocd.setUint32(0, 0x06054b50, true)
  eocd.setUint16(4, 0, true)
  eocd.setUint16(6, 0, true)
  eocd.setUint16(8, central.length, true)
  eocd.setUint16(10, central.length, true)
  eocd.setUint32(12, cdSize, true)
  eocd.setUint32(16, cdStart, true)
  eocd.setUint16(20, 0, true)
  const total = chunks.reduce((s, c) => s + c.length, 0) + cdSize + 22
  const out = new Uint8Array(total)
  let pos = 0
  for (const c of chunks) { out.set(c, pos); pos += c.length }
  for (const c of cdChunks) { out.set(c, pos); pos += c.length }
  out.set(new Uint8Array(eocd.buffer), pos)
  return out
}

/* ---------------- 对外 API ---------------- */
export function markdownToDocxBytes(md) {
  const { fm, body } = parseMd(md)
  const title = fm.title ? pXml(runsToXml(inlineRuns(fm.title), { font: FONT_TITLE, size: SZ_TITLE, bold: true }), { align: 'center', after: 200 }) : ''
  const docNo = fm['发文字号'] || fm['文号']
    ? pXml(runsToXml(inlineRuns(fm['发文字号'] || fm['文号']), { font: FONT_BODY, size: SZ_SMALL }), { align: 'center', after: 100 })
    : ''
  const recipient = fm['主送机关'] || fm['主送']
    ? pXml(runsToXml(inlineRuns(fm['主送机关'] || fm['主送']), { font: FONT_BODY }), { indent: false })
    : ''
  const sign = fm['落款'] || fm['成文机关']
  const date = fm['成文日期'] || fm['日期']
  let tail = ''
  for (const t of [sign, date]) {
    if (t) tail += pXml(runsToXml(inlineRuns(t), { font: FONT_BODY }), { align: 'right' })
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}"><w:body>${title}${docNo}${recipient}${body}${tail}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="851" w:footer="992" w:gutter="0"/></w:sectPr></w:body></w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="${FONT_BODY}"/><w:sz w:val="${SZ_BODY}"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`

  return makeZip([
    { name: '[Content_Types].xml', data: utf8Bytes(contentTypes) },
    { name: '_rels/.rels', data: utf8Bytes(rels) },
    { name: 'word/document.xml', data: utf8Bytes(documentXml) },
    { name: 'word/styles.xml', data: utf8Bytes(styles) },
  ])
}

export function markdownToDocxBlob(md) {
  return new Blob([markdownToDocxBytes(md)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}

export function downloadDocx(md, filename = '公文.docx') {
  const blob = markdownToDocxBlob(md)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 500)
}
