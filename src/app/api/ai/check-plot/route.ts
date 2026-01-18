import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { title, outline, chapters, characters, worldSettings } = await request.json();

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

    const config = new Config();
    const client = new LLMClient(config);

    // 组合所有章节内容（只包含有内容的章节）
    const allContent = chaptersWithContent
      .sort((a: any, b: any) => a.order - b.order)
      .map((ch: any) => `[${ch.title}]\n${ch.content}`)
      .join('\n\n');

    // 组合角色信息
    const characterInfo = characters && characters.length > 0
      ? characters.map((c: any) => `- ${c.name}（${c.role}）：${c.personality || ''}, ${c.goals || ''}`).join('\n')
      : '未设定';

    // 组合世界观信息
    const worldInfo = worldSettings && worldSettings.length > 0
      ? worldSettings.map((w: any) => `- ${w.name}（${w.type}）：${w.description}`).join('\n')
      : '未设定';

    // 创建流式响应
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const sendChunk = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // 开始分析
          sendChunk({
            step: 0,
            stepName: '正在分析剧情...',
            status: 'processing',
            message: '正在检查剧情合理性...'
          });

          const systemPrompt = `你是一位专业的网络小说编辑和剧情分析师。请对以下小说内容进行全面的剧情合理性检查。

核心原则：全文禁止以感情线作为主线。感情戏只能是主线剧情的辅助和调味，不能成为故事的核心驱动力。
核心原则：全文禁止以主角个人成长作为核心主线。主角个人成长（变强、升级）只能作为完成外部使命的工具和手段，不能成为故事的目标。

你需要检查以下方面：
1. 【核心原则检查】感情线主线问题：检查故事是否以感情线作为主线推进动力
   - 判断标准：故事的核心冲突、主要事件是否围绕感情关系展开
   - 警告标志：主角的主要目标是为了恋爱、感情矛盾推动大部分情节转折
   - 修正建议：将主线回归到使命任务、世界观冲突、事业追求、家族责任等非感情主题

2. 【核心原则检查】主角个人成长主线问题：检查故事是否以主角个人成长（变强、升级）作为主线推进动力
   - 判断标准：故事的核心冲突、主要事件是否围绕主角如何变强展开
   - 警告标志：主角的主要目标是为了变强、升级、觉醒能力，变强本身成为目的而非手段
   - 修正建议：将主线回归到外部使命（拯救世界、复仇、保护重要事物等），主角的变强是为了完成使命的工具

3. 【AI写作弊端检查】（编辑拒稿的主要原因）
   - 华美的空洞：检查是否存在形容词堆砌（>3个/句）、内容空洞的问题
   - 逻辑bug：检查人设矛盾、前后不一致、情节不合理（如"三天三夜"）
   - 破坏节奏：检查过度描写是否破坏紧张氛围
   - 不推剧情：检查是否只写环境描写，缺乏情节推进
   - 内容注水：检查是否存在大量无意义描写
   - 人物扁平：检查角色是否有鲜明性格、动机和成长弧，是否像工具人
   - 对话平淡：检查对话是否有张力，体现人物性格，是否像念白
   - 流水账：检查"然后、接着、之后、于是"等连接词是否过多
   - 套路化：检查是否存在"三角恋、退婚、打脸、无敌、系统"等俗套

3. 人物动机一致性：人物的行为是否符合其性格设定和目标
4. 剧情逻辑性：情节发展是否有逻辑漏洞、前后矛盾
5. 时间线合理性：事件发生的时间顺序是否合理
6. 伏笔与呼应：是否有未交代的伏笔或前后呼应不当
7. 冲突合理性：冲突的起因和解决是否合理
8. 人物成长弧：主要人物是否有合理的成长变化
9. 节奏控制：情节节奏是否合理，是否有拖沓或仓促

输出格式要求（JSON）：
{
  "overallScore": 85,
  "summary": "整体评价（50-100字）",
  "issues": [
    {
      "type": "error" | "warning" | "suggestion",
      "category": "感情线主线" | "主角个人成长主线" | "华美的空洞" | "逻辑bug" | "破坏节奏" | "不推剧情" | "内容注水" | "人物扁平" | "对话平淡" | "流水账" | "套路化" | "人物动机" | "剧情逻辑" | "时间线" | "伏笔呼应" | "冲突设计" | "人物成长" | "节奏控制",
      "description": "问题描述",
      "location": "所在章节或位置",
      "reason": "为什么这是个问题",
      "suggestion": "具体的修改建议"
    }
  ],
  "highlights": [
    {
      "category": "亮点类型",
      "description": "亮点描述"
    }
  ]
}

评分标准：
- 90-100分：优秀，剧情合理性强，逻辑严密，主线清晰（非感情线、非个人成长主线），无AI写作弊端
- 70-89分：良好，整体合理，有少量小问题
- 50-69分：一般，存在明显问题需要修改
- 低于50分：较差，存在重大剧情漏洞或以感情线作为主线，或以主角个人成长作为主线，或严重AI写作弊端

注意：
1. 如果发现故事以感情线作为主线，必须作为error级别的问题指出
2. 如果发现故事以主角个人成长（变强、升级）作为主线，必须作为error级别的问题指出
3. 如果存在严重的AI写作弊端（如华美的空洞、逻辑bug、流水账），必须作为error级别的问题指出`;

          const userPrompt = `请检查以下小说的剧情合理性：

【小说标题】：${title || '未命名'}
【故事大纲】：${outline || '未设定'}

【主要人物】：
${characterInfo}

【世界观设定】：
${worldInfo}

【章节内容】：
${allContent}

请按照要求的格式输出检查结果。`;

          const messages = [
            {
              role: 'system' as const,
              content: systemPrompt
            },
            {
              role: 'user' as const,
              content: userPrompt
            }
          ];

          const response = await client.invoke(messages, { temperature: 0.5 });

          // 提取JSON
          const jsonMatch = response.content.match(/\{[\s\S]*\}/);
          let result;
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            // 如果解析失败，返回原始文本
            result = {
              overallScore: 70,
              summary: response.content.substring(0, 200),
              issues: [],
              highlights: []
            };
          }

          sendChunk({
            step: 1,
            stepName: '剧情检查完成',
            status: 'completed',
            message: `分析完成，共检查 ${chaptersWithContent.length} 个章节`,
            data: result
          });

          controller.close();
        } catch (error: any) {
          console.error('剧情检查错误:', error);
          sendChunk({
            step: -1,
            status: 'error',
            message: error.message || '剧情检查失败'
          });
          controller.close();
        }
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json(
      { error: error.message || '剧情检查失败' },
      { status: 500 }
    );
  }
}
