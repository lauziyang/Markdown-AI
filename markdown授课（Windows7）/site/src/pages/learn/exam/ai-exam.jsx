import React from 'react'
import { LessonPage, Section, Callout, useLessonComplete } from '../../../components/ui.jsx'
import Quiz from '../../../components/Quiz.jsx'

/* ============================================================
   结业测试第三关：AI 知识点测验
   覆盖：AI 辅助写作、提示词、表格分析、文档分析、AI 工具规范
   ============================================================ */

const QUESTIONS = [
  {
    q: 'AI 辅助写作中，「生成大纲」的核心价值是什么？',
    options: ['代替你完成所有思考', '帮你解决「从空白页开始」的启动困难', '保证内容绝对正确', '自动发布到博客'],
    answer: 1,
    explain: 'AI 最擅长把「不知道怎么写」变成「照着改」——启动成本大幅降低，但内容仍要你把关。',
  },
  {
    q: '一条好的提示词（Prompt）通常包含哪些要素？',
    options: ['越短越好，只说关键词', '角色 + 任务 + 要求/格式，必要时给示例', '必须用英文', '必须加感叹号'],
    answer: 1,
    explain: '好提示词像给同事派活：说清「你是谁、要做什么、做成什么样」。「角色+任务+格式+示例」是最常用的结构。',
  },
  {
    q: '把一张 Markdown 表格交给 AI 做「统计摘要」，AI 最可能输出什么？',
    options: ['只输出表格本身', '行数、数值列的合计/均值/最大最小、Top 排名', '把表格翻译成英文', '删除表格'],
    answer: 1,
    explain: '统计摘要是「描述性分析」：先描述数据全貌（有多少行、各列数值分布），这是数据分析的第一步。',
  },
  {
    q: '对 AI 给出的数据分析结论，正确态度是？',
    options: ['完全信任，直接采用', '完全不信，AI 没用', '要求 AI 给出依据，并抽查关键数据核对', '只看结论部分'],
    answer: 2,
    explain: '好结论必须可追溯依据。本课表格问答里 AI 每句回答都带「依据：……」，就是让你能复核。',
  },
  {
    q: '「异常值检测」发现某行数值远超均值 3 倍，正确的处理是？',
    options: ['直接删掉那行', '先核对原始数据，确认是录入错误还是真实异常', '把均值改成包含异常值', '忽略它'],
    answer: 1,
    explain: '异常值可能是录入错误，也可能是重要的真实信号（如突发事故、爆款商品）。先核实再决定，是数据分析的基本素养。',
  },
  {
    q: '「文档体检报告」里的结构评分，主要考察什么？',
    options: ['文档字数', '标题层级、表格、代码块、链接、排版等结构要素', '作者是谁', '是否用了彩色字体'],
    answer: 1,
    explain: '体检看的是「结构健康度」：标题层级是否分明、对比信息是否用表格、代码是否带语言标注等。',
  },
  {
    q: 'AI 从你的文档生成测验题，说明 AI 适合做什么？',
    options: ['批量派生内容（如出题、改写、总结）', '独立做学术判断', '完全替代教师命题', '保证题目无争议'],
    answer: 0,
    explain: 'AI 擅长「基于已有内容批量派生」，但题目质量、答案正确性仍需人工把关。',
  },
  {
    q: '本课程的「模拟 AI」与「真实大模型 API」的关系是？',
    options: ['模拟 AI 是假的，学了没用', '页面逻辑完全一样，只是把 lib/ai.js 里的函数换成真实接口调用', '真实 API 不需要提示词', '模拟 AI 能联网'],
    answer: 1,
    explain: '模拟器让你零成本学「流程和思路」，把 lib/ai.js 换成真实接口（DeepSeek/GPT 等）即可落地——页面不用改。',
  },
  {
    q: '用 AI 写正式文档（如公文通知）时，front matter 里的「发文字号」「主送机关」用来干什么？',
    options: ['装饰作用', '让转换工具把公文抬头、落款排进正确位置', '控制字体大小', '给 AI 评分'],
    answer: 1,
    explain: 'front matter 是「结构化元数据」：标题、文号、主送机关、落款等字段写清楚后，md2doc 工具能自动排出公文版式。',
  },
  {
    q: '「场景模板库」的价值在于？',
    options: ['抄格式就行，不用理解', '模板提供可复用的结构骨架 + 结构设计思路，降低启动成本', '模板越多越好，不需要修改', '模板只能用于博客'],
    answer: 1,
    explain: '模板的价值在「结构」而非「内容」：理解每个模板为什么这样搭，才能改造成自己的文档。',
  },
  {
    q: '关于 AI 生成内容的使用边界，下列说法正确的是？',
    options: ['可以随意商用，无需标注', '涉及隐私/敏感信息时不应直接喂给外部 AI', 'AI 内容永远正确', 'AI 可以代替人工签字负责'],
    answer: 1,
    explain: '真实使用中要注意：敏感信息别乱传、AI 结果要复核、涉及责任的内容（签字、审批）必须人工负责。',
  },
  {
    q: '让 AI 帮你写 SQL 时，提示词里最重要的前提信息是？',
    options: ['你的姓名', '表结构（表名 / 列名 / 字段类型）', '数据库密码', 'SQL 的历史版本'],
    answer: 1,
    explain: 'AI 靠「猜」来写 SQL——只有把表结构喂给它，列名表名才不会拼错。表结构 + 需求 + 输出格式是好提示词的三要素。',
  },
  {
    q: '「6 月销量最高的 3 家门店」这句话，正确的 SQL 思路是？',
    options: ['用 MAX(销量) 聚合', '按销量排序 + LIMIT 3', '用 COUNT(*) 统计', '不需要排序直接全查'],
    answer: 1,
    explain: '带数量（前 3 家）的排名需求要「排序 + LIMIT」，而不是 MAX——MAX 只能拿到单个最大值。',
  },
  {
    q: 'SELECT 门店, MAX(销量) FROM sales 少了什么会报错或数据错乱？',
    options: ['分号', 'GROUP BY 门店', 'ORDER BY', 'WHERE'],
    answer: 1,
    explain: 'SELECT 同时出现普通列（门店）和聚合函数（MAX）时，必须按普通列 GROUP BY。',
  },
  {
    q: 'WHERE 与 HAVING 的正确使用场景是？',
    options: ['完全一样，随便用', 'WHERE 过滤原始行，HAVING 过滤分组后的结果', 'HAVING 只能过滤数字', 'WHERE 只能用于 JOIN'],
    answer: 1,
    explain: 'WHERE 不能出现聚合函数；对「分组后的结果」做条件（如 MAX(销量) > 1000）必须用 HAVING。',
  },
  {
    q: '把 SQL 查询结果交给 AI 解读之前，最合适的中间格式是？',
    options: ['截图', 'Markdown 表格', 'Excel 二进制文件', 'PDF'],
    answer: 1,
    explain: 'Markdown 表格是纯文本：AI 零解析损耗、每一行都能作为结论的「依据」直接引用、可 git diff——这是本课程反复强调的核心优势。',
  },
  {
    q: '关于数据安全，下列做法正确的是？',
    options: [
      '把含客户手机号的原始数据直接喂给 AI',
      '让 AI 直接执行 DELETE 语句省事',
      '敏感数据先脱敏（如 138****0000）再交给 AI，破坏性语句人工确认',
      'AI 是可信的，不需要验证结果',
    ],
    answer: 2,
    explain: '数据安全三条红线：脱敏再给 AI、结果先验证、增删改必须人确认。',
  },
  {
    q: '「语言风格分析」能告诉我们什么？',
    options: ['文档的字数', '口语/书面程度、语气强弱、句子长度分布', '作者是谁', '文档的发布时间'],
    answer: 1,
    explain: '风格分析从用词（口语词/书面词）、语气（感叹号/问句）、句长分布三个维度给文档做「风格体检」。',
  },
  {
    q: '「评分-修改-再评分」反馈循环的价值在于？',
    options: ['让 AI 打分更准', '把 AI 的建议落地为修改，并直观看到分数进步', '替代人工审阅', '提高 AI 的生成速度'],
    answer: 1,
    explain: '循环的意义不是分数本身，而是「建议 → 修改 → 验证」的闭环——用分数的变化证明你的修改有效。',
  },
  {
    q: '同样是给 AI 喂一张数据表，Markdown 表格相比直接上传 Excel 的优势是？',
    options: ['Markdown 更美观', '纯文本零解析损耗、依据可核对、可 git diff', 'Excel 打开更快', '没有区别'],
    answer: 1,
    explain: 'Excel 是二进制需解析、易出错且不可 diff；Markdown 纯文本可读可查可版本控制，是「数据 + AI + 文档」链路的最佳载体。',
  },
]

