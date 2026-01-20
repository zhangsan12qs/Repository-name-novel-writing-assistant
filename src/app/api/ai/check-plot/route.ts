import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, callAi } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const { title, outline, chapters, characters, worldSettings, apiKey } = await request.json();

    if (!chapters || chapters.length === 0) {
      return NextResponse.json(
        { error: '缺少章节内容' },
        { status: 400 }
      );
    }

    // 过滤出有内容的章节
    const chaptersWithContent = chapters.filter((c: any) => c.content && c.content.trim().length > 0);

    if (chaptersWithContent.length === 0) {
      return NextResponse.json(
        { error: '所有章节内容为空' },
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

    // 构建系统提示词
    const systemPrompt = `你是一位专业的网文编辑，擅长检查剧情逻辑和连贯性。

【检查重点】
1. 全文是否以感情线作为主线（禁止！）
2. 全文是否以主角个人成长作为核心主线（禁止！）
3. AI写作弊端：华美的空洞、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化
4. 人物出现/消失是否有明确原因
5. 剧情是否紧凑、有悬念
6. 逻辑是否自洽，前后是否一致

【输出格式】
请以JSON格式输出检查结果：
{
  "issues": [
    {
      "type": "error|warning|info",
      "message": "问题描述",
      "chapter": "章节编号",
      "suggestion": "改进建议"
    }
  ]
}`;

    // 构建用户提示词
    let userPrompt = `请检查以下小说的剧情逻辑，返回JSON格式的检查结果：

【小说标题】：${title || '未命名'}

【大纲】：
${outline || '无'}

【人物列表】：
${characters?.map((c: any) => `- ${c.name}：${c.role}`).join('\n') || '无'}

【世界观设定】：
${worldSettings?.map((w: any) => `- ${w.name}：${w.description}`).join('\n') || '无'}

【章节内容】：
`;

    // 添加章节内容（最多10章，避免token超限）
    const chaptersToCheck = chaptersWithContent.slice(0, 10);
    chaptersToCheck.forEach((chapter: any) => {
      userPrompt += `\n第${chapter.order}章 ${chapter.title}\n${chapter.content}\n`;
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await callAi(messages, finalApiKey, { temperature: 0.3 });

    // 尝试提取JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { issues: [] };

    return NextResponse.json(result);
  } catch (error) {
    console.error('检查剧情错误:', error);
    return NextResponse.json(
      { error: '检查剧情失败' },
      { status: 500 }
    );
  }
}
