/**
 * 写作规矩惩罚机制
 * 严格遵守以下规矩，违者将受到严厉惩罚
 */

// 惩罚等级定义
export enum PenaltyLevel {
  // 轻度：扣分 + 建议
  LIGHT = 'light',
  // 中度：降级评分 + 强制修改
  MODERATE = 'moderate',
  // 严重：立即重写 + 扣减字数
  SEVERE = 'severe',
  // 极度：废弃章节 + 重新生成
  CRITICAL = 'critical',
}

// 惩罚规则
export interface PenaltyRule {
  id: string;
  name: string;
  level: PenaltyLevel;
  description: string;
  punishment: string; // 惩罚措施
  detectPattern: string[]; // 检测关键词/模式
}

// 核心写作规矩（严格遵守）
export const CORE_RULES = [
  {
    id: 'no-romance-main-plot',
    name: '禁止感情线作为主线',
    level: PenaltyLevel.CRITICAL,
    description: '全文禁止以感情线作为主线',
    punishment: '废弃当前章节，立即重写，扣减500字，警告3次',
    detectPattern: [
      '主线', '核心剧情', '故事主线',
      ...Array(10).fill('感情'), // 强权重
      ...Array(10).fill('爱情'),
      '三角恋', '多角恋', '感情纠葛', '情感纠葛'
    ]
  },
  {
    id: 'no-growth-main-plot',
    name: '禁止主角个人成长作为核心主线',
    level: PenaltyLevel.CRITICAL,
    description: '全文禁止以主角个人成长作为核心主线',
    punishment: '废弃当前章节，立即重写，扣减500字，警告3次',
    detectPattern: [
      '主线', '核心剧情', '故事主线', '核心目标',
      ...Array(10).fill('变强'),
      ...Array(10).fill('升级'),
      '修炼主线', '成长主线', '实力提升为主线',
      '变强是目标', '升级是目标', '突破是目标'
    ]
  },
  {
    id: 'novel-type-restriction',
    name: '小说类型限定',
    level: PenaltyLevel.CRITICAL,
    description: '小说类型限定：玄幻、奇幻、科幻、仙侠、魔幻、异能、末世',
    punishment: '检测到不符合类型的小说元素，立即重写',
    detectPattern: [
      '都市', '校园', '职场', '历史', '军事', '武侠', '言情', '耽美',
      '穿越', '重生', '系统', '种田', '商战'
    ]
  }
];

