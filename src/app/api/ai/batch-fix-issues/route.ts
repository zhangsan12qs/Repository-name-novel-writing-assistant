import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

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
    } = body;

    if (!content || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    // 构建系统提示词
    const systemPrompt = `你是一位专业的小说编辑，擅长一次性修复小说中的多个写作问题。

【核心原则】
1. 全文禁止以感情线作为主线！感情戏仅作为辅助情节
2. 全文禁止以主角个人成长作为核心主线！主角变强是完成外部使命的工具
3. 禁止AI写作弊端：华美的空洞（形容词>3个/句）、逻辑bug、破坏节奏、不推剧情、内容注水、人物扁平、对话平淡、流水账、套路化
4. 每个人物出现和消失都一定有原因，不能凭空出现或消失
5. 确保内容紧凑、有悬念，避免平淡无趣

【批量修复策略】
1. 一次性修复所有选定的问题，确保修复后的内容逻辑连贯
2. 不同问题之间可能存在关联，需要综合处理，避免修复一个问题时产生新问题
3. 保持原有的故事风格和叙事节奏
4. 确保修复后的内容完整，不要只是简单拼接
5. 禁止在修复过程中引入新的问题`;

    // 构建用户提示词
    let userPrompt = `你是一位专业的小说编辑，需要一次性修复以下 ${issues.length} 个问题：\n\n`;

    issues.forEach((issue: any, index: number) => {
      userPrompt += `【问题 ${index + 1}】\n`;
      userPrompt += `问题描述：${issue.description}\n`;
      userPrompt += `问题类型：${issue.type}\n`;

      if (issue.location) {
        userPrompt += `问题位置：${issue.location}\n`;
      }

      if (issue.reason) {
        userPrompt += `问题原因：${issue.reason}\n`;
      }

      if (issue.suggestion) {
        userPrompt += `修改建议：${issue.suggestion}\n`;
      }

      userPrompt += '\n';
    });

    userPrompt += `【当前章节内容】
${content}

【批量修复要求】
1. 一次性修复以上所有问题，确保修复后的内容逻辑连贯
2. 综合考虑所有问题的修复建议，避免修复一个问题时产生新问题
3. 严格遵循每个问题的修改建议
4. 保持原有的故事风格和叙事节奏
5. 确保修复后的内容完整，不要只是简单拼接
6. 禁止添加新的问题（如：华美的空洞、逻辑bug等）
7. 保持字数要求，不要过度删减或注水
8. 输出修复后的完整章节内容
9. 必须遵循核心原则：禁止感情线作为主线、禁止主角个人成长作为核心主线
10. 避免所有AI写作弊端

请直接输出一次性修复后的完整章节内容。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
    });

    return NextResponse.json({ content: response.content });
  } catch (error) {
    console.error('Batch fix issues error:', error);
    return NextResponse.json(
      { error: '批量修复失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
