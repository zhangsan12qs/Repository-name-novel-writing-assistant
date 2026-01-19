import { NextRequest, NextResponse } from 'next/server';
import { getAiConfig, normalizeMessages, createStreamResponse, extractAiConfigFromRequest } from '@/lib/ai-route-helper';

/**
 * 获取模型的上下文窗口大小
 */
function getModelContextSize(model: string): number {
  // Groq 模型
  if (model.includes('llama-3.1-70b')) return 128000;
  if (model.includes('llama-3.1-8b')) return 128000;
  if (model.includes('llama3-70b')) return 8192;
  if (model.includes('llama3-8b')) return 8192;
  if (model.includes('mixtral-8x7b')) return 32768;
  if (model.includes('gemma')) return 8192;

  // 硅基流动模型（常见模型）
  if (model.includes('DeepSeek-V3')) return 64000;
  if (model.includes('Qwen2.5-72B')) return 32000;
  if (model.includes('Qwen2.5-32B')) return 32000;
  if (model.includes('Qwen2.5-7B')) return 32000;
  if (model.includes('Yi-1.5-34B')) return 64000;
  if (model.includes('Llama-3.1-8B')) return 128000;

  // 默认使用较小的上下文
  return 16000;
}

/**
 * 根据上下文窗口大小计算最大历史章节数
 */
function calculateMaxHistoryChapters(contextSize: number, totalChapters: number): number {
  // 估算：假设每章平均2000字（约3000 tokens）
  const avgTokensPerChapter = 3000;
  // 预留30%给系统提示、输出等
  const availableTokens = contextSize * 0.7;
  const maxChapters = Math.floor(availableTokens / avgTokensPerChapter);

  return Math.min(maxChapters, totalChapters);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, style, articleRequirements, previousChapters, currentChapterIndex } = body;

    if (!content) {
      return NextResponse.json(
        { error: '缺少必要参数：content' },
        { status: 400 }
      );
    }

    // 提取 AI 配置
    const requestConfig = await extractAiConfigFromRequest(request);
    const config = getAiConfig(requestConfig.apiKey, requestConfig.modelConfig);

    // 智能历史上下文管理
    let contextPrompt = '';
    if (previousChapters && previousChapters.length > 0) {
      const modelContextSize = getModelContextSize(config.model);
      const maxHistoryChapters = calculateMaxHistoryChapters(modelContextSize, previousChapters.length);

      contextPrompt = '\n【历史剧情背景】\n';
      const chaptersToSend = previousChapters.slice(-maxHistoryChapters);

      if (maxHistoryChapters >= 10) {
        const recentChapters = chaptersToSend.slice(-5);
        const olderChapters = chaptersToSend.slice(0, -5);

        if (olderChapters.length > 0) {
          contextPrompt += '前情提要：\n';
          olderChapters.forEach((chap: any, idx: number) => {
            contextPrompt += `第${chap.order}章 ${chap.title}：${chap.content?.substring(0, 100) || '（暂无内容）'}...\n`;
          });
        }

        contextPrompt += '\n最近章节详情：\n';
        recentChapters.forEach((chap: any) => {
          contextPrompt += `\n第${chap.order}章 ${chap.title}\n${chap.content || '（暂无内容）'}\n`;
        });
      } else {
        contextPrompt += '最近章节：\n';
        chaptersToSend.forEach((chap: any) => {
          contextPrompt += `第${chap.order}章 ${chap.title}：${chap.content?.substring(0, 200) || '（暂无内容）'}...\n`;
        });
      }
    }

    const systemPrompt = `你是一位专业的网络小说写作助手。你的任务是：
1. 润色和优化给定的文本
2. 改善文句流畅度和表达力
3. 修正语法和标点错误
4. 保持原有情节和核心内容不变
5. 根据文风要求调整语言风格
6. 注意与前文的剧情连贯性，人物行为要符合之前的发展

文风选项：
- 简洁明快：删除冗余，用词精准
- 细腻优美：增加描写，提升文采
- 悬疑紧凑：制造紧张感，加快节奏
- 幽默风趣：增加趣味性，轻松诙谐

润色要求：
- 不要改变原意
- 保持故事连贯性
- 符合网络小说的表达习惯
- 充分利用历史剧情信息，保持故事的连续性`;

    let userContent = `请润色以下段落，采用${style || '简洁明快'}风格，直接输出润色内容，不要解释：

【当前段落】
${content}
${contextPrompt ? contextPrompt : ''}`;

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