// AI写作弊端惩罚规则（重新设计，降低误判）
export const AI_WRITING_PENALTIES = [
  {
    id: 'flowery-empty',
    name: '华美空洞',
    level: PenaltyLevel.MODERATE, // 降低为中度
    description: '每句不要使用3个以上形容词（美丽、漂亮、壮观、雄伟、绚烂、辉煌等）',
    punishment: '检测到华美空洞描写，降级评分至60分，建议修改',
    detectPattern: [
      '美丽', '漂亮', '壮观', '雄伟', '绚烂', '辉煌', '耀眼', '璀璨', '迷人', '娇艳',
      '瑰丽', '绚丽', '华丽', '辉煌', '灿烂', '绚丽多彩', '美轮美奂', '美不胜收',
      '美不胜', '美丽动人', '美丽绝伦', '美丽非凡', '美丽无双'
    ]
  },
  {
    id: 'logic-bug',
    name: '逻辑bug',
    level: PenaltyLevel.MODERATE, // 降低为中度
    description: '确保人物行为符合设定，前后一致',
    punishment: '检测到逻辑矛盾，降级评分至60分，建议修复',
    detectPattern: [
      '但是', '然而', '可是', '不过',
      '突然', '忽然', '意外', '出乎意料', '意想不到'
    ]
  },
  {
    id: 'rhythm-break',
    name: '破坏节奏',
    level: PenaltyLevel.LIGHT, // 降低为轻度
    description: '确保剧情推进节奏合理，不拖沓不突兀',
    punishment: '检测到节奏问题，降级评分至75分，建议调整',
    detectPattern: [
      '缓缓', '慢慢', '渐渐', '逐渐', '一点一点',
      '刹那', '瞬间', '顷刻', '转眼'
    ]
  },
  {
    id: 'no-plot-push',
    name: '不推剧情',
    level: PenaltyLevel.MODERATE, // 降低为中度
    description: '每段都必须推进剧情，不能有无效描写',
    punishment: '检测到无效描写，降级评分至60分，建议删除',
    detectPattern: [
      '想着想着', '心中想', '心中想着',
      '不由得', '不禁', '不由自主'
    ]
  },
  {
    id: 'content-water',
    name: '内容注水',
    level: PenaltyLevel.SEVERE,
    description: '禁止凑字数、重复描写、无效对话',
    punishment: '检测到内容注水，降级评分至40分，建议删除',
    detectPattern: [
      '说道道', '说道说道',
      '啊啊啊啊', '啊啊啊啊啊', '啊啊啊啊啊啊'
    ]
  },
  {
    id: 'flat-character',
    name: '人物扁平',
    level: PenaltyLevel.LIGHT, // 降低为轻度
    description: '人物必须有鲜明的性格特点和动机',
    punishment: '检测到人物扁平，降级评分至75分，建议丰富',
    detectPattern: [
      '他说', '她问', '他道', '她道',
      '说', '问', '道', '说道', '问道'
    ]
  },
  {
    id: 'boring-dialogue',
    name: '对话平淡',
    level: PenaltyLevel.LIGHT, // 降低为轻度
    description: '对话必须有张力，体现人物性格',
    punishment: '检测到对话平淡，降级评分至75分，建议增强',
    detectPattern: [
      '是吗', '是的', '好的', '行吧', '好吧',
      '嗯', '嗯嗯', '嗯嗯嗯',
      '哦', '哦哦', '哦哦哦',
      '啊', '啊啊', '啊啊啊'
    ]
  },
  {
    id: 'running-account',
    name: '流水账',
    level: PenaltyLevel.MODERATE, // 降低为中度
    description: '避免连续使用"然后"、"接着"、"之后"、"于是"等连接词',
    punishment: '检测到流水账，降级评分至60分，建议重写',
    detectPattern: [
      '然后', '接着', '之后', '于是', '随后', '紧接着'
    ]
  },
  {
    id: 'cliché-plot',
    name: '套路化',
    level: PenaltyLevel.CRITICAL, // 保持严重
    description: '严禁三角恋、退婚、打脸、绿帽、种马、后宫等套路化情节',
    punishment: '检测到套路化情节，废弃当前章节，立即重写',
    detectPattern: [
      '三角恋', '退婚', '打脸', '绿帽', '种马', '后宫',
      '未婚妻', '前任', '前女友', '前男友',
      '悔婚'
    ]
  }
];

// 人物出现/消失惩罚规则
export const CHARACTER_PENALTIES = [
  {
    id: 'character-appear-no-reason',
    name: '人物凭空出现',
    level: PenaltyLevel.SEVERE,
    description: '每个人物出场都必须有明确原因和铺垫',
    punishment: '检测到人物凭空出现，降级评分至40分，补充出场铺垫，扣减300字',
    detectPattern: [
      '突然出现', '忽然出现', '不知何时出现',
      '一个人', '一个人影', '一个人声',
      '突然从', '忽然从', '不知从哪'
    ]
  },
  {
    id: 'character-disappear-no-reason',
    name: '人物凭空消失',
    level: PenaltyLevel.SEVERE,
    description: '每个人物消失都必须有明确原因',
    punishment: '检测到人物凭空消失，降级评分至40分，补充消失原因，扣减300字',
    detectPattern: [
      '不见了', '消失不见了', '不知去向',
      '不知何时', '突然不见了', '忽然不见了',
      '再也看不见', '再也找不到'
    ]
  }
];

