import React, { useEffect, useState } from 'react'
import { LessonPage, Section, Callout, Exercise, useLessonComplete, CopyBlock } from '../../../components/ui.jsx'
import { simulateStream, aiSql } from '../../../lib/ai.js'
import { copyText } from '../../../lib/utils.js'

/* 教学表结构（AI 生成 SQL 的前提信息）——三张表，覆盖 JOIN 场景 */
const TABLE_SCHEMA = `stores（门店表）
- id：INT 主键
- 城市：TEXT  例：上海 / 北京 / 成都
- 区域：TEXT  例：华东 / 华北 / 西南

products（商品表）
- id：INT 主键
- 名称：TEXT  例：智能音箱
- 类别：TEXT  例：数码 / 家电 / 食品

sales（销售表，事实表）
- id：INT 主键
- store_id：INT  → 关联 stores.id
- product_id：INT → 关联 products.id
- 月份：TEXT  例：2025-06
- 销量：INT   例：1450
- 销售额：DECIMAL  例：4350000

关联关系：sales.store_id → stores.id；sales.product_id → products.id`

const Q_SAMPLES = [
  '6月销量最高的3家门店',
  '每家门店的平均销售额',
  '哪个城市的门店销量最高',
  '各类别商品6月销售额排名',
  '把门店按销量分为高/中/低三档',
  '销量高于平均值的门店',
  '6月销售额合计是多少',
  '销量大于1000的门店',
]

/* AI 写 SQL 的 6 个易错点 */
const PITFALLS = [
  { icon: '🔤', title: '表名 / 列名拼错', desc: 'AI 是「猜」的——sale ≠ sales。生成后必须对照真实表结构核对每个名字。' },
  { icon: '🧩', title: '聚合列忘了 GROUP BY', desc: 'SELECT 同时出现普通列和聚合函数时，必须按普通列 GROUP BY，否则报错或数据错乱。' },
  { icon: '🔗', title: 'JOIN 忘了写 ON', desc: 'JOIN 必须带关联条件（如 sales.store_id = stores.id），否则产生笛卡尔积，行数爆炸、数据全错。' },
  { icon: '⚖️', title: 'WHERE 与 HAVING 混用', desc: 'WHERE 只能过滤原始行（不能出现聚合函数）；对分组结果做条件要用 HAVING。' },
  { icon: '🧨', title: 'CASE WHEN 缺 END', desc: 'CASE 表达式必须以 END 结束，条件从上到下匹配，最后一个分支用 ELSE 兜底。' },
  { icon: '🗣️', title: 'SQL 方言差异', desc: 'MySQL 用 LIMIT，SQL Server 用 TOP 3——先告诉 AI 你用的数据库。' },
]

/* ============================================================
   规范文档 vs 大白话 对比演示数据
   ============================================================ */

/* ❌ 大白话提问：信息严重不足 */
const SLOPPY_PROMPT = `帮我查一下上个月卖得好的商品，看看每家店怎么样`

/* ❌ AI 因信息不足给出的「猜测式」回应 */
const SLOPPY_SQL = `-- ⚠️ 信息不足，以下为 AI 猜测，请核对后再用

-- 猜测1：表名/列名不确定，先假设存在 sales 表
SELECT 商品, 销量
FROM sales
WHERE 月份 = '2025-05'
ORDER BY 销量 DESC
LIMIT 10;

-- ⚠️ 猜测2：没有外键关系，无法关联门店表
--   「每家店怎么样」——做不到
-- ⚠️ 猜测3：不知道「卖得好」的判断标准
--   （按销量？按销售额？Top 几？）只能默认 LIMIT 10
-- ⚠️ 猜测4：数据库类型未知，方言写法可能不对`

