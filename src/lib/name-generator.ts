/**
 * 起名系统 - 专业的网络小说人物命名工具
 * 支持玄幻、仙侠、奇幻、科幻等多种风格
 * 根据人物属性生成更真实、好听的名字
 */

export interface NameGeneratorOptions {
  gender?: 'male' | 'female' | 'neutral';
  style?: 'fantasy' | 'xianxia' | 'magic' | 'scifi' | 'historical' | 'modern';
  role?: 'protagonist' | 'antagonist' | 'side' | 'elder' | 'young';
  personality?: string;
  background?: string;
  era?: string;
  region?: string;
  avoidNames?: string[]; // 避免使用的名字
}

export interface GeneratedName {
  name: string;
  meaning?: string;
  style: string;
  gender: string;
}

// 姓氏库（按照风格分类）
const SURNAMES = {
  // 古风姓氏（适合仙侠、玄幻、历史）
  ancient: [
    '叶', '萧', '林', '楚', '顾', '苏', '秦', '李', '白', '司马', '欧阳', '上官', '轩辕',
    '独孤', '慕容', '皇甫', '诸葛', '百里', '东方', '南宫', '北堂', '西门', '宇文',
    '慕容', '澹台', '公孙', '长孙', '轩辕', '令狐', '钟离', '宇文', '长孙', '慕容',
    '澹台', '公羊', '淳于', '单于', '太叔', '申屠', '公孙', '仲孙', '轩辕', '令狐',
    '钟离', '宇文', '长孙', '慕容', '鲜于', '闾丘', '左丘', '东门', '西门', '商',
    '牟', '佘', '佴', '伯', '赏', '南宫', '墨哈', '谯', '笪', '年', '爱', '阳', '佟'
  ],
  // 奇幻姓氏（适合奇幻、魔法）
  fantasy: [
    '云', '风', '雷', '雪', '月', '星', '霜', '冰', '炎', '紫', '墨', '青', '白',
    '苍', '凌', '幻', '影', '梦', '灵', '幽', '冥', '夜', '天', '地', '圣', '神',
    '魔', '龙', '凤', '鹤', '鹏', '麟', '狐', '狼', '虎', '鹰', '豹', '熊', '狮',
    '岚', '霓', '霞', '霏', '雯', '霁', '雯', '霰', '露', '霜', '雪', '冰', '霁',
    '霄', '霂', '霖', '霓', '霞', '霏', '雯', '霁', '霰', '露', '霜', '雪', '冰'
  ],
  // 科幻姓氏（适合科幻、未来）
  scifi: [
    '墨', '零', '星', '影', '天', '宇', '空', '光', '暗', '灵', '幻', '梦', '云',
    '风', '雷', '电', '磁', '波', '粒子', '量子', '星际', '银河', '宇宙', '时空',
    '维度', '矩阵', '代码', '程序', '数据', '网络', '虚拟', '现实', '量子', '芯片'
  ],
  // 现代姓氏（适合现代都市）
  modern: [
    '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马',
    '朱', '胡', '郭', '何', '林', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许',
    '韩', '冯', '邓', '曹', '彭', '曾', '萧', '田', '董', '袁', '潘', '于', '蒋',
    '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢',
    '姜', '崔', '钟', '谭', '陆', '汪', '范', '金', '石', '廖', '贾', '夏', '韦'
  ]
};

