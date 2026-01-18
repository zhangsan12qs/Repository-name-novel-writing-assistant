import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

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
    } = body;

    if (!currentOutline || !currentOutline.trim()) {
      return NextResponse.json(
        { error: '当前大纲不能为空' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

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
7. 世界观自洽：与世界观设定保持一致`;

    // 构建用户提示词
    let userPrompt = `你是一位专业的小说大纲编辑，需要根据作者反馈调整小说大纲。

【小说标题】
${title || '未命名'}

【当前大纲】
${currentOutline}

`;

    // 添加世界观和角色信息
    if (worldSettings && worldSettings.length > 0) {
      userPrompt += `【世界观设定】\n`;
      worldSettings.forEach((setting: any) => {
        userPrompt += `• ${setting.name}（${setting.type}）：${setting.description}\n`;
      });
      userPrompt += '\n';
    }

    if (characters && characters.length > 0) {
      userPrompt += `【角色设定】\n`;
      characters.forEach((character: any) => {
        userPrompt += `• ${character.name}（${character.role || '角色'}）：${character.personality || ''} ${character.goals || ''}\n`;
      });
      userPrompt += '\n';
    }

    // 添加反馈
    if (dissatisfactionReason && dissatisfactionReason.trim()) {
      userPrompt += `【对当前大纲不满意的原因】\n${dissatisfactionReason}\n\n`;
    }

    if (idealOutline && idealOutline.trim()) {
      userPrompt += `【理想的大纲描述】\n${idealOutline}\n\n`;
    }

    userPrompt += `【调整要求】
1. 仔细分析当前大纲的问题
2. 根据作者的反馈进行针对性调整
3. 保持大纲的核心主题和风格
4. 确保调整后的大纲逻辑清晰、结构完整
5. 每个情节点都要有明确的作用（推进剧情、塑造人物、铺垫伏笔等）
6. 必须遵循核心原则：禁止感情线作为主线、禁止主角个人成长作为核心主线
7. 避免所有AI写作弊端
8. 确保与世界观设定和角色设定保持一致

【输出格式】
请输出调整后的完整大纲，保持清晰的层次结构（分卷、章节、关键情节等）。

请直接输出调整后的大纲，不要添加其他说明文字。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('Adjust outline error:', error);
    return NextResponse.json(
      { error: '大纲调整失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
