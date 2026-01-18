import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { genre, theme, protagonist, targetChapterCount, dissatisfactionReason, idealContent } = await request.json();

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说策划师。你的任务是：
1. 根据用户提供的信息生成完整的小说大纲
2. 大纲要包含：故事梗概、主要人物、核心冲突、分卷规划、关键情节
3. 结构清晰，逻辑严密
4. 避免狗血剧情和俗套
5. 保持故事的创新性和吸引力

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
- 正确示例：主角为了拯救世界而变强；错误示例：主角为了变强而拯救世界

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻（形容词>3个/句），要求内容充实、有实质意义
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理
3. ❌ 破坏节奏：禁止过度描写破坏紧张氛围，张弛有度
4. ❌ 不推剧情：每段必须有情节推进，不能只写环境描写和名词解释
5. ❌ 内容注水：禁止插入大量无意义描写，要紧凑有力
6. ❌ 人物扁平：角色必须有鲜明性格、动机和成长弧
7. ❌ 对话平淡：对话要有张力，体现人物性格，不能像念白
8. ❌ 流水账：避免"然后、接着、之后、于是"等连接词过多（>3个/段）
9. ❌ 套路化：禁止"三角恋、退婚、打脸、绿帽、重生、无敌、系统"等俗套

大纲格式要求：
【小说类型】：XXX（限定：玄幻/奇幻/科幻/仙侠/魔幻/异能/末世）
【核心主题】：XXX（拯救/复仇/探索/守护/争霸/解谜/对抗邪恶，禁止"成长"、"变强"等个人成长主题，禁止以感情为主题）
【故事梗概】：XXX（100-200字，描述主线剧情，不重点描写感情，不重点描写主角如何变强）
【主要人物】：
- 主角：姓名、性格、背景、目标（注意：主角的核心目标必须是外部使命，如拯救世界、复仇、守护重要事物等，禁止"变强"、"升级"等个人成长目标）
- 反派：姓名、动机、能力
- 重要配角：2-3个

【核心冲突】：XXX（必须是非感情冲突）
【故事结构】：
- 开篇：XXX
- 发展：XXX
- 高潮：XXX
- 结局：XXX

【分卷规划】（3-5卷）：
- 第一卷：卷名、主要情节、字数预估
- 第二卷：卷名、主要情节、字数预估
- ...`;

    // 构建用户提示词，整合章节设置、反馈和理想内容
    let userPrompt = `请为以下小说生成大纲：

类型：${genre || '玄幻'}
主题：${theme || '拯救世界'}
主角：${protagonist || '未设定'}`;

    // 如果有章节设置，添加章节数信息
    if (targetChapterCount) {
      userPrompt += `
目标章节数：${targetChapterCount}章（请根据这个章节数合理规划故事结构）`;
    }

    // 如果有不满原因，添加到提示词
    if (dissatisfactionReason) {
      userPrompt += `

【用户反馈的不满意之处】：
${dissatisfactionReason}

请在生成大纲时特别注意避免这些问题。`;
    }

    // 如果有理想内容，添加到提示词
    if (idealContent) {
      userPrompt += `

【用户的期望】：
${idealContent}

请在生成大纲时尽量满足这些期望。`;
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('AI生成大纲错误:', error);
    return NextResponse.json(
      { error: 'AI生成大纲失败' },
      { status: 500 }
    );
  }
}