// 名字库（按照性别和风格分类）
const NAMES = {
  male: {
    fantasy: [
      '辰', '昊', '阳', '轩', '修', '昊', '辰', '风', '云', '雷', '炎', '墨', '影',
      '天', '玄', '苍', '凌', '幻', '幻', '幽', '冥', '夜', '寒', '冰', '霄', '霂',
      '霖', '云', '风', '雷', '电', '炎', '霜', '雪', '冰', '凌', '天', '玄', '苍',
      '昊', '辰', '阳', '轩', '修', '瀚', '宇', '星', '月', '日', '夜', '霄', '霁',
      '岚', '霏', '雯', '霓', '霞', '露', '霖', '霂', '霄', '霁', '岚', '霏', '雯',
      '胤', '禛', '煜', '祺', '睿', '瀚', '哲', '墨', '云', '风', '雷', '电', '炎',
      '修', '冥', '幽', '影', '幻', '灵', '神', '圣', '魔', '龙', '凤', '鹏', '麟'
    ],
    xianxia: [
      '剑', '云', '风', '道', '真', '玄', '天', '清', '虚', '无', '空', '灵', '悟',
      '修', '炼', '得', '成', '仙', '道', '法', '术', '神', '圣', '佛', '僧', '道',
      '子', '君', '辰', '昊', '阳', '轩', '修', '萧', '楚', '顾', '苏', '秦', '李',
      '白', '墨', '凌', '风', '云', '雷', '剑', '道', '真', '玄', '天', '清', '虚',
      '灵', '悟', '修', '炼', '得', '成', '仙', '法', '术', '神', '圣', '佛', '僧'
    ],
    scifi: [
      '星', '辰', '宇', '航', '天', '光', '电', '磁', '波', '粒', '子', '量', '云',
      '数据', '代码', '程序', '网络', '虚拟', '现实', '量子', '芯片', '矩阵', '维度',
      '时空', '银河', '星际', '宇宙', '天体', '恒星', '行星', '卫星', '彗星', '流星',
      '光', '暗', '影', '幻', '梦', '灵', '虚', '无', '空', '零', '一', '二', '三'
    ],
    historical: [
      '弘', '翊', '钧', '柏', '瀚', '佑', '宸', '峻', '嘉', '凯', '铭', '铭', '睿',
      '庭', '伟', '彦', '翔', '旭', '轩', '泽', '振', '志', '智', '中', '子', '仁',
      '义', '礼', '智', '信', '忠', '孝', '廉', '耻', '温', '良', '恭', '俭', '让'
    ],
    modern: [
      '伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '超', '明', '刚', '平', '辉',
      '鹏', '飞', '建华', '国强', '文明', '志强', '伟民', '建国', '建军', '国庆',
      '子轩', '浩然', '宇轩', '梓豪', '浩宇', '子涵', '浩轩', '宇豪', '梓轩', '浩然'
    ]
  },
  female: {
    fantasy: [
      '璃', '瑶', '雪', '月', '霜', '冰', '灵', '幻', '梦', '云', '风', '雨', '霞',
      '霓', '雯', '霏', '岚', '露', '霁', '雯', '霰', '雯', '霏', '岚', '霓', '霞',
      '洛', '璃', '瑶', '雪', '月', '霜', '冰', '灵', '幻', '梦', '云', '风', '雨',
      '霞', '霓', '雯', '霏', '岚', '露', '霁', '雯', '霰', '雯', '霏', '岚', '霓',
      '璃', '瑶', '雪', '月', '霜', '冰', '灵', '幻', '梦', '云', '风', '雨', '霞',
      '婉', '怡', '婷', '静', '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏',
      '霞', '雯', '霓', '露', '霖', '霂', '霄', '霁', '岚', '霏', '雯', '霓', '霞'
    ],
    xianxia: [
      '仙', '瑶', '月', '雪', '霜', '冰', '灵', '清', '雅', '静', '婉', '怡', '婷',
      '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏', '霞', '雯', '霓', '露',
      '霖', '霂', '霄', '霁', '岚', '霏', '雯', '霓', '霞', '仙', '瑶', '月', '雪',
      '霜', '冰', '灵', '清', '雅', '静', '婉', '怡', '婷', '雪', '月', '霜', '冰',
      '凌', '芸', '萱', '菲', '霏', '霞', '雯', '霓', '露', '霖', '霂', '霄', '霁'
    ],
    scifi: [
      '星', '月', '光', '影', '幻', '梦', '灵', '云', '风', '雨', '雪', '冰', '霜',
      '霓', '雯', '霏', '岚', '露', '霁', '雯', '霰', '雯', '霏', '岚', '霓', '霞',
      '星', '辰', '宇', '航', '天', '光', '电', '磁', '波', '粒', '子', '量', '云',
      '数据', '代码', '程序', '网络', '虚拟', '现实', '量子', '芯片', '矩阵', '维度'
    ],
    historical: [
      '婉', '怡', '婷', '静', '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏',
      '霞', '雯', '霓', '露', '霖', '霂', '霄', '霁', '岚', '霏', '雯', '霓', '霞',
      '婉', '怡', '婷', '静', '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏',
      '霞', '雯', '霓', '露', '霖', '霂', '霄', '霁', '岚', '霏', '雯', '霓', '霞'
    ],
    modern: [
      '婷', '静', '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏', '霞', '雯',
      '霓', '露', '霖', '霂', '霄', '霁', '岚', '霏', '雯', '霓', '霞', '婉', '怡',
      '子萱', '雨桐', '欣怡', '诗涵', '梦琪', '雅琳', '梓涵', '雨欣', '可馨', '思雨'
    ]
  },
  neutral: {
    fantasy: [
      '辰', '星', '风', '云', '灵', '幻', '梦', '玄', '天', '宇', '空', '墨', '影',
      '虚', '无', '真', '道', '法', '术', '神', '圣', '魔', '仙', '佛', '僧', '道'
    ],
    xianxia: [
      '灵', '虚', '无', '真', '道', '法', '术', '神', '圣', '魔', '仙', '佛', '僧',
      '道', '子', '君', '辰', '昊', '阳', '轩', '修', '云', '风', '雷', '剑', '道'
    ],
    scifi: [
      '星', '辰', '宇', '航', '天', '光', '电', '磁', '波', '粒', '子', '量', '云',
      '数据', '代码', '程序', '网络', '虚拟', '现实', '量子', '芯片', '矩阵', '维度'
    ],
    historical: [
      '弘', '翊', '钧', '柏', '瀚', '佑', '宸', '峻', '嘉', '凯', '铭', '睿', '庭',
      '婉', '怡', '婷', '静', '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏'
    ],
    modern: [
      '明', '平', '伟', '强', '磊', '洋', '勇', '军', '杰', '涛', '超', '婷', '静',
      '雪', '月', '霜', '冰', '凌', '芸', '萱', '菲', '霏', '霞', '雯', '霓', '露'
    ]
  }
};

