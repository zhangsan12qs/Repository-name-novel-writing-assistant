import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, streamAiCall } from '@/lib/ai-route-helper';

export const runtime = 'nodejs';

// 将文本分割成多个块
function splitIntoChunks(text: string, chunkSize: number = 30000): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let endIndex = currentIndex + chunkSize;

    if (endIndex < text.length) {
      const sentenceEnders = ['。', '！', '？', '……', '\n\n', '\n'];
      for (let i = 0; i < 500; i++) {
        const pos = endIndex - i;
        if (pos <= currentIndex) break;
        if (sentenceEnders.includes(text[pos])) {
          endIndex = pos + 1;
          break;
        }
      }
    }

    chunks.push(text.substring(currentIndex, endIndex));
    currentIndex = endIndex;
  }

  return chunks;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookContent, partialResults, apiKey } = body;

    if (!bookContent || bookContent.trim().length === 0) {
      return NextResponse.json(
        { error: '小说内容不能为空' },
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

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (step: string, percentage: number, message: string) => {
          const chunk = `data: ${JSON.stringify({
            progress: { step, percentage, message },
          })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        try {
          const totalLength = bookContent.length;
          const wordCount = Math.floor(totalLength / 2);
          const isContinuation = Array.isArray(partialResults) && partialResults.length > 0;

          let chunks: string[] = [];
          let startIndex = 0;

          if (totalLength <= 50000) {
            chunks = [bookContent];
            if (isContinuation) {
              sendProgress('分析中', 100, '已存在完整分析结果');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                status: 'completed',
                data: partialResults[0]?.data,
              })}\n\n`));
              controller.close();
              return;
            }
            sendProgress('准备中', 5, `小说约 ${wordCount} 字，开始分析...`);
          } else {
            sendProgress('准备中', 5, `检测到大文件（约 ${wordCount} 字），正在分块...`);
            const maxChunks = 20;
            const chunkSize = Math.min(30000, Math.ceil(totalLength / maxChunks));
            chunks = splitIntoChunks(bookContent, chunkSize);

            if (isContinuation) {
              startIndex = partialResults.length;
              sendProgress('准备中', 8, `继续分析... 已完成 ${startIndex}/${chunks.length} 个部分`);
            } else {
              sendProgress('准备中', 8, `已分割为 ${chunks.length} 个文本块，开始逐块分析...`);
            }
          }

          const systemPrompt = `你是一位专业的网络小说分析师。你的任务是分析小说内容，提取关键信息。

请从以下维度进行分析：
1. 世界观设定
2. 主要人物
3. 剧情结构
4. 写作风格
5. 核心主题
6. 改进建议

以JSON格式输出结果。`;

          for (let i = startIndex; i < chunks.length; i++) {
            const chunk = chunks[i];
            const progressBase = 10 + (i / chunks.length) * 70;
            sendProgress('分析中', progressBase, `正在分析第 ${i + 1}/${chunks.length} 部分...`);

            const messages = [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `请分析以下小说片段：\n\n${chunk}` },
            ];

            let result = '';
            for await (const content of streamAiCall(messages, finalApiKey, { temperature: 0.5 })) {
              result += content;
            }

            try {
              const jsonMatch = result.match(/\{[\s\S]*\}/);
              const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { analysis: result };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                status: 'partial',
                chunkIndex: i,
                totalChunks: chunks.length,
                data,
              })}\n\n`));
            } catch (e) {
              console.error('解析分析结果失败:', e);
            }
          }

          sendProgress('完成', 100, '分析完成');
          controller.close();
        } catch (error) {
          console.error('分析过程错误:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('拆书分析错误:', error);
    return NextResponse.json(
      { error: '拆书分析失败' },
      { status: 500 }
    );
  }
}
