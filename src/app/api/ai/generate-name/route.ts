import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { generateRandomName, validateNameQuality } from '@/lib/name-generator';

export const maxDuration = 60;

// 简化的名字寓意字典
const NAME_MEANINGS: Record<string, string> = {
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

interface GenerateNameRequest {
  gender?: 'male' | 'female' | 'neutral';
  role?: string;
  personality?: string;
  background?: string;
  era?: string;
  region?: string;
  style?: string;
  baseName?: string; // 基础生成的名字，用于AI优化
  avoidNames?: string[]; // 避免使用的名字
}

export async function POST(request: NextRequest) {
  let requestBody: GenerateNameRequest | null = null;

  try {
    requestBody = await request.json() as GenerateNameRequest;
    const {
      gender = 'male',
      role = 'side',
      personality = '',
      background = '',
      era = '',
      region = '',
      style = 'fantasy',
      baseName,
      avoidNames = []
    } = requestBody;

    console.log('[起名系统] 开始生成名字:', {
      gender,
      role,
      personality,
      background,
      style,
      hasBaseName: !!baseName
    });

    // 如果有基础名字且没有详细的人物属性，直接返回基础名字
    if (baseName && (!personality && !background)) {
      const meaning = generateNameMeaning(baseName, gender, style);
      return NextResponse.json({
        name: baseName,
        meaning,
        style,
        gender
      });
    }

    // 构建提示词
    let prompt = `你是一个专业的小说人物命名专家，擅长为网络小说创作高质量、富有特色的角色名字。

请根据以下人物属性生成一个合适的名字：

【基本信息】
- 性别：${gender === 'male' ? '男性' : gender === 'female' ? '女性' : '中性'}
- 角色定位：${role || '普通角色'}
- 风格类型：${style}

【人物特征】
${personality ? `- 性格特点：${personality}` : ''}
${background ? `- 背景设定：${background}` : ''}
${era ? `- 时代背景：${era}` : ''}
${region ? `- 地域特色：${region}` : ''}

【起名要求】
1. 名字要符合小说风格（${style}），具有浓郁的玄幻/仙侠/奇幻氛围
2. 名字要朗朗上口，易于记忆和传播
3. 名字要符合人物的性格和背景设定
4. 避免使用过于普通的名字（如"王强"、"李明"等）
5. 避免使用过于生僻的字，确保读者能够认识
6. 名字要有寓意，能够体现人物特征
7. 姓氏可以使用复姓（如"慕容"、"轩辕"、"欧阳"等），增加名字的辨识度
8. 名字长度建议为2-4个字（包括姓氏）
9. 禁止使用以下名字：${avoidNames.join('、') || '无'}

【输出格式】
请严格按照以下JSON格式输出（只输出JSON，不要输出其他内容）：
\`\`\`json
{
  "name": "姓名（姓氏+名字）",
  "surname": "姓氏",
  "givenName": "名字（不含姓氏）",
  "meaning": "名字寓意（简短描述名字的含义和象征意义）",
  "style": "名字风格描述（如：古朴典雅、仙气飘飘、威严霸气等）",
  "reason": "选择这个名字的原因（结合人物特征说明）"
}
\`\`\`

请开始生成名字：`;

    // 使用LLM生成名字
    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: 'user' as const, content: prompt }
    ];

    const response = await client.invoke(messages, {
      temperature: 0.8, // 较高的温度以增加创造力
    });

    console.log('[起名系统] LLM原始输出:', response);

    const result = response.content || '';

    // 尝试解析JSON
    let nameData: any = null;
    try {
      // 提取JSON部分
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nameData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('未找到JSON格式输出');
      }
    } catch (parseError) {
      console.error('[起名系统] 解析JSON失败:', parseError);

      // 解析失败，使用基础算法生成
      const fallbackName = generateRandomName({
        gender: gender as any,
        style: style as any,
        role: role as any,
        personality,
        background,
        avoidNames
      });

      return NextResponse.json({
        name: fallbackName.name,
        meaning: fallbackName.meaning,
        style: fallbackName.style,
        gender: fallbackName.gender,
        fallback: true,
        reason: 'AI解析失败，使用基础算法生成'
      });
    }

    // 验证名字质量
    const qualityCheck = validateNameQuality(nameData.name);

    // 构建响应
    const responseData = {
      name: nameData.name || nameData.姓名,
      surname: nameData.surname || nameData.姓氏,
      givenName: nameData.givenName || nameData.名字,
      meaning: nameData.meaning || nameData.寓意 || generateNameMeaning(nameData.name || nameData.姓名, gender, style),
      style: nameData.style || nameData.风格 || style,
      reason: nameData.reason || nameData.原因 || '符合人物特征和小说风格',
      quality: qualityCheck,
      fallback: false
    };

    console.log('[起名系统] 成功生成名字:', responseData);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[起名系统] 错误:', error);

    // 出错时使用基础算法生成
    const gender = requestBody?.gender || 'male';
    const style = requestBody?.style || 'fantasy';
    const avoidNames = requestBody?.avoidNames || [];

    const fallbackName = generateRandomName({
      gender: gender as any,
      style: style as any,
      avoidNames
    });

    return NextResponse.json({
      name: fallbackName.name,
      meaning: fallbackName.meaning,
      style: fallbackName.style,
      gender: fallbackName.gender,
      fallback: true,
      error: error instanceof Error ? error.message : '生成失败'
    }, { status: 200 }); // 即使失败也返回fallback名字
  }
}

/**
 * 生成名字寓意（辅助函数）
 */
function generateNameMeaning(name: string, gender: string, style: string): string {
  const meanings: string[] = [];

  // 为每个字添加寓意
  for (const char of name) {
    if (NAME_MEANINGS[char]) {
      meanings.push(NAME_MEANINGS[char]);
    }
  }

  // 如果没有找到寓意，添加通用描述
  if (meanings.length === 0) {
    return `名字"${name}"充满${style === 'fantasy' || style === 'xianxia' ? '仙气和玄幻色彩' : style === 'scifi' ? '科技感和未来感' : '魅力'}，符合${gender === 'male' ? '男性' : '女性'}角色的气质`;
  }

  return meanings.join('，');
}
