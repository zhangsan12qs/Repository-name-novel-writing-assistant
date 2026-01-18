import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

// 将文本分割成多个块
function splitIntoChunks(text: string, chunkSize: number = 30000): string[] {
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // 确保不在句子中间分割
    let endIndex = currentIndex + chunkSize;

    if (endIndex < text.length) {
      // 寻找最近的句子结束符
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

// 合并多个分析结果
function mergeAnalysisResults(results: any[]): any {
  const merged: any = {
    worldview: '',
    characters: [],
    plotStructure: '',
    writingStyle: '',
    coreTheme: '',
    suggestions: '',
  };

  // 合并世界观（选择最详细的）
  for (const result of results) {
    if (result.worldview && result.worldview.length > merged.worldview.length) {
      merged.worldview = result.worldview;
    }
  }

  // 合并人物（去重）
  const characterNames = new Set();
  for (const result of results) {
    if (result.characters && Array.isArray(result.characters)) {
      for (const char of result.characters) {
        const name = char.name?.trim();
        if (name && !characterNames.has(name)) {
          characterNames.add(name);
          merged.characters.push(char);
        }
      }
    }
  }

  // 合并剧情结构（拼接各部分）
  merged.plotStructure = results
    .map((r) => r.plotStructure)
    .filter(Boolean)
    .join('\n\n');

  // 合并写作风格（取第一个有值的）
  for (const result of results) {
    if (result.writingStyle) {
      merged.writingStyle = result.writingStyle;
      break;
    }
  }

  // 合并核心主题（取第一个有值的）
  for (const result of results) {
    if (result.coreTheme) {
      merged.coreTheme = result.coreTheme;
      break;
    }
  }

  // 合并建议（拼接）
  merged.suggestions = results
    .map((r) => r.suggestions)
    .filter(Boolean)
    .join('\n\n');

  return merged;
}

export async function POST(request: NextRequest) {
  try {
    const { bookContent, partialResults } = await request.json();

    if (!bookContent || bookContent.trim().length === 0) {
      return NextResponse.json(
        { error: '小说内容不能为空' },
        { status: 400 }
      );
    }

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const llmClient = new LLMClient(config);

    // 创建流式响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // 发送进度
        const sendProgress = (step: string, percentage: number, message: string) => {
          const chunk = `data: ${JSON.stringify({
            progress: { step, percentage, message },
          })}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        try {
          // 计算文本长度
          const totalLength = bookContent.length;
          const wordCount = Math.floor(totalLength / 2); // 中文字符大约每个2字节

          // 判断是否为继续生成
          const isContinuation = Array.isArray(partialResults) && partialResults.length > 0;

          // 根据文件大小决定处理策略
          let chunks: string[] = [];
          let startIndex = 0; // 从第几个块开始分析

          if (totalLength <= 50000) {
            // 小文件：一次性处理
            chunks = [bookContent];
            if (isContinuation) {
              // 如果已有结果且是小文件，说明已经分析过了，直接返回
              sendProgress('分析中', 100, '已存在完整分析结果');
              const resultChunk = `data: ${JSON.stringify({
                status: 'completed',
                data: partialResults[0]?.data,
              })}\n\n`;
              controller.enqueue(encoder.encode(resultChunk));
              controller.close();
              return;
            }
            sendProgress('准备中', 5, `小说约 ${wordCount} 字，开始分析...`);
          } else {
            // 大文件：分块处理
            sendProgress('准备中', 5, `检测到大文件（约 ${wordCount} 字），正在分块...`);

            // 计算需要的块数（每块30000字，最多20块）
            const maxChunks = 20;
            const chunkSize = Math.min(30000, Math.ceil(totalLength / maxChunks));
            chunks = splitIntoChunks(bookContent, chunkSize);

            // 如果是继续生成，从上次中断的地方开始
            if (isContinuation) {
              startIndex = partialResults.length;
              sendProgress('准备中', 8, `继续分析... 已完成 ${startIndex}/${chunks.length} 个部分，从第 ${startIndex + 1} 部分开始分析`);
            } else {
              sendProgress('准备中', 8, `已分割为 ${chunks.length} 个文本块，开始逐块分析...`);
            }
          }

          const analysisResults: any[] = [];

          // 如果是继续生成，先添加之前的结果
          if (isContinuation) {
            for (const partial of partialResults) {
              if (partial && partial.data) {
                analysisResults.push(partial.data);
              }
            }
          }

          // 逐块分析（从 startIndex 开始）
          for (let i = startIndex; i < chunks.length; i++) {
            const chunk = chunks[i];
            const progressBase = 10 + (i / chunks.length) * 70;

            sendProgress(
              '分析中',
              Math.floor(progressBase),
              isContinuation
                ? `正在继续分析第 ${i + 1}/${chunks.length} 部分...`
                : `正在分析第 ${i + 1}/${chunks.length} 部分...`
            );

            const analysisPrompt = `你是一位专业的小说拆书分析师，擅长深度分析长篇文学作品。
你的任务是分析这本小说的这一部分，提取关键创作元素。

【这是小说的第 ${i + 1}/${chunks.length} 部分】
【总字数约：${wordCount} 字】

【分析要求】
1. 世界观设定（核心设定、力量体系、地理环境、社会结构、历史背景等）
2. 人物设定（本部分出现的主要角色和重要配角，包括姓名、性格、背景、能力、目标等）
3. 剧情结构（本部分的情节要点、冲突、转折等）
4. 写作风格（叙事节奏、语言特色等）
5. 核心主题（本部分体现的核心思想或价值观）

【改写原则】
- 保留原作的核心架构和创作理念
- 对具体设定进行创意转换
- 重新设计人物名称、外貌描述等表层元素
- 保持原作的故事节奏和戏剧张力
- 确保改写后的内容具有原创性

【小说内容（本部分）】
${chunk}

【输出格式 - JSON】
{
  "worldview": "本部分世界观设定（如果本部分没有涉及则留空）",
  "characters": [
    {
      "name": "角色名",
      "role": "角色定位",
      "personality": "性格特点",
      "background": "背景故事",
      "ability": "能力设定",
      "goals": "目标动机"
    }
  ],
  "plotStructure": "本部分剧情结构分析",
  "writingStyle": "写作风格特点",
  "coreTheme": "本部分核心主题",
  "suggestions": "基于本部分的新书创作建议"
}

注意：
1. 返回的内容必须是改写后的原创内容，不能直接复制原文
2. 如果某个元素在本部分没有出现，可以留空或标注"暂无"
3. 人物只分析本部分出现的`;

            const analysisResponse = await llmClient.invoke([
              { role: 'system' as const, content: analysisPrompt },
              { role: 'user' as const, content: analysisPrompt }
            ], {
              temperature: 0.7,
            });

            const analysisText = analysisResponse.content || '';

            // 解析分析结果
            let analysisData: any = {};
            try {
              const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                               analysisText.match(/\{[\s\S]*\}/);

              if (jsonMatch) {
                const jsonString = jsonMatch[1] || jsonMatch[0];
                analysisData = JSON.parse(jsonString);
              }
            } catch (e) {
              console.error('解析分析结果失败:', e);
            }

            analysisResults.push(analysisData);

            // 发送部分结果（实时更新）
            const partialChunk = `data: ${JSON.stringify({
              status: 'partial',
              partIndex: i,
              totalParts: chunks.length,
              data: analysisData,
            })}\n\n`;
            controller.enqueue(encoder.encode(partialChunk));

            // 避免请求过快
            if (i < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          sendProgress('分析中', 80, '各部分分析完成，正在合并结果...');

          // 合并所有分析结果
          const mergedAnalysis = mergeAnalysisResults(analysisResults);

          sendProgress('分析中', 85, '结果合并完成，正在校核遗漏点...');

          // 步骤2：校核遗漏点（取小说开头部分）
          const sampleContent = bookContent.substring(0, 20000);

          const verificationPrompt = `你是一位小说拆书质量审查专家。
你的任务是检查以下拆书分析结果是否有遗漏重要元素。

【小说信息】
总字数约：${wordCount} 字
分析块数：${chunks.length} 块

【已分析的内容】
世界观：${mergedAnalysis.worldview?.substring(0, 500) || '未提取'}
人物数量：${mergedAnalysis.characters?.length || 0}个
剧情结构：${mergedAnalysis.plotStructure?.substring(0, 500) || '未提取'}
写作风格：${mergedAnalysis.writingStyle || '未提取'}
核心主题：${mergedAnalysis.coreTheme || '未提取'}

【小说开头（用于校核）】
${sampleContent}

【校核要求】
检查以下方面是否有遗漏：
1. 核心力量体系或法术系统
2. 主要社会阶层或势力
3. 关键配角（超过5章戏份的角色）
4. 重要地理地点
5. 历史背景或传说
6. 特殊物品或神器
7. 重要的情感线索（虽然不是主线，但可能影响剧情）
8. 反派或对立势力

【输出格式 - JSON】
{
  "hasMissingElements": true/false,
  "missingElements": [
    {
      "category": "分类",
      "description": "遗漏的内容描述",
      "importance": "高/中/低"
    }
  ],
  "supplement": "补充建议"
}

如果校核没有发现遗漏，missingElements应该为空数组。`;

          sendProgress('校核中', 90, '正在检查是否有遗漏的关键元素...');

          const verificationResponse = await llmClient.invoke([
            { role: 'system' as const, content: verificationPrompt },
            { role: 'user' as const, content: verificationPrompt }
          ], {
            temperature: 0.5,
          });

          const verificationText = verificationResponse.content || '';

          // 解析校核结果
          let verificationData: any = {
            hasMissingElements: false,
            missingElements: [],
            supplement: '',
          };

          try {
            const jsonMatch = verificationText.match(/```json\n([\s\S]*?)\n```/) ||
                             verificationText.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
              const jsonString = jsonMatch[1] || jsonMatch[0];
              verificationData = JSON.parse(jsonString);
            }
          } catch (e) {
            console.error('解析校核结果失败:', e);
          }

          sendProgress('完成', 100, `拆书分析完成！共分析 ${wordCount} 字，提取 ${mergedAnalysis.characters?.length || 0} 个角色。`);

          // 步骤3：发送完整结果
          const resultChunk = `data: ${JSON.stringify({
            status: 'completed',
            data: {
              ...mergedAnalysis,
              verification: verificationData,
            },
          })}\n\n`;
          controller.enqueue(encoder.encode(resultChunk));

          // 发送校核报告
          const verificationChunk = `data: ${JSON.stringify({
            status: 'verified',
            verification: verificationData,
          })}\n\n`;
          controller.enqueue(encoder.encode(verificationChunk));

          controller.close();
        } catch (error) {
          console.error('流式处理错误:', error);
          const errorChunk = `data: ${JSON.stringify({
            error: error instanceof Error ? error.message : '处理失败',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('拆书分析失败:', error);
    return NextResponse.json(
      { error: error.message || '拆书分析失败' },
      { status: 500 }
    );
  }
}
