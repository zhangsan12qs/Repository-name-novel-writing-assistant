import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, callAi } from '@/lib/ai-route-helper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      issues,
      chapterId,
      content,
      characters,
      worldSettings,
      apiKey,
    } = body;

    if (!content || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取 API Key
    let finalApiKey: string;
    try {
      finalApiKey = getApiKey(apiKey);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一位专业的网络小说编辑。你的任务是：
1. 根据列出的问题批量修复章节内容
2. 确保修复后的内容符合写作规范
3. 保持原有的情节和人物设定
4. 修复时避免引入新的问题

【核心原则】
1. 全文禁止以感情线作为主线！
2. 全文禁止以主角个人成长作为核心主线！
3. 禁止AI写作弊端：华美的空洞、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化

修复要求：
- 逐一修复每个问题
- 保持故事的连贯性
- 人物行为要符合设定
- 直接输出修复后的完整内容，不要解释`;

    const issuesText = issues.map((issue: any, idx: number) => {
      return `${idx + 1}. [${issue.type}] ${issue.message}`;
    }).join('\n');

    let userPrompt = `请修复以下问题，直接输出修复后的完整章节内容：

【问题列表】：
${issuesText}

【原文内容】：
${content}
`;

    if (characters && characters.length > 0) {
      userPrompt += `\n\n【人物设定】：
${characters.map((c: any) => `- ${c.name}：${c.role} - ${c.personality || ''}`).join('\n')}`;
    }

    if (worldSettings && worldSettings.length > 0) {
      userPrompt += `\n\n【世界观设定】：
${worldSettings.map((w: any) => `- ${w.name}：${w.description}`).join('\n')}`;
    }

    userPrompt += `\n\n现在开始修复，直接输出修复后的完整内容：`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await callAi(messages, finalApiKey, { temperature: 0.7 });

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('批量修复问题错误:', error);
    return NextResponse.json(
      { error: '批量修复问题失败' },
      { status: 500 }
    );
  }
}