// 名字寓意映射
const NAME_MEANINGS: Record<string, string> = {
  // 常见字的寓意
  '辰': '星辰，象征光明和希望',
  '昊': '广阔，象征胸襟开阔',
  '阳': '阳光，象征温暖和活力',
  '轩': '轩昂，象征气质高雅',
  '修': '修身，象征品格高尚',
  '云': '云彩，象征自由和飘逸',
  '风': '风韵，象征自由洒脱',
  '雷': '雷霆，象征力量和威严',
  '炎': '火焰，象征热情和活力',
  '墨': '墨色，象征深沉和神秘',
  '影': '影子，象征神秘和独特',
  '天': '天空，象征广阔和无限',
  '玄': '玄妙，象征智慧和神秘',
  '苍': '苍穹，象征高远和广阔',
  '凌': '凌云，象征志向高远',
  '幻': '梦幻，象征想象力和创造力',
  '幽': '幽静，象征宁静和深邃',
  '冥': '冥冥，象征智慧和深邃',
  '夜': '夜晚，象征神秘和浪漫',
  '寒': '寒冷，象征坚韧和冷静',
  '冰': '冰霜，象征纯洁和坚韧',
  '霄': '云霄，象征高远和壮志',
  '霖': '甘霖，象征恩泽和滋润',
  '璃': '琉璃，象征美丽和珍贵',
  '瑶': '美玉，象征高贵和美好',
  '雪': '雪花，象征纯洁和美丽',
  '月': '月亮，象征温柔和美好',
  '霜': '霜雪，象征纯洁和坚强',
  '灵': '灵气，象征聪明和灵动',
  '梦': '梦想，象征美好和追求',
  '霞': '彩霞，象征美丽和绚烂',
  '霓': '霓虹，象征美丽和梦幻',
  '雯': '云纹，象征美丽和优雅',
  '霏': '霏霏，象征温柔和细腻',
  '岚': '山岚，象征朦胧和美丽',
  '露': '露珠，象征纯洁和清新',
  '霁': '雨霁，象征清新和希望',
  '霰': '霰雪，象征美丽和纯净',
  '霂': '细雨，象征温柔和滋润',
  '剑': '剑气，象征锋利和力量',
  '道': '道理，象征智慧和真理',
  '真': '真实，象征真诚和纯粹',
  '清': '清澈，象征纯洁和透明',
  '虚': '虚心，象征谦逊和包容',
  '无': '无为，象征超脱和智慧',
  '空': '空灵，象征超脱和自在',
  '悟': '领悟，象征智慧和觉醒',
  '仙': '仙人，象征超脱和美好',
  '法': '法则，象征智慧和规律',
  '术': '术法，象征能力和方法',
  '神': '神圣，象征崇高和庄严',
  '圣': '圣洁，象征高尚和纯净',
  '佛': '佛性，象征智慧和慈悲',
  '僧': '僧侣，象征虔诚和超脱',
  '星': '星辰，象征光明和希望',
  '宇': '宇宙，象征广阔和无限',
  '航': '航行，象征探索和进取',
  '光': '光芒，象征希望和温暖',
  '电': '电力，象征能量和速度',
  '磁': '磁力，象征吸引和力量',
  '波': '波动，象征变化和节奏',
  '粒': '粒子，象征微观和精确',
  '子': '子曰，象征智慧和传承',
  '量子': '量子，象征神秘和科技',
  '数据': '数据，象征科技和信息',
  '代码': '代码，象征科技和创造',
  '程序': '程序，象征逻辑和秩序',
  '网络': '网络，象征连接和共享',
  '虚拟': '虚拟，象征创新和想象',
  '现实': '现实，象征务实和真实',
  '芯': '芯片，象征科技和智慧',
  '矩': '矩阵，象征结构和秩序',
  '维': '维度，象征深度和广度',
  '时': '时间，象征历史和未来',
  '银': '银河，象征广阔和美好',
  '河': '河流，象征流动和永恒',
  '际': '边际，象征边界和探索',
  '恒': '恒星，象征永恒和光辉',
  '行': '行星，象征运行和规律',
  '卫': '卫星，象征守护和陪伴',
  '彗': '彗星，象征惊艳和独特',
  '流': '流星，象征美好和短暂',
  '婉': '婉约，象征温柔和优雅',
  '怡': '怡然，象征快乐和舒适',
  '婷': '婷婷，象征美好和优雅',
  '静': '宁静，象征平和和安详',
  '芸': '芸芸，象征众多和繁华',
  '萱': '萱草，象征美丽和温馨',
  '菲': '芳菲，象征美丽和芬芳',
  '弘': '弘大，象征宏大和广阔',
  '翊': '翊翔，象征高飞和进取',
  '钧': '钧重，象征重要和珍贵',
  '柏': '柏树，象征坚韧和长青',
  '瀚': '瀚海，象征广阔和深邃',
  '佑': '保佑，象征庇护和帮助',
  '宸': '宸宇，象征高远和尊贵',
  '峻': '峻拔，象征高大和挺拔',
  '嘉': '嘉美，象征美好和优秀',
  '凯': '凯旋，象征胜利和荣耀',
  '铭': '铭记，象征记忆和传承',
  '睿': '睿智，象征智慧和明理',
  '庭': '庭院，象征温馨和归属',
  '伟': '伟大，象征宏大和杰出',
  '彦': '俊彦，象征才华和优秀',
  '翔': '翱翔，象征高飞和自由',
  '旭': '旭日，象征希望和新生',
  '泽': '恩泽，象征恩惠和滋润',
  '振': '振兴，象征奋发和振兴',
  '志': '志向，象征理想和抱负',
  '智': '智慧，象征聪明和明理',
  '中': '中正，象征公正和稳重',
  '仁': '仁爱，象征善良和慈悲',
  '义': '正义，象征公正和道义',
  '礼': '礼仪，象征修养和礼貌',
  '信': '诚信，象征诚实和可靠',
  '忠': '忠诚，象征忠心和奉献',
  '孝': '孝顺，象征感恩和尊敬',
  '廉': '廉洁，象征清廉和高尚',
  '耻': '知耻，象征道德和自律',
  '温': '温和，象征温柔和善良',
  '良': '善良，象征美好和纯粹',
  '恭': '恭敬，象征礼貌和尊重',
  '俭': '俭朴，象征节约和朴素',
  '让': '谦让，象征宽容和礼让'
};

