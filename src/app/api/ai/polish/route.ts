import { NextRequest, NextResponse } from 'next/server';
import { getAiConfig, normalizeMessages, createStreamResponse, extractAiConfigFromRequest } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, style, articleRequirements } = body;

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
1. 润色和优化给定的文本
2. 改善文句流畅度和表达力
3. 修正语法和标点错误
4. 保持原有情节和核心内容不变
5. 根据文风要求调整语言风格

文风选项：
- 简洁明快：删除冗余，用词精准
- 细腻优美：增加描写，提升文采
- 悬疑紧凑：制造紧张感，加快节奏
- 幽默风趣：增加趣味性，轻松诙谐

润色要求：
- 不要改变原意
- 保持故事连贯性
- 符合网络小说的表达习惯`;

    let userContent = `请润色以下段落，采用${style || '简洁明快'}风格，直接输出润色内容，不要解释：

${content}`;

    // 整合文章目的需求与更改指令
    if (articleRequirements) {
      if (articleRequirements.purpose) {
        userContent += `\n\n【润色目的】：${articleRequirements.purpose}`;
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
      if (articleRequirements.dialogueOptimization) {
        userContent += `\n【对话优化】：${articleRequirements.dialogueOptimization}`;
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
    console.error('AI润色错误:', error);
    return NextResponse.json(
      { error: 'AI润色失败' },
      { status: 500 }
    );
  }
}
