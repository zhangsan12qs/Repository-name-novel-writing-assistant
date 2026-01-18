import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { content, characterInfo, context } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);

    const systemPrompt = `你是一位专业的网络小说对白优化助手。你的任务是：
1. 优化给定的对白内容
2. 让对白更符合人物性格和身份
3. 增加对白的张力和表现力
4. 避免对白过于直白或枯燥
5. 保持对白的自然流畅

对白优化要求：
- 符合人物设定和性格
- 有潜台词和暗示
- 推动情节发展
- 展现人物关系
- 适当加入肢体语言和神态描写（用括号标注）`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `请优化以下对白，直接输出优化后的内容，不要解释：

${content}

${characterInfo ? `人物信息：${characterInfo}` : ''}
${context ? `场景背景：${context}` : ''}`,
      },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.8,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('AI对白优化错误:', error);
    return NextResponse.json(
      { error: 'AI对白优化失败' },
      { status: 500 }
    );
  }
}