// 节奏和悬念惩罚规则
export const RHYTHM_PENALTIES = [
  {
    id: 'no-suspense',
    name: '悬念缺失',
    level: PenaltyLevel.MODERATE,
    description: '每章必须有悬念或伏笔，保持读者阅读兴趣',
    punishment: '检测到悬念缺失，降级评分至60分，补充悬念，扣减100字',
    detectPattern: [
      '就这样', '就这样吧', '就这样结束了',
      '结束', '结束', '结束', '结束',
      '最后', '最后', '最后', '最后'
    ]
  },
  {
    id: 'boring-content',
    name: '内容平淡无趣',
    level: PenaltyLevel.SEVERE,
    description: '确保内容紧凑、有悬念，避免平淡无趣',
    punishment: '检测到内容平淡，降级评分至50分，增加冲突和悬念，扣减200字',
    detectPattern: [
      '平淡', '平淡无奇', '平淡无味',
      '没什么', '没什么', '没什么',
      '很普通', '很普通', '很普通',
      '就这样', '就这样', '就这样'
    ]
  }
];

// 所有惩罚规则汇总
export const ALL_PENALTY_RULES = [
  ...CORE_RULES,
  ...AI_WRITING_PENALTIES,
  ...CHARACTER_PENALTIES,
  ...RHYTHM_PENALTIES,
];

// 惩罚机制配置（优化后，更合理）
export const PENALTY_CONFIG = {
  // 评分惩罚系数（降低严厉程度）
  scorePenalty: {
    [PenaltyLevel.LIGHT]: -2,       // 轻度：扣2分
    [PenaltyLevel.MODERATE]: -5,    // 中度：扣5分
    [PenaltyLevel.SEVERE]: -10,     // 严重：扣10分
    [PenaltyLevel.CRITICAL]: -30,   // 极度：扣30分
  },

  // 字数惩罚（保持不变）
  wordCountPenalty: {
    [PenaltyLevel.LIGHT]: 50,      // 轻度：扣减50字
    [PenaltyLevel.MODERATE]: 100,  // 中度：扣减100字
    [PenaltyLevel.SEVERE]: 200,    // 严重：扣减200字
    [PenaltyLevel.CRITICAL]: 500,  // 极度：扣减500字
  },

  // 重写阈值（评分低于此值需要重写）
  rewriteThreshold: 70,  // 提高到70分

  // 警告阈值（评分低于此值需要警告）
  warningThreshold: 85,  // 提高到85分
};

/**
 * 生成惩罚提示文本
 * @param level 惩罚等级
 * @returns 提示文本
 */
export function getPenaltyMessage(level: PenaltyLevel): string {
  switch (level) {
    case PenaltyLevel.LIGHT:
      return '⚠️ 轻度违规：建议修改，扣5分';
    case PenaltyLevel.MODERATE:
      return '⚡ 中度违规：强制修改，扣15分';
    case PenaltyLevel.SEVERE:
      return '🔥 严重违规：立即重写，扣30分';
    case PenaltyLevel.CRITICAL:
      return '💥 极度违规：废弃章节，立即重写，扣50分';
    default:
      return '⚠️ 检测到问题';
  }
}

/**
 * 计算惩罚后的评分
 * @param baseScore 基础评分
 * @param penalties 惩罚列表
 * @returns 惩罚后评分
 */
export function calculatePenaltyScore(baseScore: number, penalties: PenaltyLevel[]): number {
  let finalScore = baseScore;

  for (const penalty of penalties) {
    finalScore += PENALTY_CONFIG.scorePenalty[penalty];
  }

  // 确保评分不低于0
  return Math.max(0, finalScore);
}

/**
 * 检测内容是否违反规矩
 * @param content 内容
 * @returns 违规结果
 */
export interface PenaltyResult {
  violations: Array<{
    ruleId: string;
    ruleName: string;
    level: PenaltyLevel;
    description: string;
    punishment: string;
  }>;
  totalPenaltyScore: number;
  shouldRewrite: boolean;
  shouldWarn: boolean;
}

