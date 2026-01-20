import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, callAi } from '@/lib/ai-route-helper';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      currentOutline,
      dissatisfactionReason,
      idealOutline,
      characters,
      worldSettings,
      title,
      apiKey,
    } = body;

    if (!currentOutline || !currentOutline.trim()) {
      return NextResponse.json(
        { error: '当前大纲不能为空' },
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
    const systemPrompt = `你是一位专业的小说大纲编辑，擅长根据作者反馈调整和优化小说大纲。

【核心原则】
1. 全文禁止以感情线作为主线！感情戏仅作为辅助情节
2. 全文禁止以主角个人成长作为核心主线！主角变强是完成外部使命的工具
3. 禁止AI写作弊端：华美的空洞、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化
4. 每个人物出现和消失都一定有原因，不能凭空出现或消失
5. 确保内容紧凑、有悬念，避免平淡无趣

【大纲优化标准】
1. 结构完整：包含开篇、发展、高潮、结局
2. 逻辑清晰：事件之间有合理的因果关系
3. 节奏紧凑：避免注水，每个情节都有推进作用
4. 人物立体：角色有明确的动机和成长弧
5. 冲突强烈：内部冲突和外部冲突并存
6. 悬念设置：每个章节都有吸引读者的钩子

优化要求：
- 保持原有大纲的核心情节和关键信息
- 根据用户反馈进行有针对性的修改
- 确保修改后的大纲逻辑更加严密
- 人物关系要合理，前后一致
- 避免引入新的逻辑bug
- 直接输出优化后的大纲内容，不要解释`;

    let userPrompt = `请根据反馈优化以下大纲，直接输出优化后的完整大纲：

【当前大纲】：
${currentOutline}
`;

    if (title) {
      userPrompt += `\n【小说标题】：${title}`;
    }

    if (dissatisfactionReason) {
      userPrompt += `\n\n【用户不满意的地方】：
${dissatisfactionReason}

请在优化时特别注意避免这些问题。`;
    }

    if (idealOutline) {
      userPrompt += `\n\n【用户的期望大纲】：
${idealOutline}

请在优化时尽量满足这些期望。`;
    }

    if (characters && characters.length > 0) {
      userPrompt += `\n\n【主要人物】：
${characters.map((c: any) => `- ${c.name}：${c.role}`).join('\n')}`;
    }

    if (worldSettings && worldSettings.length > 0) {
      userPrompt += `\n\n【世界观设定】：
${worldSettings.map((w: any) => `- ${w.name}：${w.description}`).join('\n')}`;
    }

    userPrompt += `\n\n现在开始优化大纲，直接输出优化后的完整大纲：`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await callAi(messages, finalApiKey, { temperature: 0.7 });

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('调整大纲错误:', error);
    return NextResponse.json(
      { error: '调整大纲失败' },
      { status: 500 }
    );
  }
}