/* ✅ 规范提示词文档：结构完整、逻辑严谨 */
const PRO_DOC = `# SQL 查询需求说明书

## 一、角色与任务

你是一位精通 **MySQL 8.0** 的资深数据分析师。
请根据下面的表结构和业务需求，编写完整、可运行的 SQL 查询。
要求：逻辑严谨、考虑边界情况（除零、空值）、每个查询用注释说明用途。

## 二、数据库表结构

### stores（门店表）
| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INT 主键 | 门店编号 |
| 城市 | VARCHAR | 门店所在城市 |
| 区域 | VARCHAR | 所属大区（华东/华北/西南…） |

### products（商品表）
| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INT 主键 | 商品编号 |
| 名称 | VARCHAR | 商品名称 |
| 类别 | VARCHAR | 商品类别（数码/家电/食品…） |
| 单价 | DECIMAL(10,2) | 零售单价 |

### sales（销售明细表）
| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | INT 主键 | 流水号 |
| store_id | INT 外键 → stores.id | 门店 |
| product_id | INT 外键 → products.id | 商品 |
| 月份 | CHAR(7) | 销售月份，格式 2025-06 |
| 销量 | INT | 销售件数 |
| 销售额 | DECIMAL(12,2) | 销售金额 |

## 三、业务背景

公司共有 6 家门店，覆盖 4 个大区，经营 3 个商品类别。
管理层需要一份「2025 年 6 月经营分析」，用于评估各门店与各品类的表现，
识别增长引擎与下滑风险，指导 7 月备货与营销资源分配。

## 四、查询需求（共 2 个查询）

**查询一：各门店环比经营分析**
1. 汇总每家门店 2025-05 与 2025-06 两个月的销量、销售额（JOIN stores 取城市与区域）
2. 计算 6 月较 5 月的销量环比、销售额环比（保留 2 位小数，5 月为 0 时避免除零）
3. 按环比将门店分四档：高速增长(>10%) / 增长(>0) / 下滑(>-10%) / 严重下滑(≤-10%)
4. 用窗口函数给出环比排名，按环比降序输出

**查询二：商品类别结构分析**
1. 汇总 6 月各商品类别的销量、销售额（JOIN products）
2. 计算各类别销售额占总体的百分比（保留 1 位小数）
3. 输出各类别内销量最高的商品名称（窗口函数 ROW_NUMBER）

## 五、输出要求

1. 使用 MySQL 8.0 语法，允许使用 WITH（CTE）、窗口函数
2. 每个查询前用 \`-- 查询一：…\` 注释说明用途
3. 除零用 NULLIF 处理；金额用 ROUND 控制精度
4. 只输出 SQL 代码，不要任何解释文字
5. 代码缩进清晰，可读性好`

