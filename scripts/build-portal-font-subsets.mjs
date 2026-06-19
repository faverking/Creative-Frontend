import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import subsetFont from 'subset-font'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const fontDir = path.join(repoRoot, 'packages/theme/src/assets/fonts')

const fontJobs = [
  {
    input: 'AlibabaPuHuiTi-Regular-400.woff2',
    output: 'AlibabaPuHuiTi-PortalSubset-400.woff2'
  },
  {
    input: 'AlibabaPuHuiTi-SemiBold-600.woff2',
    output: 'AlibabaPuHuiTi-PortalSubset-600.woff2'
  }
]

const scanTargets = [
  'apps/portal-web/src/components',
  'apps/portal-web/src/constants',
  'apps/portal-web/src/views/home',
  'apps/portal-web/src/views/modules',
  'apps/portal-web/src/views/public',
  'apps/portal-web/src/views/workspace/components'
]

const productSeed = [
  '创意中心',
  '首页 情报 游戏 书库 图包',
  '本周精选 推荐版块 最新动态 热门内容',
  '消息 收藏 创作 登录 注册 注销登录 全部已读 暂无未读',
  '工作台 个人资料 历史记录 我的收藏',
  '查看详情 阅读 漫画 小说 日系 恋爱 搞笑 二游动态',
  '章节 页码 阅读进度 目录 上一章 下一章 继续阅读',
  '处理中 确认 取消 删除 清空 保存 重试 正在载入',
  '年月日周 小时前 分钟前 秒前 浏览 回复 点赞 评论 关注',
  '文章 专题 作品 标签 作者 角色 剧情 更新 官方 短片 预览 封面'
].join('')

const commonChineseSeed = [
  '的一是在不了有和人这中大为上个国我以要他',
  '时来用们生到作地于出就分对成会可主发年',
  '动同工也能下过子说产种面而方后多定行学',
  '法所民得经十三之进着等部度家电力里如水',
  '化高自二理起小物现实加量都两体制机当使',
  '点从业本去把性好应开它合还因由其些然前',
  '外天政四日那社义事平形相全表间样与关各',
  '重新线内数正心反你明看原又么利比或但质',
  '气第向道命此变条只没结解问意建月公无系',
  '军很情者最立代想已通并提直题党程展五果',
  '料象员革位入常文总次品式活设及管特件长',
  '求老头基资边流路级少图山统接知较将组见',
  '计别她手角期根论运农指几九区强放决西被',
  '干做必战先回则任取据处队南给色光门即保',
  '治北造百规热领七海口东导器压志世金增争',
  '济阶油思术极交受联什认六共权收证改清美',
  '再采转更单风切打白教速花带安场身车例真',
  '务具万每目至达走积示议声报斗完类八离华',
  '名确才科张信马节话米整空元况今集温传土',
  '许步群广石记需段研界拉林律叫且究观越织',
  '装影算低持音众书布复容儿须际商非验连断',
  '深难近矿千周委素技备半办青省列习响约支',
  '般史感劳便团往酸历市克何除消构府称太准',
  '精值号率族维划选标写存候毛亲快效斯院查',
  '江型眼王按格养易置派层片始却专状育厂京',
  '识适属圆包火住调满县局照参红细引听该铁',
  '价严龙飞岁物映版块览阅弹窗提示登录注册',
  '合集投稿发布编辑审核草稿素材插画图片游戏',
  '资讯评测攻略公告精选推荐收藏评论章节目录',
  '内容封面标题摘要分类作者时间数据状态为空',
  '成功失败异常网络请求加载完成刷新返回分享'
].join('')

const japaneseKanaSeed =
  'ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞ' +
  'ただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽ' +
  'まみむめもゃやゅゆょよらりるれろゎわをん' +
  'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾ' +
  'タダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポ' +
  'マミムメモャヤュユョヨラリルレロヮワヲンヴー'

const punctuationSeed =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' +
  ' !?.,;:()[]{}<>/\\-_=+@#$%^&*~' +
  '·、。，！？；：“”‘’（）《》【】「」『』—…'

const staticSeed = [productSeed, commonChineseSeed, japaneseKanaSeed, punctuationSeed].join('')

const scanFileExtensions = new Set(['.ts', '.tsx', '.vue'])
const cjkTextPattern =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u3000-\u303f\uff00-\uffef]/gu

function addAscii(chars) {
  for (let charCode = 32; charCode <= 126; charCode += 1) {
    chars.add(String.fromCharCode(charCode))
  }
}

function addText(chars, text) {
  for (const char of text) {
    chars.add(char)
  }
}

async function findTextFiles(target) {
  const absoluteTarget = path.join(repoRoot, target)
  let stats

  try {
    stats = await fs.stat(absoluteTarget)
  } catch {
    return []
  }

  if (stats.isFile()) {
    return scanFileExtensions.has(path.extname(absoluteTarget)) ? [absoluteTarget] : []
  }

  if (!stats.isDirectory()) {
    return []
  }

  const entries = await fs.readdir(absoluteTarget, { withFileTypes: true })
  const nestedFiles = await Promise.all(
    entries.map((entry) => findTextFiles(path.join(target, entry.name)))
  )

  return nestedFiles.flat()
}

async function collectSubsetText() {
  const chars = new Set()
  addAscii(chars)
  addText(chars, staticSeed)

  const files = (await Promise.all(scanTargets.map((target) => findTextFiles(target)))).flat()

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.readFile(file, 'utf8')
      const matches = content.match(cjkTextPattern) ?? []
      addText(chars, matches.join(''))
    })
  )

  return Array.from(chars).sort().join('')
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

const subsetText = await collectSubsetText()

await fs.mkdir(fontDir, { recursive: true })

for (const job of fontJobs) {
  const inputPath = path.join(fontDir, job.input)
  const outputPath = path.join(fontDir, job.output)
  const inputBuffer = await fs.readFile(inputPath)
  const subsetBuffer = await subsetFont(inputBuffer, subsetText, {
    targetFormat: 'woff2'
  })

  await fs.writeFile(outputPath, subsetBuffer)

  console.log(
    `${path.relative(repoRoot, outputPath)}: ${formatSize(inputBuffer.length)} -> ${formatSize(
      subsetBuffer.length
    )}`
  )
}
