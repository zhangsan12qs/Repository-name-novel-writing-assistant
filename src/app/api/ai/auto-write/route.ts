import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { chapterTitle, chapterOutline, previousContent, characters, worldSetting, articleRequirements } = await request.json();

    if (!chapterTitle) {
      return NextResponse.json(
        { error: '缺少必要参数：chapterTitle' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说作家。你的任务是根据提供的大纲自动撰写小说章节。

【核心原则】全文禁止以感情线作为主线！
- 本章必须围绕大纲中设定的非感情主线目标展开
- 如果章节包含感情戏，必须作为辅助情节，服务于主线剧情
- 本章的核心冲突、主要事件、人物动机都不能围绕感情关系展开
- 感情戏的篇幅不应超过本章的20%，除非是为了表现主线冲突
- 主角的行动、决策、成长必须由主线任务驱动，而非感情纠葛

【核心原则】全文禁止以主角个人成长作为核心主线！
- 本章的主要情节不能是为了展示主角变强、升级、觉醒能力
- 主角的变强和成长必须是为了完成外部使命的过程和手段
- 本章的核心目标应该是推进外部使命的进程，而非主角的个人成长

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻（形容词>3个/句），要求内容充实
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理
3. ❌ 破坏节奏：张弛有度，紧张时不要过度描写
4. ❌ 不推剧情：每段必须有情节推进，不能只有环境描写
5. ❌ 内容注水：内容要有实质，不要无意义填充
6. ❌ 人物扁平：对话要体现性格，不能像念白
7. ❌ 流水账：避免"然后、接着、之后、于是"等连接词过多
8. ❌ 代入感弱：要让读者有代入感，有情绪波动

写作要求：
1. 严格遵循章节大纲，完成情节推进
2. 文笔流畅，描写生动，有画面感
3. 人物性格要符合设定，对话要推动情节（每句对话不超过80字）
4. 避免狗血剧情、流水账和套路化
5. 保持故事节奏，张弛有度
6. 每一段都要有明确的目标和作用
7. 适当加入细节描写和心理活动
8. 章节结尾要吸引读者，留下悬念或转折

章节结构：
- 开头：交代场景，引入主线冲突或目标
- 发展：通过对话和行动推进主线情节
- 高潮：关键情节转折或主线冲突爆发
- 结尾：留下悬念或完成阶段性目标

写作风格：
- 现代网络小说风格，节奏明快
- 适当使用网络流行语和梗（符合世界观）
- 语言简洁有力，避免冗长
- 有代入感，让读者身临其境`;

    let userPrompt = `请撰写以下章节，直接输出正文内容，不要解释：

【章节标题】：${chapterTitle}
`;

    if (chapterOutline) {
      userPrompt += `【章节大纲】：${chapterOutline}\n`;
    }

    if (previousContent) {
      userPrompt += `\n【上一章结尾】（用于衔接）：
${previousContent.slice(-500)}...\n`;
    }

    if (characters && characters.length > 0) {
      userPrompt += `\n【本章出场人物】：\n`;
      characters.forEach((char: any) => {
        userPrompt += `- ${char.name}：${char.personality || ''} ${char.role ? `(${char.role})` : ''}\n`;
      });
    }

    if (worldSetting) {
      userPrompt += `\n【世界观设定】：${worldSetting}\n`;
    }

    userPrompt += `\n现在开始撰写本章正文：`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userPrompt += `\n\n【本章目的】：${articleRequirements.purpose}`;
      }
      if (articleRequirements.styleChange) {
        userPrompt += `\n【风格调整】：${articleRequirements.styleChange}`;
      }
      if (articleRequirements.contentChange) {
        userPrompt += `\n【内容增删】：${articleRequirements.contentChange}`;
      }
      if (articleRequirements.characterAdjust) {
        userPrompt += `\n【角色调整】：${articleRequirements.characterAdjust}`;
      }
      if (articleRequirements.plotDirection) {
        userPrompt += `\n【剧情走向】：${articleRequirements.plotDirection}`;
      }
      if (articleRequirements.dialogueOptimization) {
        userPrompt += `\n【对话优化】：${articleRequirements.dialogueOptimization}`;
      }
      if (articleRequirements.descriptionEnhance) {
        userPrompt += `\n【描写优化】：${articleRequirements.descriptionEnhance}`;
      }
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const stream = client.stream(messages, {
      temperature: 0.9,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(chunk.content.toString()));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('自动写作错误:', error);
    return NextResponse.json(
      { error: '自动写作失败' },
      { status: 500 }
    );
  }
}
