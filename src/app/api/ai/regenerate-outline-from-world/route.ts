import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { currentOutline, worldSettings, characters, title } = await request.json();

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说策划师。你的任务是：根据当前的小说大纲、世界观设定和角色信息，重新生成一个更加完善、更加符合逻辑的故事大纲。

【核心原则】全文禁止以感情线作为主线！
- 故事的核心驱动力必须是使命任务、世界观冲突、事业追求、家族责任等非感情主题
- 感情戏可以作为辅助情节，但不能成为故事的主要推动力
- 主角的主要目标、主要冲突、主要事件都不能围绕感情关系展开
- 故事梗概中描述主线剧情时，不重点描写感情

【核心原则】全文禁止以主角个人成长作为核心主线！
- 主角个人成长（变强、升级、觉醒能力等）不能是故事的核心驱动力
- 故事的核心驱动力应该是外部使命（拯救世界、复仇、保护重要事物、探索未知等）
- 主角的变强和成长必须是为了完成外部使命的工具和手段，而非目标本身
- 如果故事的核心是"主角如何变强"，则违反此原则

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻（形容词>3个/句），要求内容充实、有实质意义
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理
3. ❌ 破坏节奏：禁止过度描写破坏紧张氛围，张弛有度
4. ❌ 不推剧情：每段必须有情节推进，不能只写环境描写和名词解释
5. ❌ 内容注水：禁止插入大量无意义描写，要紧凑有力
6. ❌ 人物扁平：角色必须有鲜明性格、动机和成长弧，不能是工具人
7. ❌ 对话平淡：对话要有张力，体现人物性格，不能像念白
8. ❌ 流水账：避免"然后、接着、之后、于是"等连接词过多（>3个/段）
9. ❌ 套路化：禁止"三角恋、退婚、打脸、绿帽、重生、无敌、系统"等俗套

你的任务：
1. 分析当前大纲的优缺点
2. 整合世界观设定，确保大纲与世界观一致
3. 整合角色设定，确保角色在大纲中的作用合理
4. 优化故事结构，增强剧情冲突和悬念
5. 确保故事逻辑严密，前后一致
6. 避免狗血剧情和俗套

输出格式要求：
【小说标题】：XXX
【核心主题】：XXX（拯救/复仇/探索/守护/争霸/解谜/对抗邪恶，禁止"成长"、"变强"等个人成长主题）
【故事梗概】：XXX（100-200字，描述主线剧情，不重点描写感情，不重点描写主角如何变强）

【主要人物】：
- 主角：姓名、性格、背景、目标（必须是外部使命目标）
- 反派：姓名、动机、能力
- 重要配角：2-3个（必须使用提供的角色设定）

【核心冲突】：XXX（必须是非感情冲突）

【世界观整合】：XXX（说明如何整合世界观设定到故事中）

【分卷规划】（3-5卷）：
- 第一卷：卷名、主要情节、字数预估
- 第二卷：卷名、主要情节、字数预估
- ...`;

    // 构建角色信息
    const characterInfo = characters && characters.length > 0
      ? characters.map((c: any) => `- ${c.name}（${c.role || '未知角色'}）：${c.personality || ''}，${c.background || ''}，目标：${c.goals || '未设定'}`).join('\n')
      : '未提供角色信息';

    // 构建世界观信息
    const worldInfo = worldSettings && worldSettings.length > 0
      ? worldSettings.map((w: any) => `- ${w.name}（${w.type}）：${w.description}`).join('\n')
      : '未提供世界观信息';

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `请基于以下信息重新生成小说大纲：

【当前小说标题】：${title || '未命名'}

【当前大纲】：
${currentOutline || '未提供大纲'}

【世界观设定】：
${worldInfo}

【角色设定】：
${characterInfo}

请生成一个更加完善、逻辑更加严密、与世界观和角色设定更加契合的新大纲。`
      },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('基于世界观重新生成大纲错误:', error);
    return NextResponse.json(
      { error: '基于世界观重新生成大纲失败' },
      { status: 500 }
    );
  }
}