/* ✅ 基于规范文档生成的复杂 SQL（90 行：CTE + 窗口函数 + JOIN + CASE WHEN） */
const PRO_SQL = `-- 查询一：各门店环比经营分析（2025-05 vs 2025-06）
WITH monthly_sales AS (
    -- 1. 按门店×月份汇总销量与销售额（JOIN stores 取城市/区域）
    SELECT
        s.store_id,
        st.城市,
        st.区域,
        s.月份,
        SUM(s.销量)   AS 月销量,
        SUM(s.销售额) AS 月销售额
    FROM sales s
    INNER JOIN stores st ON s.store_id = st.id
    WHERE s.月份 IN ('2025-05', '2025-06')
    GROUP BY s.store_id, st.城市, st.区域, s.月份
),
pivoted AS (
    -- 2. 透视：两月数据转成一行（五月/六月并列列）
    SELECT
        store_id,
        城市,
        区域,
        MAX(CASE WHEN 月份 = '2025-05' THEN 月销量 END)   AS 五月销量,
        MAX(CASE WHEN 月份 = '2025-06' THEN 月销量 END)   AS 六月销量,
        MAX(CASE WHEN 月份 = '2025-05' THEN 月销售额 END) AS 五月销售额,
        MAX(CASE WHEN 月份 = '2025-06' THEN 月销售额 END) AS 六月销售额
    FROM monthly_sales
    GROUP BY store_id, 城市, 区域
),
with_growth AS (
    -- 3. 计算环比（NULLIF 避免 5 月为 0 时除零）
    SELECT
        store_id,
        城市,
        区域,
        五月销量,
        六月销量,
        五月销售额,
        六月销售额,
        ROUND((六月销量 - 五月销量) / NULLIF(五月销量, 0) * 100, 2)     AS 销量环比,
        ROUND((六月销售额 - 五月销售额) / NULLIF(五月销售额, 0) * 100, 2) AS 销售额环比
    FROM pivoted
)
-- 4. 环比分档 + 窗口排名
SELECT
    城市,
    区域,
    五月销量,
    六月销量,
    销量环比,
    六月销售额,
    销售额环比,
    CASE
        WHEN 销量环比 > 10  THEN '高速增长'
        WHEN 销量环比 > 0   THEN '增长'
        WHEN 销量环比 > -10 THEN '下滑'
        ELSE '严重下滑'
    END AS 经营状态,
    RANK() OVER (ORDER BY 销量环比 DESC) AS 环比排名
FROM with_growth
ORDER BY 销量环比 DESC;

-- 查询二：商品类别结构分析（2025-06）
WITH category_summary AS (
    -- 1. 各类别汇总（JOIN products 取类别）
    SELECT
        p.类别,
        SUM(s.销量)   AS 类别销量,
        SUM(s.销售额) AS 类别销售额
    FROM sales s
    INNER JOIN products p ON s.product_id = p.id
    WHERE s.月份 = '2025-06'
    GROUP BY p.类别
),
with_share AS (
    -- 2. 占比：类别销售额 ÷ 全部类别之和
    SELECT
        类别,
        类别销量,
        类别销售额,
        ROUND(类别销售额 / SUM(类别销售额) OVER () * 100, 1) AS 销售占比
    FROM category_summary
),
top_product AS (
    -- 3. 各类别内销量最高的商品（ROW_NUMBER 窗口函数）
    SELECT
        p.类别,
        p.名称,
        SUM(s.销量) AS 商品销量,
        ROW_NUMBER() OVER (PARTITION BY p.类别 ORDER BY SUM(s.销量) DESC) AS rn
    FROM sales s
    INNER JOIN products p ON s.product_id = p.id
    WHERE s.月份 = '2025-06'
    GROUP BY p.类别, p.名称
)
SELECT
    w.类别,
    w.类别销量,
    w.类别销售额,
    w.销售占比,
    t.名称   AS 销量冠军商品,
    t.商品销量
FROM with_share w
LEFT JOIN top_product t ON t.类别 = w.类别 AND t.rn = 1
ORDER BY w.销售占比 DESC;`

/* 两种提问方式的对比表 */
const PROMPT_CMP = [
  ['表结构信息', '缺失 → AI 只能猜列名表名', '三表完整结构 + 外键关系 + 字段说明'],
  ['业务背景', '无 → 无法判断「卖得好」的标准', '背景清楚 → 指标可精确定义'],
  ['需求粒度', '一句话 → 只能生成单条简单查询', '5 个具体需求 + 边界要求（除零/精度）'],
  ['输出规范', '无 → 方言、格式随缘', '明确 MySQL 8.0 + CTE + 注释要求'],
  ['生成结果', '7 行，含 4 处「猜测」', '90 行：CTE + 窗口函数 + JOIN，可直接运行'],
]