const RECAP = [
  { icon: '🤖', t: 'AI 辅助写作', d: '生成大纲、格式优化、多轮迭代' },
  { icon: '📊', t: '表格分析', d: '统计摘要、自然语言问答、异常检测' },
  { icon: '🗄️', t: 'AI + SQL', d: '自然语言生成 SQL、结果转表格、边界规范' },
  { icon: '🧠', t: '文档分析', d: '体检反馈循环、风格分析、摘要、AI 出题' },
  { icon: '📝', t: '场景模板库', d: '7 大场景骨架 + 结构设计思路' },
  { icon: '📢', t: '配套工具', d: 'md2doc 公文转换 + 网页在线转换器' },
]

export default function AiExam() {
  const { done, markDone } = useLessonComplete('ai-exam')

  return (
    <LessonPage
      id="ai-exam"
      module="m6"
      moduleName="模块六 · 结业测试"
      time="40min"
      icon="🤖"
      title="AI 知识测验"
      subtitle="结业最后一关：20 道题检验你对 AI 辅助写作、表格与 SQL 分析、文档分析的掌握，60 分以上即可获得「结业认证」徽章。"
      goals={['回顾模块五的 AI 知识点', '答对 20 道概念选择题', '以 60 分以上通关并获得结业认证']}
    >
      <Section num={1} title="热身：回顾模块五的六大能力">
        <div className="grid-3">
          {RECAP.map((c) => (
            <div className="card" key={c.t} style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 22 }}>{c.icon}</div>
              <b style={{ display: 'block', margin: '6px 0 2px' }}>{c.t}</b>
              <span style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>{c.d}</span>
            </div>
          ))}
        </div>
        <Callout type="info">
          <b>答题技巧：</b>题目考察的是「思路」而不是死记硬背——想想你在前面几课里亲手操作过的功能。
        </Callout>
      </Section>

      <Section num={2} title="📝 开始测验">
        <Quiz questions={QUESTIONS} passScore={60} onPass={markDone} title="AI 知识测验" />
      </Section>

      <Section num={3} title="下一步">
        {done ? (
          <Callout type="tip" title="🎓 结业认证达成！">
            <b>恭喜你完成了全部课程！</b>三大关卡（进阶测验 → 综合挑战 → AI 知识测验）全部通过，
            「结业认证」徽章已点亮 🏅。去「徽章墙」看看你的 6 枚徽章，或者把学到的技能投入真实写作吧！
          </Callout>
        ) : (
          <p style={{ color: 'var(--text-faint)' }}>答完 20 道题并拿到 60 分以上，即可获得结业认证 🎓</p>
        )}
      </Section>
    </LessonPage>
  )
}
