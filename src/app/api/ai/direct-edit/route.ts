import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, callAi } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const { content, feedbackSettings, articleRequirements, apiKey } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 获取 API Key
    let finalApiKey: string;
    try {
      const apiKeyConfig = getApiKey(apiKey);
      finalApiKey = apiKeyConfig.key;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    const systemPrompt = `你是一位专业的网络小说编辑。你的任务是：
1. 根据用户的反馈和要求，直接修改给定的文本内容
2. 保持故事的核心情节和关键信息不变
3. 确保修改后的内容符合用户的要求
4. 保持文风和语调的一致性
5. 避免出现"AI写作弊端"（华美的空洞、逻辑bug、流水账、套路化等）

【核心原则】全文禁止以感情线作为主线！
- 修改时必须确保感情戏仅作为辅助情节
- 故事的核心驱动力必须是非感情主题（使命任务、世界观冲突、事业追求、家族责任等）

【核心原则】全文禁止以主角个人成长作为核心主线！
- 主角变强和成长必须是为了完成外部使命的工具和手段
- 故事核心驱动力应该是外部使命（拯救世界、复仇、守护重要事物、探索未知等）

修改要求：
- 不要改变原文的核心情节和关键信息
- 根据用户的要求进行有针对性的修改
- 保持故事的连贯性和逻辑性
- 人物行为要符合角色设定
- 直接输出修改后的完整内容，不要解释`;

    let userPrompt = `请根据以下要求修改文本，直接输出修改后的完整内容：

【原文内容】：
${content}
`;

    // 整合写作反馈与调整
    if (feedbackSettings) {
      if (feedbackSettings.dissatisfactionReason) {
        userPrompt += `
【用户不满意的地方】：
${feedbackSettings.dissatisfactionReason}

请在修改时特别注意避免这些问题。`;
      }
      if (feedbackSettings.idealContent) {
        userPrompt += `
【用户的期望】：
${feedbackSettings.idealContent}

请在修改时尽量满足这些期望。`;
      }
    }

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      let instructionSection = '';
      if (articleRequirements.purpose) {
        instructionSection += `\n- 文章目的：${articleRequirements.purpose}`;
      }
      if (articleRequirements.styleChange) {
        instructionSection += `\n- 风格调整：${articleRequirements.styleChange}`;
      }
      if (articleRequirements.contentChange) {
        instructionSection += `\n- 内容增删：${articleRequirements.contentChange}`;
      }
      if (articleRequirements.characterAdjust) {
        instructionSection += `\n- 角色调整：${articleRequirements.characterAdjust}`;
      }
      if (articleRequirements.plotDirection) {
        instructionSection += `\n- 剧情走向：${articleRequirements.plotDirection}`;
      }
      if (articleRequirements.dialogueOptimization) {
        instructionSection += `\n- 对话优化：${articleRequirements.dialogueOptimization}`;
      }
      if (articleRequirements.descriptionEnhance) {
        instructionSection += `\n- 描写优化：${articleRequirements.descriptionEnhance}`;
      }

      if (instructionSection) {
        userPrompt += `\n\n【修改指令】：${instructionSection}`;
      }
    }

    userPrompt += `\n\n现在开始修改，直接输出修改后的完整内容：`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await callAi(messages, finalApiKey, { temperature: 0.7 });

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('直接编辑错误:', error);
    return NextResponse.json(
      { error: '直接编辑失败' },
      { status: 500 }
    );
  }
}