export default function SqlHelper() {
  const { done, markDone } = useLessonComplete('sql-helper')
  const [question, setQuestion] = useState('')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [generated, setGenerated] = useState(false)
  // 规范文档 vs 大白话
  const [mode, setMode] = useState('pro') // pro | sloppy
  const [docText, setDocText] = useState(PRO_DOC)
  const [sqlOut, setSqlOut] = useState('')
  const [genBusy, setGenBusy] = useState(false)
  const [proGenerated, setProGenerated] = useState(false)

  const run = async () => {
    if (!question.trim() || busy) return
    setBusy(true)
    setOutput('')
    const result = aiSql(question)
    await simulateStream(result, (c) => setOutput(c), 12)
    setBusy(false)
    setGenerated(true)
  }

  const runCompare = async (m) => {
    if (genBusy) return
    setGenBusy(true)
    setMode(m)
    setDocText(m === 'pro' ? PRO_DOC : SLOPPY_PROMPT)
    setSqlOut('')
    await simulateStream(m === 'pro' ? PRO_SQL : SLOPPY_SQL, (c) => setSqlOut(c), 10)
    setGenBusy(false)
    if (m === 'pro') setProGenerated(true)
  }

  useEffect(() => {
    if (generated || proGenerated) markDone()
  }, [generated, proGenerated, markDone])

  return (
    <LessonPage
      id="sql-helper"
      module="m5"
      moduleName="模块五 · AI 辅助与数据分析"
      time="30min"
      icon="🗄️"
      title="让 AI 帮你写 SQL"
      subtitle="不会写 SQL？没关系——用一句话说清楚你要查什么，AI 帮你生成 SQL，你负责核对。"
      goals={['理解「表结构 + 需求 + 输出格式」的提示词模式', '会用自然语言让 AI 生成 SQL', '会用规范的 Markdown 需求文档让 AI 生成复杂查询', '知道 AI 写 SQL 的 6 个常见易错点']}
    >
      <Section num={1} title="为什么可以放心让 AI 写 SQL？">
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 12px', lineHeight: 1.8 }}>
          SQL 是高度<b>规则化</b>的语言：只要表结构清楚、需求明确，生成 SQL 正是 AI 最擅长的任务。
          关键是把「表结构」喂给 AI——这就是本课的提示词三要素：
        </p>
        <div className="grid-3">
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>📋 1. 表结构</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>告诉 AI 有哪些表和列、什么类型、表之间怎么关联（JOIN 键），它才不会猜错。</p>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>🎯 2. 需求</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>用一句话说清「查什么 + 什么条件 + 要几个」。越具体越好。</p>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <b>📤 3. 输出格式</b>
            <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: '6px 0 0' }}>「只输出 SQL 代码」「MySQL 语法」——限定方言避免踩坑。</p>
          </div>
        </div>
        <Callout type="info" style={{ marginTop: 12 }}>
          <b>本课教学库（三张表）：</b>所有演示围绕 stores / products / sales 三表——<b>单表问题</b>只查 sales，
          <b>多表问题</b>（按城市、按商品类别）需要 JOIN。这是真实业务里最常见的场景。
          <CopyBlock code={TABLE_SCHEMA} lang="text" label="三表结构（含关联关系）" />
        </Callout>
      </Section>

      <Section num={2} title="实操：一句话生成 SQL">
        <Exercise num={1} title="用自然语言生成一次 SQL（任意问题即可通关）" done={done} doneLabel="SQL 好帮手">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {Q_SAMPLES.map((q) => (
              <button key={q} className="chip" style={{ cursor: 'pointer' }} onClick={() => setQuestion(q)}>
                {q}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              className="ex-input"
              style={{ flex: 1, minWidth: 240 }}
              placeholder="用一句话说出你要查什么，例如：6月销量最高的3家门店"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button className="btn btn-primary" onClick={run} disabled={busy || !question.trim()}>
              {busy ? '⏳ 生成中…' : '🤖 生成 SQL'}
            </button>
          </div>
          {output && (
            <div className="demo-frame" style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.9 }}>
              {output}
              <div style={{ marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => copyText(output)}>📋 复制</button>
              </div>
            </div>
          )}
        </Exercise>
      </Section>

      <Section num={3} title="AI 写 SQL 的 6 个易错点（重点）">
        <p style={{ fontSize: 13.5, color: 'var(--text-soft)', margin: '0 0 12px' }}>
          AI 生成的 SQL <b>必须人工核对</b>。这 6 类错误最常见，下次拿到 AI 输出先按这个清单检查：
        </p>
        <div className="grid-2">
          {PITFALLS.map((p) => (
            <div className="card" key={p.title} style={{ padding: '14px 16px' }}>
              <b style={{ display: 'block', marginBottom: 6 }}>{p.icon} {p.title}</b>
              <span style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.7 }}>{p.desc}</span>
            </div>
          ))}
        </div>
        <Callout type="tip" style={{ marginTop: 12 }}>
          <b>黄金流程：</b>AI 起草 → 对照表结构核对名字 → 测试环境跑一遍 → 看结果合不合理 → 才用到真实数据。
          AI 写 SQL 省的是「打字时间」，不是「检查责任」。
        </Callout>
      </Section>

      <Section num={4} title="同样的需求：大白话 vs 规范文档">
        <Callout type="info" title="同一个需求，两种提问方式">
          前面我们用一句话生成 SQL（快速但粗糙）。如果要让 AI 生成<b>几十行、可直接运行的复杂查询</b>，
          必须给它一份<b>规范、逻辑严谨的 Markdown 需求文档</b>——包含角色、表结构、业务背景、需求清单和输出要求。
          下面演示：<b>大白话提问</b>（信息不足 → AI 只能猜）与<b>规范文档提问</b>（信息完整 → AI 输出 90 行高质量 SQL）的差距。
        </Callout>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0 12px' }}>
          <button className={`btn btn-sm ${mode === 'sloppy' ? '' : ''}`} style={mode === 'sloppy' ? { borderColor: '#e11d48', color: '#e11d48' } : undefined} onClick={() => runCompare('sloppy')} disabled={genBusy}>
            ❌ 用大白话提问
          </button>
          <button className={`btn btn-sm ${mode === 'pro' ? 'btn-primary' : ''}`} onClick={() => runCompare('pro')} disabled={genBusy}>
            ✅ 用规范文档提问
          </button>
          {genBusy && <span className="chip">⏳ AI 生成中…</span>}
        </div>

        <div className="grid-2">
          {/* 左侧：喂给 AI 的提示词原文 */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--text-soft)' }}>
              📄 喂给 AI 的提示词（{mode === 'pro' ? '规范文档' : '大白话'}）
            </div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 12.5, lineHeight: 1.7, minHeight: 260, margin: 0,
                overflow: 'auto', maxHeight: 460, whiteSpace: 'pre-wrap',
              }}
            >
              {docText}
            </pre>
            <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => copyText(docText)}>📋 复制提示词</button>
          </div>
          {/* 右侧：AI 生成的 SQL */}
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: mode === 'pro' ? 'var(--ok)' : '#e11d48' }}>
              🤖 AI 生成的 SQL（{mode === 'pro' ? '90 行 · CTE + 窗口函数' : '7 行 · 含 4 处猜测'}）
            </div>
            <pre
              style={{
                background: 'var(--code-bg)', color: 'var(--code-text)', borderRadius: 10,
                padding: '12px 14px', fontSize: 12.5, lineHeight: 1.7, minHeight: 260, margin: 0,
                overflow: 'auto', maxHeight: 460, whiteSpace: 'pre-wrap',
              }}
            >
              {sqlOut || '点击上方按钮，看 AI 在这两种提问下的不同表现…'}
            </pre>
            {sqlOut && <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => copyText(sqlOut)}>📋 复制 SQL</button>}
          </div>
        </div>

        {/* 对比表 */}
        <div className="card" style={{ padding: '16px 18px', marginTop: 14 }}>
          <b style={{ display: 'block', marginBottom: 10 }}>📊 两种提问方式的差距</b>
          <div style={{ overflowX: 'auto' }}>
            <table className="cmp-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>维度</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>❌ 大白话</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--border)' }}>✅ 规范文档</th>
                </tr>
              </thead>
              <tbody>
                {PROMPT_CMP.map((r) => (
                  <tr key={r[0]}>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', fontWeight: 700, whiteSpace: 'nowrap' }}>{r[0]}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: '#e11d48' }}>{r[1]}</td>
                    <td style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-soft, #eee)', color: 'var(--ok)' }}>{r[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Callout type="tip" style={{ marginTop: 12 }}>
            <b>核心结论：</b>AI 的能力取决于你给它的信息——<b>「规范文档式提问」把写 SQL 从「碰运气」变成「按图施工」</b>。
            真实的 AI 数据工作流中，把表结构文档沉淀成团队共享的「提示词模板」，人人都能稳定地让 AI 产出高质量查询。
          </Callout>
        </div>
      </Section>

      <Section num={5} title="下一步">
        {done ? (
          <Callout type="tip">
            <b>🎉 SQL 好帮手！</b>你已经会用自然语言和规范文档两种方式让 AI 生成 SQL 了。
            下一课「查询结果 → AI 解读 → 报告」，把查出来的数据变成一份漂亮的 Markdown 报告。
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>完成「一句话生成 SQL」或「规范文档生成复杂 SQL」任一练习即可通关 🎉</p>
        )}
      </Section>
    </LessonPage>
  )
}
