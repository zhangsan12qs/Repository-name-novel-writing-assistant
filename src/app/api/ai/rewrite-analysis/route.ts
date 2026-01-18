import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { analysisResult, part, feedbackSettings } = await request.json();

    if (!analysisResult) {
      return NextResponse.json({ error: '缺少分析结果' }, { status: 400 });
    }

    if (!part) {
      return NextResponse.json({ error: '缺少改写部分参数' }, { status: 400 });
    }

    // 获取用户改写要求
    const userFeedback = feedbackSettings || {
      dissatisfactionReason: '',
      idealRewrite: '',
      specificChanges: '',
    };

    console.log(`[改写API] 开始改写: ${part}`);
    console.log(`[改写API] 用户改写要求:`, userFeedback);

    // 构建用户要求的提示部分
    const userFeedbackPrompt = userFeedback.dissatisfactionReason || userFeedback.idealRewrite || userFeedback.specificChanges
      ? `
【用户改写要求】
${userFeedback.dissatisfactionReason ? `不满意原因：${userFeedback.dissatisfactionReason}` : ''}
${userFeedback.idealRewrite ? `理想方向：${userFeedback.idealRewrite}` : ''}
${userFeedback.specificChanges ? `具体修改：${userFeedback.specificChanges}` : ''}

请务必根据以上用户要求进行改写！
`
      : '';

    // 根据part参数构建对应的提示词
    let prompt = '';
    let systemPrompt = '你是一位专业的小说创作顾问，擅长将现有作品改写成全新的原创内容，避免抄袭和雷同。';

    switch (part) {
      case 'worldview':
        systemPrompt = `你是一位专业的世界观设定专家。你的任务是将现有的世界观设定改写成全新的原创世界观。

改写原则：
1. 保留核心概念但改变所有具体设定
2. 创造独特的力量体系和规则
3. 保持逻辑自洽
4. 确保与原作不雷同`;

        let worldviewContent = '';
        if (typeof analysisResult.worldview === 'object') {
          worldviewContent = JSON.stringify(analysisResult.worldview, null, 2);
        } else if (typeof analysisResult.worldview === 'string') {
          worldviewContent = analysisResult.worldview;
        } else {
          worldviewContent = '无';
        }

        // 限制世界观内容长度,避免token超限
        const maxWorldviewLength = 3000;
        if (worldviewContent.length > maxWorldviewLength) {
          worldviewContent = worldviewContent.substring(0, maxWorldviewLength) + '\n...(内容过长,已截断)';
        }

        prompt = `请完整改写以下世界观设定，创造全新的世界观：

【原世界观】
${worldviewContent}
${userFeedbackPrompt}
【改写要求】
1. 改变所有专有名词和术语（如把"修仙"改为"炼气"，把"宗门"改为"学院"）
2. 创造独特的力量体系和规则，与原作不同
3. 保持逻辑自洽和内在统一性
4. 保持300-800字
5. 直接输出改写后的世界观，不要包含任何额外说明或标题`;
        break;

      case 'characters':
        systemPrompt = `你是一位专业的人物设定专家。你的任务是将现有的人物设定改写成全新的原创人物。

改写原则：
1. 为每个人物重新命名（改变姓氏、名字风格）
2. 保留人物在故事中的定位和功能，但改变背景故事
3. 保留核心性格特征，但换种表达方式
4. 重写能力设定，保留战斗力但改变技能名称和表现形式
5. 保持人物之间的关系逻辑不变
6. 确保与原作不雷同`;

        // 限制人物数量,避免token超限
        let charactersList = Array.isArray(analysisResult.characters)
          ? analysisResult.characters
          : [];

        const maxCharacters = 15; // 最多处理15个主要人物
        if (charactersList.length > maxCharacters) {
          charactersList = charactersList.slice(0, maxCharacters);
          console.log(`[改写API] 人物数量过多，仅处理前${maxCharacters}个人物`);
        }

        const charactersText = charactersList.map((char: any, index: number) =>
          `人物${index + 1}：
姓名：${char.name || '未知'}
定位：${char.role || '无'}
性格：${char.personality || '无'}
背景：${char.background || '无'}
能力：${char.ability || '无'}
目标：${char.goals || '无'}
关系：${char.relationships || '无'}`
        ).join('\n\n');

        prompt = `请完整改写以下所有人物设定，创造全新的人物形象：

【原人物设定】
${charactersText}
${userFeedbackPrompt}
【改写要求】
1. 为每个人物重新命名（改变姓氏和名字风格）
2. 保留人物在故事中的定位和功能，但改变背景故事
3. 保留核心性格特征，但换种表达方式
4. 重写能力设定，保留战斗力但改变技能名称和表现形式
5. 保持人物之间的关系逻辑不变
6. 每个人物单独一行，格式：姓名|定位|性格|背景|能力|目标
7. 直接输出改写后的人物数据，不要包含任何额外说明或标题`;
        break;

      case 'plot':
        systemPrompt = `你是一位专业的剧情结构专家。你的任务是将现有的剧情结构改写成全新的故事线。

重要原则：
1. 保留故事的核心冲突和目标，但彻底改变达成路径
2. 重新编排关键事件的顺序或改变呈现方式
3. 改变所有具体情节细节（地点、人物行为、事件顺序等），但保持故事张力
4. 创造全新的情节转折点，与原作完全不同
5. 保持故事节奏和逻辑严密性
6. 确保与原作不雷同，避免使用相同的事件描述
7. 改写必须完整，从故事开始到结束都要覆盖`;

        let plotContent = analysisResult.plotStructure || '无';

        // 智能截取：如果剧情过长，提取关键部分
        const maxPlotLength = 5000; // 增加到5000字符
        if (plotContent.length > maxPlotLength) {
          // 尝试保留开头和结尾，中间用省略号
          const halfLength = Math.floor(maxPlotLength / 2);
          plotContent = plotContent.substring(0, halfLength) +
                        '\n\n...（中间部分省略）...\n\n' +
                        plotContent.substring(plotContent.length - halfLength);
          console.log(`[改写API] 剧情内容过长，已智能截取，原长度: ${analysisResult.plotStructure.length}，截取后: ${plotContent.length}`);
        }

        if (!plotContent || plotContent.trim() === '无' || plotContent.trim().length < 10) {
          console.error(`[改写API] 剧情内容无效: "${plotContent}"`);
          return NextResponse.json(
            { error: '剧情内容无效或为空，无法改写' },
            { status: 400 }
          );
        }

        prompt = `请完整改写以下剧情结构，创造一个全新的故事线：

【原剧情结构】
${plotContent}
${userFeedbackPrompt}
【改写要求】
1. 改写必须完整，保持与原故事相当的篇幅（300-800字），不要过度缩减
2. 改变所有具体情节：人物行为、地点、事件顺序、具体细节等
3. 保留核心冲突和目标，但彻底改变达成路径
4. 创造全新的情节转折，不要使用原作的情节
5. 使用不同的叙述方式和语言表达
6. 确保故事逻辑严密，事件前后呼应
7. 直接输出改写后的剧情结构，不要包含任何解释、标题或说明文字`;
        break;

      case 'style':
        systemPrompt = `你是一位专业的文学风格专家。你的任务是将现有的写作风格改写成全新的风格特色。

改写原则：
1. 改变叙事视角或语言风格
2. 保持可读性和文学性
3. 确保与原作不雷同`;

        const styleContent = analysisResult.writingStyle || '无';

        prompt = `请改写以下写作风格，创造全新的写作特色：

【原写作风格】
${styleContent}
${userFeedbackPrompt}
【改写要求】
1. 改变叙事视角（如从第三人称改为第一人称）
2. 改变语言风格（如从华丽改为简洁，或从严肃改为幽默）
3. 保持可读性和文学性
4. 50字以内
5. 直接输出改写后的写作风格，不要包含任何额外说明或标题`;
        break;

      case 'theme':
        systemPrompt = `你是一位专业的主题立意专家。你的任务是将现有的核心主题改写成全新的主题表达。

改写原则：
1. 保留核心价值观但改变表达方式
2. 提炼更深层或不同的思想内涵
3. 创造独特的主题立意
4. 确保与原作不雷同`;

        const themeContent = analysisResult.coreTheme || '无';

        prompt = `请改写以下核心主题，创造全新的主题表达：

【原核心主题】
${themeContent}
${userFeedbackPrompt}
【改写要求】
1. 保留核心价值观但改变表达方式
2. 提炼更深层或不同的思想内涵
3. 创造独特的主题立意
4. 50字以内
5. 直接输出改写后的核心主题，不要包含任何额外说明或标题`;
        break;

      default:
        return NextResponse.json({ error: '无效的改写部分参数' }, { status: 400 });
    }

    console.log(`[改写API] Prompt长度: ${prompt.length}字符`);

    // 使用LLMClient直接调用LLM
    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt },
    ];

    console.log(`[改写API] 开始调用LLM，part=${part}...`);

    // 根据不同部分调整temperature
    const temperature = part === 'plot' || part === 'worldview' ? 0.9 : 0.7;

    const stream = client.stream(messages, {
      temperature,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = '';
          console.log(`[改写API] 开始接收流式数据...`);

          for await (const chunk of stream) {
            if (chunk.content) {
              const content = chunk.content.toString();
              fullContent += content;

              // 实时发送内容给前端
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          console.log(`[改写API] 接收完成，总长度: ${fullContent.length}字符`);

          // 检查是否为空
          if (!fullContent || fullContent.trim().length === 0) {
            console.error(`[改写API] 错误：改写内容为空`);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: '改写内容为空，请重试' })}\n\n`)
            );
            controller.close();
            return;
          }

          // 解析改写后的数据
          let parsed: any = {};
          try {
            parsed = parseRewrittenContent(fullContent, part);
            console.log(`[改写API] 解析完成:`, part, parsed);
          } catch (parseError) {
            console.error(`[改写API] 解析错误:`, parseError);
            // 如果解析失败，直接使用原始内容
            switch (part) {
              case 'worldview':
                parsed.worldview = fullContent.trim();
                break;
              case 'plot':
                parsed.plotStructure = fullContent.trim();
                break;
              case 'style':
                parsed.writingStyle = fullContent.trim();
                break;
              case 'theme':
                parsed.coreTheme = fullContent.trim();
                break;
              case 'characters':
                parsed.characters = [];
                break;
            }
          }

          // 发送最终结果
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, result: parsed, part })}\n\n`)
          );
          controller.close();
        } catch (error) {
          console.error('[改写API] 流式处理错误:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[改写API] 改写分析结果错误:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '改写失败',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// 解析改写后的内容
function parseRewrittenContent(content: string, part: string) {
  const result: any = {};

  console.log(`[解析] 开始解析${part}部分，内容长度: ${content.length}`);

  switch (part) {
    case 'worldview':
      result.worldview = content.trim();
      console.log(`[解析] 世界观解析完成，长度: ${result.worldview.length}`);
      break;

    case 'characters':
      result.characters = [];
      const lines = content.trim().split('\n');
      console.log(`[解析] 人物行数: ${lines.length}`);

      for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed && trimmed.includes('|')) {
          const parts = trimmed.split('|').map((p) => p.trim());
          if (parts.length >= 6) {
            result.characters.push({
              name: parts[0] || '',
              role: parts[1] || '',
              personality: parts[2] || '',
              background: parts[3] || '',
              ability: parts[4] || '',
              goals: parts[5] || '',
            });
          } else {
            console.log(`[解析] 跳过格式不正确的人物行: ${trimmed}`);
          }
        }
      }

      console.log(`[解析] 成功解析${result.characters.length}个人物`);
      break;

    case 'plot':
      result.plotStructure = content.trim();
      console.log(`[解析] 剧情解析完成，长度: ${result.plotStructure.length}`);
      break;

    case 'style':
      result.writingStyle = content.trim();
      console.log(`[解析] 风格解析完成，长度: ${result.writingStyle.length}`);
      break;

    case 'theme':
      result.coreTheme = content.trim();
      console.log(`[解析] 主题解析完成，长度: ${result.coreTheme.length}`);
      break;
  }

  return result;
}
