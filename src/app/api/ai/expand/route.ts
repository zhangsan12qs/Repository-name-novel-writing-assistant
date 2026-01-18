import { NextRequest, NextResponse } from 'next/server';
import { getAiConfig, normalizeMessages, createStreamResponse, extractAiConfigFromRequest } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, instructions, articleRequirements } = body;

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 提取 AI 配置
    const requestConfig = await extractAiConfigFromRequest(request);
    const config = getAiConfig(requestConfig.apiKey, requestConfig.modelConfig);

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 基于给定的段落，进行扩展和丰富
2. 增加细节描写（环境、动作、心理等）
3. 深化场景氛围
4. 保持原有的情节走向
5. 扩写内容应该是原文的2-3倍

扩写要求：
- 不要改变原有情节
- 适当增加感官描写（视觉、听觉、触觉等）
- 增加人物心理活动和微表情
- 保持文风统一`;

    let userContent = `请扩写以下段落，直接输出扩写内容，不要解释：

${content}

${instructions ? `\n特殊要求：${instructions}` : ''}`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userContent += `\n\n【扩写目的】：${articleRequirements.purpose}`;
      }
      if (articleRequirements.styleChange) {
        userContent += `\n【风格调整】：${articleRequirements.styleChange}`;
      }
      if (articleRequirements.contentChange) {
        userContent += `\n【内容增删】：${articleRequirements.contentChange}`;
      }
      if (articleRequirements.characterAdjust) {
        userContent += `\n【角色调整】：${articleRequirements.characterAdjust}`;
      }
      if (articleRequirements.descriptionEnhance) {
        userContent += `\n【描写优化】：${articleRequirements.descriptionEnhance}`;
      }
    }

    const messages = normalizeMessages([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ]);

    return createStreamResponse(messages, config);
  } catch (error) {
    console.error('AI扩写错误:', error);
    return NextResponse.json(
      { error: 'AI扩写失败' },
      { status: 500 }
    );
  }
}