/**
 * 生成随机名字
 */
export function generateRandomName(options: NameGeneratorOptions = {}): GeneratedName {
  const {
    gender = 'male',
    style = 'fantasy',
    role = 'side',
    personality,
    background,
    avoidNames = []
  } = options;

  // 根据风格选择姓氏库
  let surnamePool: string[] = [];
  if (style === 'fantasy' || style === 'xianxia') {
    surnamePool = [...SURNAMES.ancient, ...SURNAMES.fantasy];
  } else if (style === 'scifi') {
    surnamePool = [...SURNAMES.scifi, ...SURNAMES.modern];
  } else if (style === 'historical') {
    surnamePool = SURNAMES.ancient;
  } else {
    surnamePool = SURNAMES.modern;
  }

  // 根据角色类型调整姓氏（主角使用复姓概率更高）
  let surname: string;
  if (role === 'protagonist' && Math.random() < 0.3) {
    // 主角有30%概率使用复姓
    const compoundSurnames = surnamePool.filter(s => s.length > 1);
    surname = compoundSurnames[Math.floor(Math.random() * compoundSurnames.length)];
  } else {
    surname = surnamePool[Math.floor(Math.random() * surnamePool.length)];
  }

  // 根据性别和风格选择名字库
  const namePool = NAMES[gender]?.[style as keyof typeof NAMES.male] || NAMES[gender].fantasy;

  // 生成名字（1-2个字）
  const nameLength = Math.random() < 0.6 ? 1 : 2;
  let givenName = '';

  for (let i = 0; i < nameLength; i++) {
    const char = namePool[Math.floor(Math.random() * namePool.length)];
    givenName += char;
  }

  const fullName = surname + givenName;

  // 检查是否在避免列表中
  if (avoidNames.includes(fullName)) {
    return generateRandomName(options);
  }

  // 生成寓意
  const meaning = generateNameMeaning(givenName, personality, background);

  return {
    name: fullName,
    meaning,
    style,
    gender
  };
}

