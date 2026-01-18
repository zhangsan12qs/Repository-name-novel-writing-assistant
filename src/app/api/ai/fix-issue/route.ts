import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      issue,
      chapterId,
      content,
      characters,
      worldSettings,
    } = body;

    if (!content || !issue) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);

    // 构建系统提示词
    const systemPrompt = `你是一位专业的小说编辑，擅长修复小说中的各种写作问题。

【核心原则】
1. 全文禁止以感情线作为主线！感情戏仅作为辅助情节
2. 全文禁止以主角个人成长作为核心主线！主角变强是完成外部使命的工具
3. 禁止AI写作弊端：华美的空洞（形容词>3个/句）、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化
4. 每个人物出现和消失都一定有原因，不能凭空出现或消失
5. 确保内容紧凑、有悬念，避免平淡无趣`;

    // 构建用户提示词
    let userPrompt = `你是一位专业的小说编辑，需要修复以下问题：

【问题描述】
${issue.description}

【问题类型】
${issue.type}`;

    if (issue.location) {
      userPrompt += `\n\n【问题位置】\n${issue.location}`;
    }

    if (issue.reason) {
      userPrompt += `\n\n【问题原因】\n${issue.reason}`;
    }

    if (issue.suggestion) {
      userPrompt += `\n\n【修改建议】\n${issue.suggestion}`;
    }

    userPrompt += `

【当前章节内容】
${content}

【修复要求】
1. 严格按照修改建议进行修复
2. 保持原有的故事风格和叙事节奏
3. 确保修复后的内容逻辑连贯，不破坏整体剧情
4. 禁止添加新的问题（如：华美的空洞、逻辑bug等）
5. 保持字数要求，不要过度删减或注水
6. 输出修复后的完整章节内容，不要只输出修改的部分
7. 必须遵循核心原则：禁止感情线作为主线、禁止主角个人成长作为核心主线
8. 避免所有AI写作弊端

请直接输出修复后的完整章节内容。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('Fix issue error:', error);
    return NextResponse.json(
      { error: '问题修复失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
