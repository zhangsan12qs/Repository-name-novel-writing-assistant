import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, callAi } from '@/lib/ai-route-helper';

export async function POST(request: NextRequest) {
  try {
    const { analysisResult, part, feedbackSettings, apiKey } = await request.json();

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
    const systemPrompt = `你是一位专业的网络小说改写专家。你的任务是根据用户的改写要求，将原始分析结果改写成完全原创的内容。

【改写原则】
1. 必须完全原创，避免抄袭
2. 保持核心要素，但用全新的表达方式
3. 符合目标小说类型的特点
4. 确保改写后的内容逻辑自洽

【禁止项】
- 直接复制原文
- 保留原文的具体描写细节
- 使用原文的句式结构`;

    // 获取要改写的内容
    let contentToRewrite = '';
    switch (part) {
      case 'world':
        contentToRewrite = analysisResult.world || '';
        break;
      case 'characters':
        contentToRewrite = JSON.stringify(analysisResult.characters || [], null, 2);
        break;
      case 'plot':
        contentToRewrite = analysisResult.plot || '';
        break;
      case 'style':
        contentToRewrite = analysisResult.style || '';
        break;
      case 'theme':
        contentToRewrite = analysisResult.theme || '';
        break;
      default:
        return NextResponse.json({ error: '无效的改写部分' }, { status: 400 });
    }

    // 构建用户提示词
    let userPrompt = `请改写以下${part}部分的内容，直接输出改写后的结果：

【原始内容】：
${contentToRewrite}

${userFeedback.dissatisfactionReason || userFeedback.idealRewrite || userFeedback.specificChanges ? `【用户改写要求】
${userFeedback.dissatisfactionReason ? `不满意原因：${userFeedback.dissatisfactionReason}\n` : ''}
${userFeedback.idealRewrite ? `理想改写：${userFeedback.idealRewrite}\n` : ''}
${userFeedback.specificChanges ? `具体修改：${userFeedback.specificChanges}` : ''}
` : ''}

现在开始改写，直接输出改写后的结果：`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await callAi(messages, finalApiKey, { temperature: 0.8 });

    return NextResponse.json({ content: response });
  } catch (error) {
    console.error('改写分析结果错误:', error);
    return NextResponse.json(
      { error: '改写分析结果失败' },
      { status: 500 }
    );
  }
}