/**
 * 批量生成名字
 */
export function generateMultipleNames(
  count: number,
  options: NameGeneratorOptions = {}
): GeneratedName[] {
  const names: GeneratedName[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: GeneratedName;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      name = generateRandomName({
        ...options,
        avoidNames: Array.from(usedNames)
      });
      attempts++;
    } while (usedNames.has(name.name) && attempts < maxAttempts);

    if (attempts < maxAttempts) {
      names.push(name);
      usedNames.add(name.name);
    }
  }

  return names;
}

/**
 * 根据人物属性生成名字（AI辅助）
 */
export async function generateNameByAttributes(
  attributes: {
    gender?: string;
    role?: string;
    personality?: string;
    background?: string;
    era?: string;
    region?: string;
  },
  style: string = 'fantasy'
): Promise<GeneratedName> {
  // 先使用基础算法生成
  const baseOptions: NameGeneratorOptions = {
    gender: (attributes.gender as 'male' | 'female' | 'neutral') || 'male',
    style: style as any,
    role: (attributes.role as any) || 'side',
    personality: attributes.personality,
    background: attributes.background
  };

  const baseName = generateRandomName(baseOptions);

  // 如果有详细的人物属性，可以调用AI优化名字
  if (attributes.personality || attributes.background) {
    try {
      const response = await fetch('/api/ai/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...attributes,
          style,
          baseName: baseName.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.name && data.name !== baseName.name) {
          return {
            name: data.name,
            meaning: data.meaning || baseName.meaning,
            style,
            gender: baseName.gender
          };
        }
      }
    } catch (error) {
      console.error('AI优化名字失败，使用基础生成的名字:', error);
    }
  }

  return baseName;
}

/**
 * 生成名字寓意
 */
function generateNameMeaning(
  name: string,
  personality?: string,
  background?: string
): string {
  const meanings: string[] = [];

  // 为每个字添加寓意
  for (const char of name) {
    if (NAME_MEANINGS[char]) {
      meanings.push(NAME_MEANINGS[char]);
    }
  }

  // 如果有性格或背景，添加相关寓意
  if (personality) {
    if (personality.includes('冷')) {
      meanings.push('寓意性格冷静沉稳');
    } else if (personality.includes('热情') || personality.includes('活泼')) {
      meanings.push('寓意性格热情开朗');
    } else if (personality.includes('智慧') || personality.includes('聪明')) {
      meanings.push('寓意充满智慧和洞察力');
    }
  }

  if (background) {
    if (background.includes('皇室') || background.includes('贵族')) {
      meanings.push('寓意出身高贵');
    } else if (background.includes('平民') || background.includes('孤儿')) {
      meanings.push('寓意坚韧不拔');
    }
  }

  return meanings.length > 0 ? meanings.join('，') : '寓意美好和独特';
}

/**
 * 验证名字质量
 */
export function validateNameQuality(name: string): {
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // 检查名字长度
  if (name.length < 2) {
    issues.push('名字过短');
    suggestions.push('建议使用2-4个字的名字');
    score -= 20;
  } else if (name.length > 4) {
    issues.push('名字过长');
    suggestions.push('建议使用2-4个字的名字');
    score -= 20;
  }

  // 检查是否过于简单
  if (name.length === 2) {
    const commonChars = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄'];
    if (commonChars.includes(name[0]) && commonChars.includes(name[1])) {
      issues.push('名字过于普通');
      suggestions.push('建议使用更具特色的姓氏或名字');
      score -= 15;
    }
  }

  // 检查重复字
  const uniqueChars = new Set(name.split(''));
  if (uniqueChars.size < name.length) {
    issues.push('名字中有重复字');
    suggestions.push('建议避免使用重复的字');
    score -= 10;
  }

  // 检查生僻字
  const rareChars = name.match(/[𠮷你𠰌𡧈]/g);
  if (rareChars) {
    issues.push('名字包含生僻字');
    suggestions.push('建议避免使用生僻字');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions
  };
}

/**
 * 根据风格自动选择最佳名字
 */
export function selectBestNameByStyle(
  style: string,
  gender: string,
  count: number = 1
): GeneratedName[] {
  return generateMultipleNames(count, {
    gender: gender as 'male' | 'female' | 'neutral',
    style: style as any,
    role: 'side'
  });
}
