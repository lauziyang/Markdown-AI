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
]

const RECAP = [
  { icon: '🤖', t: 'AI 辅助写作', d: '生成大纲、格式优化、多轮迭代' },
  { icon: '📊', t: '表格分析', d: '统计摘要、自然语言问答、异常检测' },
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
      subtitle="结业最后一关：11 道题检验你对 AI 辅助写作、表格与文档分析的掌握，60 分以上即可获得「结业认证」徽章。"
      goals={['回顾模块五的 AI 知识点', '答对 11 道概念选择题', '以 60 分以上通关并获得结业认证']}
    >
      <Section num={1} title="热身：回顾模块五的四大能力">
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
          <p style={{ color: 'var(--text-faint)' }}>答完 11 道题并拿到 60 分以上，即可获得结业认证 🎓</p>
        )}
      </Section>
    </LessonPage>
  )
}