export function checkContentPenalties(content: string): PenaltyResult {
  const violations: PenaltyResult['violations'] = [];
  let totalPenaltyScore = 0;

  for (const rule of ALL_PENALTY_RULES) {
    for (const pattern of rule.detectPattern) {
      if (content.includes(pattern)) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          level: rule.level,
          description: rule.description,
          punishment: rule.punishment,
        });

        totalPenaltyScore += PENALTY_CONFIG.scorePenalty[rule.level];

        // 每个规则只检测一次
        break;
      }
    }
  }

  // 判断是否需要重写
  const shouldRewrite = violations.some(v => v.level === PenaltyLevel.CRITICAL);

  // 判断是否需要警告
  const shouldWarn = totalPenaltyScore < -20;

  return {
    violations,
    totalPenaltyScore,
    shouldRewrite,
    shouldWarn,
  };
}

/**
 * 智能检测内容是否违反规矩（降低误判率）
 * @param content 内容
 * @param isStrictMode 是否使用严格模式（默认false）
 * @returns 违规结果
 */
export function checkContentPenaltiesSmart(content: string, isStrictMode: boolean = false): PenaltyResult {
  const violations: PenaltyResult['violations'] = [];
  let totalPenaltyScore = 0;

  // 核心规则（严格检测，不能放宽）
  const coreRules = ALL_PENALTY_RULES.filter(rule =>
    rule.level === PenaltyLevel.CRITICAL &&
    (rule.id === 'no-romance-main-plot' ||
     rule.id === 'no-growth-main-plot' ||
     rule.id === 'novel-type-restriction' ||
     rule.id === 'cliché-plot')
  );

  // 次要规则（放宽检测）
  const minorRules = ALL_PENALTY_RULES.filter(rule => !coreRules.includes(rule));

  // 1. 严格检测核心规则（不能放宽）
  for (const rule of coreRules) {
    let foundViolation = false;

    for (const pattern of rule.detectPattern) {
      if (content.includes(pattern)) {
        foundViolation = true;
        break;
      }
    }

    if (foundViolation) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        level: rule.level,
        description: rule.description,
        punishment: rule.punishment,
      });

      totalPenaltyScore += PENALTY_CONFIG.scorePenalty[rule.level];
    }
  }

  // 2. 智能检测次要规则（大幅降低误判）
  for (const rule of minorRules) {
    let matchCount = 0;
    const matches: string[] = [];

    for (const pattern of rule.detectPattern) {
      // 使用正则查找所有匹配
      const regex = new RegExp(pattern, 'gi');
      const patternMatches = content.match(regex);
      if (patternMatches) {
        matchCount += patternMatches.length;
        matches.push(...patternMatches);
      }
    }

    // 大幅提高阈值，避免误判
    let shouldReport = false;
    let penaltyMultiplier = 1;

    if (isStrictMode) {
      // 严格模式：出现2次才报告
      shouldReport = matchCount >= 2;
    } else {
      // 正常模式：根据规则类型设置更高阈值
      switch (rule.level) {
        case PenaltyLevel.SEVERE:
          // SEVERE规则：需要出现10次以上（大幅提高）
          shouldReport = matchCount >= 10;
          penaltyMultiplier = Math.min(matchCount / 10, 2); // 最多2倍惩罚
          break;
        case PenaltyLevel.MODERATE:
          // MODERATE规则：需要出现15次以上（大幅提高）
          shouldReport = matchCount >= 15;
          penaltyMultiplier = Math.min(matchCount / 15, 1.5); // 最多1.5倍惩罚
          break;
        case PenaltyLevel.LIGHT:
          // LIGHT规则：需要出现20次以上（大幅提高）
          shouldReport = matchCount >= 20;
          penaltyMultiplier = Math.min(matchCount / 20, 1.2); // 最多1.2倍惩罚
          break;
        default:
          shouldReport = matchCount > 0;
      }
    }

    if (shouldReport) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        level: rule.level,
        description: `${rule.description}（检测到${matchCount}次）`,
        punishment: rule.punishment,
      });

      totalPenaltyScore += Math.round(PENALTY_CONFIG.scorePenalty[rule.level] * penaltyMultiplier);
    }
  }

  // 判断是否需要重写
  const shouldRewrite = violations.some(v => v.level === PenaltyLevel.CRITICAL);

  // 判断是否需要警告
  const shouldWarn = totalPenaltyScore < -10; // 降低到-10分

  return {
    violations,
    totalPenaltyScore,
    shouldRewrite,
    shouldWarn,
  };
}
