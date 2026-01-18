/**
 * 问题检测工具
 * 用于检测小说内容中的写作问题
 */

// 问题检测常量
export const ADJECTIVE_PATTERN = /(美丽|漂亮|壮观|雄伟|绚烂|辉煌|耀眼|璀璨|迷人|娇艳)/g;
export const CONNECTIVE_PATTERN = /(然后|接着|之后|于是|随后|紧接着)/g;
export const DOG_PLOTS = ['三角恋', '重生', '退婚', '打脸', '绿帽', '种马', '后宫', '逆天', '无敌', '系统'];
export const ROMANCE_KEYWORDS = [
  '心动', '暗恋', '表白', '告白', '暧昧', '亲吻', '拥抱', '吃醋',
  '恋爱', '爱情', '情人', '心上人', '喜欢', '爱上', '深情', '痴情',
  '多情', '薄情', '负心', '薄幸', '专情', '专一', '移情别恋', '虐恋',
  '痴缠', '缠绵', '温存', '悸动'
];
export const GROWTH_KEYWORDS = [
  '变强', '升级', '觉醒', '突破', '修炼', '提升', '进阶', '成长',
  '强大', '力量', '实力', '境遇', '境界', '阶位', '段位'
];

export type Issue = {
  id: string;
  type: 'error' | 'warning';
  message: string;
  line: number;
  suggestion: string;
};

export type CheckResult = {
  issues: Issue[];
  score: number;
  summary: {
    errorCount: number;
    warningCount: number;
  };
};

/**
 * 检测内容中的写作问题
 * @param content 要检测的内容
 * @param isPerformanceMode 是否为高效模式（只检测核心问题）
 * @returns 检测结果
 */
export function detectIssues(content: string, isPerformanceMode: boolean = false): CheckResult {
  const foundIssues: Issue[] = [];

  // 按行检测
  const lines = content.split('\n');

  // 提前构建检测需要的变量
  const hasTalkKeywords = ['说', '想', '做'].some(kw => content.includes(kw));

  lines.forEach((line, index) => {
    // 跳过空行
    if (!line.trim()) return;

    const lineLower = line.toLowerCase();

    // 快速检查：如果行太短，跳过大部分检测
    if (line.length < 20) return;

    // 检查华美的空洞（形容词堆砌）- 核心问题，必须检测
    const adjCount = (line.match(ADJECTIVE_PATTERN) || []).length;
    if (adjCount >= 3 && line.length > 50) {
      foundIssues.push({
        id: `${index}-flowery`,
        type: 'error',
        message: '存在"华美的空洞"，形容词过多，编辑判定为AI文特征',
        line: index + 1,
        suggestion: '避免堆砌华丽词藻，用具体动作、细节描写替代，注重内容而非形式',
      });
    }

    // 检查流水账（连接词过多）- 核心问题，必须检测
    const connectiveMatches = line.match(CONNECTIVE_PATTERN);
    if (connectiveMatches && connectiveMatches.length >= 3 && line.length < 200) {
      foundIssues.push({
        id: `${index}-log`,
        type: 'error',
        message: '流水账写法，罗列事件缺乏重点',
        line: index + 1,
        suggestion: '挑选关键事件深入描写，增加对话和环境渲染，而非简单罗列',
      });
    }

    // 检查常见狗血剧情 - 核心问题，必须检测
    if (DOG_PLOTS.some(plot => lineLower.includes(plot))) {
      const foundPlot = DOG_PLOTS.find(plot => lineLower.includes(plot));
      foundIssues.push({
        id: `${index}-${foundPlot}`,
        type: 'error',
        message: `包含常见狗血剧情"${foundPlot}"，套路化严重`,
        line: index + 1,
        suggestion: '尝试寻找新的冲突方式和情节推进方式，避免俗套',
      });
    }

    // 检查感情线作为主线的问题
    let romanceCount = 0;
    for (const kw of ROMANCE_KEYWORDS) {
      if (line.includes(kw)) romanceCount++;
      if (romanceCount >= 2) break; // 提前退出
    }

    // 如果一行中包含2个以上感情相关词汇，可能感情线比重过大
    if (romanceCount >= 2) {
      foundIssues.push({
        id: `${index}-romance-heavy`,
        type: 'error',
        message: '感情描写占比过高，禁止以感情线作为主线',
        line: index + 1,
        suggestion: '感情戏应为主线剧情的调味剂，而非主菜。请将重点放在外部使命（拯救世界、复仇、守护重要事物等）上',
      });
    }

    // 检查主角个人成长作为主线的问题
    if (lineLower.includes('为了')) {
      let growthCount = 0;
      for (const kw of GROWTH_KEYWORDS) {
        if (line.includes(kw)) growthCount++;
        if (growthCount > 0) break; // 提前退出
      }
      if (growthCount > 0) {
        foundIssues.push({
          id: `${index}-growth-mainline`,
          type: 'error',
          message: '疑似以主角个人成长（变强、升级）作为核心主线',
          line: index + 1,
          suggestion: '主角的变强和成长必须是为了完成外部使命的工具和手段，而非目标本身。请将主线回归到拯救世界、复仇、守护重要事物等外部使命',
        });
      }
    }

    // 检查逻辑问题（突然、竟然）- 高效模式下跳过
    if (!isPerformanceMode && (lineLower.match(/.*突然.*突然.*$/) || lineLower.match(/.*突然.*竟然.*$/))) {
      foundIssues.push({
        id: `${index}-logic`,
        type: 'warning',
        message: '情节转折缺乏逻辑铺垫',
        line: index + 1,
        suggestion: '提前埋下伏笔，让转折更自然，避免突兀',
      });
    }

    // 检查代词重复（"他"连续出现）- 高效模式下跳过
    if (!isPerformanceMode && line.includes('他') && line.match(/他.*他.*他/)) {
      foundIssues.push({
        id: `${index}-pronoun`,
        type: 'warning',
        message: '代词"他"重复使用，容易造成指代不清',
        line: index + 1,
        suggestion: '使用人名或具体描述替代部分代词，增强表达清晰度',
      });
    }
  });

  // 计算评分
  const errorCount = foundIssues.filter(i => i.type === 'error').length;
  const warningCount = foundIssues.filter(i => i.type === 'warning').length;

  // 简单的评分算法：基础100分，每个错误扣20分，每个警告扣5分
  let score = 100 - (errorCount * 20) - (warningCount * 5);
  score = Math.max(0, score); // 确保分数不为负

  return {
    issues: foundIssues,
    score,
    summary: {
      errorCount,
      warningCount
    }
  };
}

/**
 * 批量检测多个章节的问题
 * @param chapters 章节数组
 * @param isPerformanceMode 是否为高效模式
 * @returns 检测结果数组
 */
export function detectIssuesBatch(
  chapters: Array<{ id: string; title: string; content: string }>,
  isPerformanceMode: boolean = false
): Array<{ chapterId: string; chapterTitle: string; result: CheckResult }> {
  return chapters.map(chapter => ({
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    result: detectIssues(chapter.content, isPerformanceMode)
  }));
}
