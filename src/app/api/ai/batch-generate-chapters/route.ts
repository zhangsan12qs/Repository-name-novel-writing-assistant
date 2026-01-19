import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { SiliconFlowClient, SiliconFlowMessage } from '@/lib/siliconflow-client';
import { detectIssuesBatch } from '@/lib/issue-detector';
import { checkContentPenaltiesSmart, PenaltyLevel, getPenaltyMessage } from '@/lib/penalty-system';
import { getApiKey } from '@/lib/ai-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5分钟超时（Vercel 免费计划限制）

// 生成惩罚提示文本
function generatePenaltyPrompt(): string {
  return `
【⚠️ 严格遵守写作规矩，违者将受到严厉惩罚 ⚠️】

【🔥 核心规矩（最高惩罚：废弃章节 + 扣减500字 + 警告3次）】
1. 全文禁止以感情线作为主线！违者立即废弃章节，重写，扣减500字
2. 全文禁止以主角个人成长作为核心主线！违者立即废弃章节，重写，扣减500字
3. 小说类型限定：玄幻、奇幻、科幻、仙侠、魔幻、异能、末世

【⚡ AI写作弊端惩罚（降级评分 + 扣减字数）】
• 华美空洞：每句不要使用3个以上形容词（美丽、漂亮、壮观、雄伟、绚烂、辉煌等）→ 降级评分至50分，强制删除冗余描写，扣减200字
• 流水账：避免过度使用"然后"、"接着"、"之后"、"于是"等连接词 → 降级评分至40分，重写段落，扣减300字
• 套路化：严禁三角恋、退婚、打脸、绿帽、种马、后宫等套路化情节 → 废弃章节，重写，扣减1000字，警告5次
• 逻辑bug：确保人物行为符合设定，前后一致 → 降级评分至40分，修复逻辑bug，扣减300字
• 不推剧情：每段都必须推进剧情，不能有无效描写 → 降级评分至50分，删除无效段落，扣减300字
• 内容注水：禁止凑字数、重复描写、无效对话 → 降级评分至30分，删除注水内容，扣减500字
• 人物扁平：人物必须有鲜明的性格特点和动机 → 降级评分至50分，增加人物描写，扣减200字
• 对话平淡：对话必须有张力，体现人物性格 → 降级评分至60分，增强对话张力，扣减150字

【🚨 人物出现/消失惩罚】
• 每个人物出场都必须有明确原因和铺垫，违者降级评分至40分，补充出场铺垫，扣减300字
• 每个人物消失都必须有明确原因，违者降级评分至40分，补充消失原因，扣减300字

【💥 节奏和悬念惩罚】
• 每章必须有悬念或伏笔，保持读者阅读兴趣，违者降级评分至60分，补充悬念，扣减100字
• 确保内容紧凑、有悬念，避免平淡无趣，违者降级评分至50分，增加冲突和悬念，扣减200字

【⚖️ 惩罚机制】
• 评分低于60分：必须重写
• 评分低于80分：警告并建议修改
• 检测到套路化情节：立即废弃章节，重新生成
• 检测到感情线/成长线作为主线：立即废弃章节，重新生成

【✅ 生成标准】
• 评分必须达到80分以上才能通过
• 每章必须有明确的剧情推进
• 每章必须有悬念或伏笔
• 人物行为必须符合设定
• 确保内容紧凑、有吸引力
`;
}

// 带重试的LLM调用函数
async function callLLMWithRetry(
  client: any,
  messages: any[],
  options: any,
  maxRetries: number = 3,
  operationName: string
): Promise<string> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[BatchGenerate] ${operationName} 第${attempt}次尝试...`);
      let content = '';

      // 使用stream而不是invoke
      const stream = client.stream(messages, options);
      for await (const chunk of stream) {
        if (chunk.content) {
          content += chunk.content.toString();
        }
      }

      if (!content || content.length < 10) {
        throw new Error(`${operationName} 返回内容为空或过短`);
      }

      console.log(`[BatchGenerate] ${operationName} 成功，内容长度: ${content.length}`);
      return content;
    } catch (error: any) {
      lastError = error;
      console.error(`[BatchGenerate] ${operationName} 第${attempt}次失败:`, error.message);

      if (attempt < maxRetries) {
        // 等待后重试（指数退避）
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[BatchGenerate] 等待 ${waitTime}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`${operationName} 失败（重试${maxRetries}次后）: ${lastError?.message || '未知错误'}`);
}

export async function POST(request: NextRequest) {
  console.log('[BatchGenerate] ========== 开始处理批量生成请求 ==========');

  try {
    const body = await request.json();
    console.log('[BatchGenerate] 收到参数:', {
      chapterCount: body.chapterCount,
      hasOutline: !!body.outline,
      outlineLength: body.outline?.length || 0,
      charactersCount: body.characters?.length || 0,
      existingChaptersCount: body.existingChapters?.length || 0,
      volumesCount: body.existingVolumes?.length || 0,
      fixMode: body.fixMode || false,
      chaptersToFixCount: body.chaptersToFix?.length || 0,
      hasApiKey: !!body.apiKey
    });

    const {
      chapterCount,
      targetWordCount = 3000,
      outline,
      characters,
      worldSettings,
      existingChapters,
      existingVolumes,
      title,
      fixMode = false,
      chaptersToFix = [],
      qualityCheck = null,
      apiKey
    } = body;

    // 获取 API Key（优先使用前端传来的，否则使用环境变量）
    let finalApiKey: string;
    let useSiliconFlow = false;

    try {
      if (apiKey && apiKey.trim()) {
        finalApiKey = apiKey.trim();
        useSiliconFlow = true; // 前端传来的 API Key，使用硅基流动
      } else {
        const config = getApiKey();
        finalApiKey = config.key; // 使用环境变量（Coze）
        useSiliconFlow = false;
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API 密钥未配置' },
        { status: 401 }
      );
    }

    if (!chapterCount || !outline) {
      console.error('[BatchGenerate] 缺少必要参数');
      return NextResponse.json(
        { error: '缺少必要参数：chapterCount, outline' },
        { status: 400 }
      );
    }

    // 验证章节数范围
    if (chapterCount < 1 || chapterCount > 100) {
      console.error('[BatchGenerate] 章节数超出范围:', chapterCount);
      return NextResponse.json(
        { error: '章节数必须在1-100之间' },
        { status: 400 }
      );
    }

    const config = new Config({
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
      baseUrl: process.env.COZE_INTEGRATION_BASE_URL,
    });
    const client = new LLMClient(config);
    console.log('[BatchGenerate] LLMClient 初始化成功');

    // 创建流式响应
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        const sendChunk = (data: any) => {
          try {
            // 清理数据，移除可能导致问题的字段
            const cleanData = { ...data };

            // 如果有章节内容，保留完整内容（不再截断）
            if (cleanData.chapters && Array.isArray(cleanData.chapters)) {
              cleanData.chapters = cleanData.chapters.map((ch: any) => ({
                id: ch.id,
                title: ch.title,
                content: ch.content || '', // 保留完整内容用于后续处理
                volumeId: ch.volumeId,
                order: ch.order,
                wordCount: ch.wordCount,
                outline: ch.outline || '',
                status: ch.status || 'completed',
                supplementCount: ch.supplementCount || 0, // 保留补充次数
                isBelowTarget: ch.isBelowTarget || false // 保留是否未达标标记
              }));

              // 特别日志：记录章节列表的详细信息
              console.log(`[BatchGenerate] 发送章节列表，数量: ${cleanData.chapters.length}`);
              cleanData.chapters.forEach((ch: any, idx: number) => {
                console.log(`[BatchGenerate] 章节${idx + 1}: id=${ch.id}, title=${ch.title}, contentLength=${ch.content?.length || 0}, wordCount=${ch.wordCount}, supplementCount=${ch.supplementCount}, isBelowTarget=${ch.isBelowTarget}`);
              });
            }

            const chunk = `data: ${JSON.stringify(cleanData)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
            console.log('[BatchGenerate] 发送数据块:', cleanData.step, cleanData.message);
          } catch (err) {
            console.error('[BatchGenerate] 发送数据块失败:', err);
          }
        };

        try {
          // 过滤掉空章节，只保留有内容的章节
          const existingChaptersWithContent = (existingChapters || []).filter((c: any) =>
            c.content && c.content.trim().length > 0
          );

          let generatedChapters = [...existingChaptersWithContent];
          const volumes = existingVolumes || [{ id: 'vol-1', title: '第一卷', description: '', order: 1 }];

          // 获取当前最大章节ID
          const maxChapterId = existingChaptersWithContent.length > 0
            ? Math.max(...existingChaptersWithContent.map((c: any) => parseInt(c.id)))
            : 0;

          // 获取当前最大order
          const maxOrder = existingChaptersWithContent.length > 0
            ? Math.max(...existingChaptersWithContent.map((c: any) => c.order))
            : 0;

          console.log('[BatchGenerate] 开始生成章节', {
            maxChapterId,
            maxOrder,
            existingChaptersCount: existingChapters.length,
            existingChaptersWithContentCount: existingChaptersWithContent.length
          });

          sendChunk({
            step: 'generating-chapters',
            status: 'processing',
            message: `准备生成 ${chapterCount} 章内容...`,
            progress: { current: 0, total: chapterCount, percentage: 0 }
          });

          // 生成n章内容
          for (let i = 0; i < chapterCount; i++) {
            const chapterIndex = maxOrder + i + 1;
            const chapterId = (maxChapterId + i + 1).toString();
            const currentVolume = volumes[0]; // 默认使用第一卷

            const startTime = Date.now();
            console.log(`[BatchGenerate] ========== 开始生成第 ${chapterIndex} 章 ==========`);

            sendChunk({
              step: 'generating-chapters',
              status: 'processing',
              message: `正在生成第 ${chapterIndex} 章...`,
              progress: { current: i + 1, total: chapterCount, percentage: Math.round(((i + 1) / chapterCount) * 100) }
            });

            try {
              // ========== 步骤1: 生成章节详细大纲 ==========
              console.log(`[BatchGenerate] [第${chapterIndex}章] 开始生成详细大纲...`);

              const chapterOutlineMessages = [
                {
                  role: 'system' as const,
                  content: `基于小说大纲，为指定章节生成详细的情节描述。

${generatePenaltyPrompt()}

要求：
- 300-500字的详细情节描述
- 包含场景、人物、冲突、转折等要素
- 保持情节连贯性和逻辑性
- 确保每章都有悬念和转折，不要平淡
- 严格遵守以上写作禁忌和惩罚机制

格式：
【场景】：XXX
【出场人物】：XXX
【主要情节】：XXX（300-500字）
【核心冲突】：XXX
【本章结尾】：XXX`
                },
                {
                  role: 'user' as const,
                  content: `基于以下大纲，生成第${chapterIndex}章的详细情节描述：

【小说大纲】：
${outline}

【章节信息】：
- 章节序号：${chapterIndex}
- 上一章：${generatedChapters.length > 0 ? generatedChapters[generatedChapters.length - 1].title : '无'}

重要提示：
1. 本章必须围绕主线剧情展开，严禁以感情线作为主线
2. 严禁以主角个人成长（变强、升级）作为核心主线
3. 避免所有AI写作弊端
4. 确保有悬念和转折，吸引读者继续阅读`
                }
              ];

              // 使用带重试的函数生成大纲
              const chapterOutline = await callLLMWithRetry(
                client,
                chapterOutlineMessages,
                { temperature: 0.7 },
                3,
                `第${chapterIndex}章-大纲生成`
              );

              console.log(`[BatchGenerate] [第${chapterIndex}章] 大纲生成完成，长度: ${chapterOutline.length}`);

              // ========== 步骤2: 生成完整章节内容 ==========
              console.log(`[BatchGenerate] [第${chapterIndex}章] 开始生成完整内容...`);

              const prevChapter = generatedChapters.length > 0
                ? generatedChapters[generatedChapters.length - 1]
                : null;

              // 检查是否是修复模式，如果是，获取需要修复的章节内容
              const chapterToFix = fixMode && chaptersToFix.length > 0
                ? chaptersToFix[chapterIndex - 1] // chaptersToFix的索引从0开始
                : null;

              console.log(`[BatchGenerate] [第${chapterIndex}章] 修复模式: ${fixMode}, 待修复章节: ${chapterToFix ? chapterToFix.title : '无'}`);

              // 根据是否是修复模式，选择不同的系统提示
              const systemPrompt = fixMode && chapterToFix
                ? `你是一位专业的网络小说编辑。这一章内容质量不达标，你需要完全重写这一章，一次性解决所有问题。

${generatePenaltyPrompt()}

⚠️ 重写目标（最高优先级，必须严格遵守）：
- 提升质量评分至80分以上
- 将扣减分数控制在80分以内
- 必须生成至少 ${targetWordCount} 字，只多不少！
- 保持原有情节和人物设定，不能改变主线剧情
- 彻底改变写作方式，一次性解决所有问题

【重要：这是完全重写，不是修补！】
不要在原内容基础上修修补补，要彻底重写！
要改变你的写作风格和习惯，确保不再犯同样的问题！

重写要求：
1. 彻底消除华美空洞：每句形容词不超过2个，删除所有"美丽"、"壮观"、"绚烂"等空洞形容词
2. 彻底修复流水账：禁止使用"然后"、"接着"、"之后"、"于是"等连接词，改用时间顺序或动作序列自然过渡
3. 确保推进剧情：每段都必须推动主线剧情，删除所有无效描写和注水内容
4. 大幅丰富细节：增加环境（至少5处）、人物（至少10处）、对话（至少8处）的详细描写
5. 强制增加悬念：每章结尾必须有悬念，至少2处伏笔
6. 大幅改善对话：每句对话都要有潜台词，体现人物性格，增加肢体语言描写
7. 确保逻辑一致：人物行为必须符合设定，前后必须一致，不能出现矛盾

【写作技巧】
- 用动作描写代替形容词：不要说"他愤怒地说"，要写"他猛地一拍桌子，额头上青筋暴起"
- 用具体细节代替概括：不要说"天气很冷"，要写"寒风像刀子一样割在脸上，双手冻得通红"
- 用对话推动情节：每句对话都要有目的，要么展示人物，要么推进剧情
- 用环境烘托氛围：场景要与情节相配合，用环境反映人物心境

章节结构：
- 开头（15%）：场景描写（细节！细节！细节！）+ 引出主线目标，至少 ${Math.round(targetWordCount * 0.15)} 字
- 发展（50%）：通过对话和行动推进主线情节，详细描写人物行为、心理、环境，至少 ${Math.round(targetWordCount * 0.5)} 字
- 高潮（25%）：关键情节转折或主线冲突爆发，充分展开冲突，至少 ${Math.round(targetWordCount * 0.25)} 字
- 结尾（10%）：悬念收尾，为下章铺垫，至少 ${Math.round(targetWordCount * 0.1)} 字

【警告】
- 如果字数不足，将被判定为不合格！
- 如果评分仍不达标，说明你没有真正改变写作方式！
- 不要偷懒，不要敷衍，要彻底重写！

请直接输出完全重写的完整章节内容，不要任何解释和标记。`
                : `你是一位专业的网络小说作家。基于详细的章节大纲，扩展成完整的章节内容。

${generatePenaltyPrompt()}

⚠️ 字数严格要求（最高优先级）：
- 必须生成至少 ${targetWordCount} 字，只多不少！
- 绝对不能少于 ${targetWordCount} 字！
- 如果字数不足，将被视为不合格，必须重写！
- 建议生成 ${Math.round(targetWordCount * 1.1)}-${Math.round(targetWordCount * 1.2)} 字，以确保达标！

写作要求：
- 严格遵循详细大纲的情节描述
- 文笔流畅，描写生动，有画面感
- 人物性格要符合设定，对话要推动情节
- 保持故事节奏，张弛有度
- 章节结尾要吸引读者，留下悬念或转折
- 严格遵守以上写作禁忌和惩罚机制

章节结构：
- 开头：场景描写，引出本章主线目标（至少 ${Math.round(targetWordCount * 0.15)} 字）
- 发展：通过对话和行动推进主线情节（至少 ${Math.round(targetWordCount * 0.5)} 字，详细描写人物行为、心理、环境）
- 高潮：关键情节转折或主线冲突爆发（至少 ${Math.round(targetWordCount * 0.25)} 字，充分展开冲突）
- 结尾：悬念收尾，为下章铺垫（至少 ${Math.round(targetWordCount * 0.1)} 字）

扩展技巧（确保字数达标）：
- 增加环境描写：场景的细节、氛围、天气、光线等
- 增加人物描写：外貌、表情、动作、微表情、心理活动等
- 增加对话细节：人物语气、用词、潜台词、对话节奏等
- 增加情节细节：事件发展的细节、转折的铺垫、伏笔等
- 避免跳过过程：详细描写每个关键步骤，不要一笔带过

请直接输出章节正文，不要任何解释和标记。`;

              const userPrompt = fixMode && chapterToFix
                ? `这一章内容质量不达标，你需要完全重写！不要修补，要彻底重写！

【章节标题】：${chapterToFix.title || `第${chapterIndex}章`}

【原内容（仅供参考，不要修改，要完全重写！）】：
${chapterToFix.content}

${chapterOutline ? `\n【章节大纲（必须遵循）】：
${chapterOutline}` : ''}

${qualityCheck ? `\n【⚠️ 质量检测结果 - 必须解决这些问题】：
- 当前评分：${qualityCheck.averageScore?.toFixed(1)}分（要求{'>'}80分）
- 当前扣分：${Math.abs(qualityCheck.averagePenalty || 0).toFixed(1)}分（要求{'<'}80分）
- 失败原因：${qualityCheck.failReason?.join('；') || ''}

【针对失败原因的解决方法】：
${qualityCheck.failReason?.map((reason: string) => {
  if (reason.includes('评分')) return '• 彻底改变写作方式，确保评分达到80分以上';
  if (reason.includes('扣分')) return '• 删除所有导致扣分的问题，确保扣分控制在80分以内';
  return `• 解决：${reason}`;
}).join('\n') || ''}
` : ''}

${characters && characters.length > 0 ? `\n【本章出场人物（必须详细描写）】：
${characters.map((c: any) => `- ${c.name}：${c.personality} ${c.role ? `(${c.role})` : ''}`).join('\n')}` : ''}

${worldSettings && worldSettings.length > 0 ? `\n【世界观设定（必须融入描写）】：
${worldSettings.slice(0, 3).map((w: any) => `- ${w.name}：${w.description}`).join('\n')}` : ''}

⚠️ ⚠️ ⚠️ 字数严格要求（重复三遍，必须遵守）⚠️ ⚠️ ⚠️
1. 必须生成至少 ${targetWordCount} 字，只多不少！
2. 绝对不能少于 ${targetWordCount} 字，否则不合格！
3. 建议生成 ${Math.round(targetWordCount * 1.1)}-${Math.round(targetWordCount * 1.2)} 字，确保达标！

【完全重写要求】：
1. 忘掉原内容，基于大纲完全重写！
2. 每句形容词不超过2个，删除所有"美丽"、"壮观"、"绚烂"等空洞形容词
3. 禁止使用"然后"、"接着"、"之后"、"于是"等连接词
4. 每段都必须推进主线剧情，删除所有无效描写
5. 增加至少5处环境细节描写、至少10处人物细节描写、至少8处对话
6. 每章结尾必须有悬念，至少2处伏笔
7. 每句对话都要有潜台词，增加肢体语言描写
8. 确保人物行为符合设定，前后一致

现在开始完全重写这一章（字数：${targetWordCount}+ 字）：`
                : `请将以下详细大纲扩展成完整的章节内容（至少 ${targetWordCount} 字，只多不多！）：

【章节标题】：第${chapterIndex}章

【详细大纲】：
${chapterOutline}

${prevChapter ? `【上一章结尾（用于衔接）】：
${prevChapter.content.slice(-300)}` : ''}

${characters && characters.length > 0 ? `\n【本章出场人物】：
${characters.map((c: any) => `- ${c.name}：${c.personality} ${c.role ? `(${c.role})` : ''}`).join('\n')}` : ''}

${worldSettings && worldSettings.length > 0 ? `\n【世界观设定】：
${worldSettings.slice(0, 3).map((w: any) => `- ${w.name}：${w.description}`).join('\n')}` : ''}

⚠️ ⚠️ ⚠️ 字数严格要求（重复三遍，必须遵守）⚠️ ⚠️ ⚠️
1. 必须生成至少 ${targetWordCount} 字，只多不少！
2. 绝对不能少于 ${targetWordCount} 字，否则不合格！
3. 建议生成 ${Math.round(targetWordCount * 1.1)}-${Math.round(targetWordCount * 1.2)} 字，确保达标！

重要提示：
1. 本章必须围绕主线剧情展开，严禁以感情线作为主线
2. 严禁以主角个人成长（变强、升级）作为核心主线
3. 严格遵守写作禁忌：华美空洞、流水账、狗血剧情、感情线、成长线、人设矛盾、人物凭空出现
4. 每句形容词不超过2个，避免过度使用"然后"、"接着"等连接词
5. 严禁三角恋、退婚、打脸等套路化情节
6. 字数必须达到或超过 ${targetWordCount} 字！

扩展技巧：
- 详细描写场景：环境、氛围、天气、光线、气味、声音等
- 深化人物刻画：外貌、表情、动作、微表情、心理活动、动机等
- 丰富对话内容：语气、用词、潜台词、节奏、肢体语言等
- 完善情节细节：事件发展的每个步骤、转折的铺垫、伏笔的埋设等
- 避免跳过过程：详细描写每个关键情节，不要一笔带过

现在开始撰写本章正文（字数：${targetWordCount}+ 字）：`;

              const chapterContentMessages = [
                {
                  role: 'system' as const,
                  content: systemPrompt
                },
                {
                  role: 'user' as const,
                  content: userPrompt
                }
              ];

              // 使用带重试的函数生成内容
              const chapterContent = await callLLMWithRetry(
                client,
                chapterContentMessages,
                { temperature: 0.9 },
                3,
                `第${chapterIndex}章-内容生成`
              );

              console.log(`[BatchGenerate] [第${chapterIndex}章] 内容生成完成，长度: ${chapterContent.length}`);

              // ========== 字数严格控制：必须至少达到目标字数 ==========
              let actualWordCount = chapterContent.length;
              let finalContent = chapterContent;
              let supplementCount = 0;
              const maxSupplements = 3; // 最多补充3次

              // 如果字数不足，自动补充内容
              while (actualWordCount < targetWordCount && supplementCount < maxSupplements) {
                supplementCount++;
                const deficit = targetWordCount - actualWordCount;
                const supplementTarget = Math.min(deficit * 1.5, 2000); // 补充目标为缺口的1.5倍，最多2000字

                console.log(`[BatchGenerate] [第${chapterIndex}章] 字数不足，第${supplementCount}次补充 (缺${deficit}字，目标补充${supplementTarget}字)`);

                // 发送补充进度
                sendChunk({
                  step: 'supplementing-content',
                  status: 'processing',
                  message: `第${chapterIndex}章字数不足(${actualWordCount}字 < ${targetWordCount}字)，正在补充内容...`,
                  progress: { current: i + 1, total: chapterCount, percentage: Math.round(((i + 1) / chapterCount) * 100) },
                  supplementInfo: {
                    chapterIndex,
                    currentWordCount: actualWordCount,
                    targetWordCount,
                    deficit,
                    supplementCount,
                    supplementTarget
                  }
                });

                try {
                  // 生成补充内容的提示词
                  const supplementMessages = [
                    {
                      role: 'system' as const,
                      content: `你是一位专业的网络小说作家。根据章节现有内容，补充更多细节描写和情节扩展。

${generatePenaltyPrompt()}

⚠️ 字数补充要求（最高优先级）：
- 必须补充至少 ${Math.round(supplementTarget)} 字！
- 绝对不能少于补充目标！
- 建议补充 ${Math.round(supplementTarget * 1.2)}-${Math.round(supplementTarget * 1.5)} 字，确保达标！

补充要求：
- 必须与现有内容保持风格和情节一致
- 不要重复现有内容，要添加新的细节、对话、心理描写或环境描写
- 补充目标：${Math.round(supplementTarget)}字
- 补充位置：根据现有内容的结尾，自然延伸或扩展某个部分
- 严禁注水，补充的内容必须有实际作用
- 严格遵守以上写作禁忌和惩罚机制

补充策略（根据现有内容的结尾选择）：
1. 如果结尾是冲突场景：补充冲突过程中的更多细节、人物反应、环境变化、后续影响
2. 如果结尾是对话：补充对话中的微表情、心理活动、环境氛围、对话的深层含义
3. 如果结尾是场景转换：补充场景的更多细节、人物感受、过渡过程的细节
4. 如果结尾是情节推进：补充情节发展过程中的更多细节、转折的铺垫、伏笔的设置
5. 如果结尾是悬念：补充悬念的更多铺垫、人物的心理活动、环境氛围的烘托
6. 通用策略：深入描写某个场景、增加人物互动细节、深化心理描写、丰富环境氛围

扩展技巧（确保补充内容充实）：
- 增加场景细节：环境描写、氛围渲染、感官细节（视觉、听觉、嗅觉、触觉）
- 增加人物细节：外貌、表情、动作、微表情、心理活动、动机、回忆
- 增加对话细节：语气、用词、潜台词、节奏、肢体语言、对话的展开
- 增加情节细节：事件发展的细节、转折的铺垫、伏笔、后续影响

请直接输出补充内容，不要任何解释和标记。`
                    },
                    {
                      role: 'user' as const,
                      content: `【第${chapterIndex}章现有内容（${actualWordCount}字）】：
${finalContent}

【补充要求】：
- 目标总字数：${targetWordCount}字
- 当前字数：${actualWordCount}字
- 缺口：${deficit}字
- 需要补充：至少 ${Math.round(supplementTarget)} 字

【现有内容的结尾（用于自然衔接）】：
${finalContent.slice(-500)}

请根据现有内容的结尾和整体风格，自然延伸或扩展更多细节，补充至少 ${Math.round(supplementTarget)} 字，使总字数达到 ${targetWordCount} 字以上：`
                    }
                  ];

                  // 生成补充内容
                  const supplementContent = await callLLMWithRetry(
                    client,
                    supplementMessages,
                    { temperature: 0.8 },
                    3,
                    `第${chapterIndex}章-字数补充(${supplementCount})`
                  );

                  console.log(`[BatchGenerate] [第${chapterIndex}章] 第${supplementCount}次补充完成，长度: ${supplementContent.length}`);

                  // 将补充内容追加到章节末尾
                  finalContent = finalContent + '\n\n' + supplementContent;
                  actualWordCount = finalContent.length;

                  console.log(`[BatchGenerate] [第${chapterIndex}章] 补充后总字数: ${actualWordCount}字`);

                } catch (supplementError: any) {
                  console.error(`[BatchGenerate] [第${chapterIndex}章] 第${supplementCount}次补充失败:`, supplementError.message);
                  break; // 补充失败，不再尝试
                }
              }

              // 最终字数检查
              const wordPercent = (actualWordCount / targetWordCount) * 100;
              const isBelowTarget = actualWordCount < targetWordCount;

              if (isBelowTarget) {
                console.error(`[BatchGenerate] [第${chapterIndex}章] 字数不足（已尝试${supplementCount}次补充）: ${actualWordCount}字 (目标: ${targetWordCount}字, 缺${targetWordCount - actualWordCount}字)`);
              } else {
                console.log(`[BatchGenerate] [第${chapterIndex}章] 字数达标: ${actualWordCount}字 (目标: ${targetWordCount}字, 比例: ${wordPercent.toFixed(1)}%, 补充${supplementCount}次)`);
              }

              // 添加到已生成章节列表
              const newChapter = {
                id: chapterId,
                title: `第${chapterIndex}章`,
                content: finalContent, // 使用最终补充后的内容
                volumeId: currentVolume.id,
                order: chapterIndex,
                wordCount: actualWordCount, // 使用最终字数
                outline: chapterOutline,
                status: 'completed' as const,
                supplementCount: supplementCount, // 记录补充次数
                isBelowTarget: isBelowTarget // 标记是否未达标
              };

              generatedChapters.push(newChapter);

              const elapsed = Date.now() - startTime;
              console.log(`[BatchGenerate] [第${chapterIndex}章] 生成完成，耗时: ${elapsed}ms，补充${supplementCount}次，最终字数: ${actualWordCount}`);

            } catch (chapterError: any) {
              console.error(`[BatchGenerate] [第${chapterIndex}章] 生成失败:`, chapterError);

              // 发送错误信息
              sendChunk({
                step: 'error',
                status: 'error',
                message: `第 ${chapterIndex} 章生成失败: ${chapterError.message}`,
                errorDetails: {
                  chapterIndex,
                  name: chapterError.name,
                  message: chapterError.message,
                  stack: chapterError.stack
                }
              });

              // 决定是继续还是终止
              // 如果是前10章失败，终止；后面的章节失败，跳过并继续
              if (i < 10) {
                console.error(`[BatchGenerate] 前10章失败，终止生成`);
                controller.close();
                return;
              } else {
                console.warn(`[BatchGenerate] 第${chapterIndex}章失败，跳过并继续`);
                // 添加一个占位章节
                const placeholderChapter = {
                  id: chapterId,
                  title: `第${chapterIndex}章（生成失败，待手动补充）`,
                  content: '本章生成失败，请手动补充内容。',
                  volumeId: currentVolume.id,
                  order: chapterIndex,
                  wordCount: 0,
                  outline: '生成失败',
                  status: 'draft' as const
                };
                generatedChapters.push(placeholderChapter);
              }
            }
          }

          // ========== 批量生成完成 ==========
          const successCount = generatedChapters.filter(c => c.status === 'completed').length;
          const failCount = chapterCount - successCount;

          console.log('[BatchGenerate] ========== 批量生成完成 ==========');
          console.log('[BatchGenerate] 总章节数:', chapterCount);
          console.log('[BatchGenerate] 成功:', successCount);
          console.log('[BatchGenerate] 失败:', failCount);

          // 自动检测问题（仅对成功生成的章节）
          const completedChapters = generatedChapters.filter(c => c.status === 'completed');
          console.log('[BatchGenerate] 开始自动检测问题...');
          sendChunk({
            step: 'detecting-issues',
            status: 'processing',
            message: `正在自动检测${completedChapters.length}章的内容质量...`,
            progress: { current: 100, total: 100, percentage: 100 }
          });

          const issueCheckResults = detectIssuesBatch(completedChapters, true); // 使用高效模式

          // 检测惩罚违规
          console.log('[BatchGenerate] 开始检测惩罚违规...');
          sendChunk({
            step: 'detecting-penalties',
            status: 'processing',
            message: `正在检测${completedChapters.length}章是否符合写作规矩...`,
            progress: { current: 100, total: 100, percentage: 100 }
          });

          const penaltyResults: Array<{
            title: string;
            violations: any[];
            totalPenaltyScore: number;
            shouldRewrite: boolean;
            shouldWarn: boolean;
          }> = [];

          let totalViolations = 0;
          let totalPenaltyScore = 0;
          let chaptersNeedRewrite = 0;
          let chaptersNeedWarn = 0;

          completedChapters.forEach(chapter => {
            const penaltyResult = checkContentPenaltiesSmart(chapter.content, false); // 使用智能检测，正常模式
            totalViolations += penaltyResult.violations.length;
            totalPenaltyScore += penaltyResult.totalPenaltyScore;

            if (penaltyResult.shouldRewrite) chaptersNeedRewrite++;
            if (penaltyResult.shouldWarn) chaptersNeedWarn++;

            penaltyResults.push({
              title: chapter.title,
              violations: penaltyResult.violations,
              totalPenaltyScore: penaltyResult.totalPenaltyScore,
              shouldRewrite: penaltyResult.shouldRewrite,
              shouldWarn: penaltyResult.shouldWarn,
            });
          });

          console.log('[BatchGenerate] 惩罚检测完成:', {
            totalViolations,
            totalPenaltyScore,
            chaptersNeedRewrite,
            chaptersNeedWarn
          });

          // ========== 评分阈值检查（严格质量标准） ==========
          // 计算平均评分和平均扣分（使用let以便在重写循环中更新）
          const baseScore = 100; // 基础评分
          let averagePenaltyScore = totalPenaltyScore / completedChapters.length; // 平均扣分
          let averageFinalScore = baseScore + averagePenaltyScore; // 平均最终评分
          let maxPenaltyScore = Math.min(...penaltyResults.map(p => p.totalPenaltyScore)); // 最大扣分（最差的章节）

          // 合理质量标准（优化后，更合理）：
          // 1. 扣减分数小于80分（即|扣分| < 80）
          // 2. 最终综合评分大于80分
          const QUALITY_THRESHOLD = {
            MAX_PENALTY: -80, // 最大扣分绝对值<80
            MIN_SCORE: 80, // 最终评分>80
          };

          let scoreMeetsThreshold = averageFinalScore >= QUALITY_THRESHOLD.MIN_SCORE;
          let penaltyMeetsThreshold = Math.abs(averagePenaltyScore) < 80;

          console.log('[BatchGenerate] ========== 评分检查（合理标准） ==========');
          console.log('[BatchGenerate] 平均扣分:', averagePenaltyScore.toFixed(1));
          console.log('[BatchGenerate] 平均评分:', averageFinalScore.toFixed(1));
          console.log('[BatchGenerate] 最差章节扣分:', maxPenaltyScore);
          console.log('[BatchGenerate] 评分达标（要求>80分）:', scoreMeetsThreshold);
          console.log('[BatchGenerate] 扣分达标（要求<80分）:', penaltyMeetsThreshold);

          // 如果评分不达标，自动重写直到达标或达到最大重试次数
          if (!scoreMeetsThreshold || !penaltyMeetsThreshold) {
            const failReason = [];
            if (!scoreMeetsThreshold) {
              failReason.push(`平均评分${averageFinalScore.toFixed(1)}分未达标（要求>80分）`);
            }
            if (!penaltyMeetsThreshold) {
              failReason.push(`平均扣分${Math.abs(averagePenaltyScore).toFixed(1)}分超标（要求<80分）`);
            }

            console.error('[BatchGenerate] ========== 评分不达标，开始自动重写 ==========');
            console.error('[BatchGenerate] 失败原因:', failReason.join('，'));

            // 自动重写机制
            const maxRewriteAttempts = 5; // 最多重写5次
            let rewriteAttempt = 0;
            let qualityMet = false;

            while (rewriteAttempt < maxRewriteAttempts && !qualityMet) {
              rewriteAttempt++;
              console.log(`[BatchGenerate] ========== 第${rewriteAttempt}次自动重写 ==========`);

              sendChunk({
                step: 'rewriting-chapters',
                status: 'processing',
                message: `质量不达标，正在第${rewriteAttempt}次重写（最多${maxRewriteAttempts}次）...`,
                progress: { current: rewriteAttempt, total: maxRewriteAttempts, percentage: Math.round(rewriteAttempt / maxRewriteAttempts * 100) }
              });

              // 重写所有章节
              for (let i = 0; i < completedChapters.length; i++) {
                const chapter = completedChapters[i];
                const chapterIndex = i + 1;

                console.log(`[BatchGenerate] [第${rewriteAttempt}次重写] 第${chapterIndex}章...`);

                // 获取章节大纲
                const chapterOutline = outline ? outline.split('\n').filter((line: string) => {
                  return line.trim().startsWith(`第${chapterIndex}章`) || line.trim().startsWith(`${chapterIndex}.`);
                }).map((line: string) => line.replace(/^第\d+章\s*/, '').replace(/^\d+\.\s*/, '')).join('\n') : '';

                // 获取上一章
                const prevChapter = i > 0 ? completedChapters[i - 1] : null;

                // 重写提示词（更强）
                const rewriteSystemPrompt = `你是一位专业的网络小说编辑。这一章内容质量不达标（评分<80分或扣分≥80分），你必须完全重写，一次性解决所有问题！

${generatePenaltyPrompt()}

⚠️ 第${rewriteAttempt}次重写目标（必须达到）：
- 提升质量评分至80分以上
- 将扣减分数控制在80分以内
- 必须生成至少 ${targetWordCount} 字，只多不少！
- 保持原有情节和人物设定，不能改变主线剧情
- 彻底改变写作方式，不要再犯同样的错误！

【重要】你已经重写了${rewriteAttempt - 1}次，仍然不达标！这一次必须彻底改变写作方式！
- 不要使用"美丽"、"壮观"、"绚烂"、"辉煌"等空洞形容词
- 避免连续使用"然后"、"接着"、"之后"、"于是"等连接词
- 每句必须有实质内容，不能有废话
- 详细描写，细节丰富，每段至少5句话
- 对话要有张力，要有潜台词
- 结尾必须有悬念，必须有伏笔

请直接输出完全重写的完整章节内容，不要任何解释和标记。`;

                const rewriteUserPrompt = `第${rewriteAttempt}次重写第${chapterIndex}章：

【章节标题】：${chapter.title}

【原内容（仅供参考，要完全重写！）】：
${chapter.content}

【章节大纲（必须遵循）】：
${chapterOutline || '按照原有情节重写'}

${prevChapter ? `\n【上一章结尾（用于衔接）】：
${prevChapter.content.slice(-300)}` : ''}

${characters && characters.length > 0 ? `\n【本章出场人物】：
${characters.map((c: any) => `- ${c.name}：${c.personality} ${c.role ? `(${c.role})` : ''}`).join('\n')}` : ''}

${worldSettings && worldSettings.length > 0 ? `\n【世界观设定】：
${worldSettings.slice(0, 3).map((w: any) => `- ${w.name}：${w.description}`).join('\n')}` : ''}

⚠️ ⚠️ ⚠️ 这是你第${rewriteAttempt}次重写，必须达标！⚠️ ⚠️ ⚠️
当前评分：${averageFinalScore.toFixed(1)}分（要求>80分）
当前扣分：${Math.abs(averagePenaltyScore).toFixed(1)}分（要求<80分）

现在开始第${rewriteAttempt}次完全重写（字数：${targetWordCount}+ 字）：`;

                try {
                  const rewriteContent = await callLLMWithRetry(
                    client,
                    [
                      { role: 'system', content: rewriteSystemPrompt },
                      { role: 'user', content: rewriteUserPrompt }
                    ],
                    { temperature: 0.9 },
                    3,
                    `第${rewriteAttempt}次重写-第${chapterIndex}章`
                  );

                  // 更新章节内容
                  chapter.content = rewriteContent;
                  chapter.wordCount = rewriteContent.length;

                  console.log(`[BatchGenerate] [第${rewriteAttempt}次重写] 第${chapterIndex}章重写完成，字数: ${rewriteContent.length}`);

                } catch (error) {
                  console.error(`[BatchGenerate] [第${rewriteAttempt}次重写] 第${chapterIndex}章重写失败:`, error);
                }
              }

              // 重新检测质量
              console.log(`[BatchGenerate] [第${rewriteAttempt}次重写] 重新检测质量...`);

              const newPenaltyResults: any[] = [];
              let newTotalPenaltyScore = 0;

              completedChapters.forEach(chapter => {
                const penaltyResult = checkContentPenaltiesSmart(chapter.content, false); // 使用智能检测，正常模式
                newTotalPenaltyScore += penaltyResult.totalPenaltyScore;
                newPenaltyResults.push(penaltyResult);
              });

              const newAveragePenaltyScore = newTotalPenaltyScore / completedChapters.length;
              const newAverageFinalScore = 100 + newAveragePenaltyScore;
              const newScoreMeetsThreshold = newAverageFinalScore >= 80;
              const newPenaltyMeetsThreshold = Math.abs(newAveragePenaltyScore) < 80;

              console.log(`[BatchGenerate] [第${rewriteAttempt}次重写] 质量检测完成:`);
              console.log(`  - 平均评分: ${newAverageFinalScore.toFixed(1)}分（要求>80分）`);
              console.log(`  - 平均扣分: ${Math.abs(newAveragePenaltyScore).toFixed(1)}分（要求<80分）`);
              console.log(`  - 评分达标: ${newScoreMeetsThreshold}`);
              console.log(`  - 扣分达标: ${newPenaltyMeetsThreshold}`);

              // 发送重写检测完成事件，更新前端显示
              sendChunk({
                step: 'rewrite-check-complete',
                status: 'processing',
                message: `第${rewriteAttempt}次重写检测完成，评分: ${newAverageFinalScore.toFixed(1)}分，扣分: ${Math.abs(newAveragePenaltyScore).toFixed(1)}分`,
                progress: { current: rewriteAttempt, total: maxRewriteAttempts, percentage: Math.round(rewriteAttempt / maxRewriteAttempts * 100) },
                qualityCheck: {
                  averageScore: newAverageFinalScore,
                  averagePenalty: newAveragePenaltyScore,
                  meetsThreshold: newScoreMeetsThreshold && newPenaltyMeetsThreshold
                }
              });

              // 更新质量检查结果
              averageFinalScore = newAverageFinalScore;
              averagePenaltyScore = newAveragePenaltyScore;
              maxPenaltyScore = Math.min(...newPenaltyResults.map(p => p.totalPenaltyScore));
              scoreMeetsThreshold = newScoreMeetsThreshold;
              penaltyMeetsThreshold = newPenaltyMeetsThreshold;

              // 检查是否达标
              if (scoreMeetsThreshold && penaltyMeetsThreshold) {
                qualityMet = true;
                console.log(`[BatchGenerate] ========== 第${rewriteAttempt}次重写成功，质量达标！ ==========`);
                break;
              }
            }

            // 如果所有重写尝试都失败了
            if (!qualityMet) {
              console.error('[BatchGenerate] ========== 所有重写尝试都失败，无法达标 ==========');

              const finalFailReason = [];
              if (!scoreMeetsThreshold) {
                finalFailReason.push(`平均评分${averageFinalScore.toFixed(1)}分未达标（要求>80分）`);
              }
              if (!penaltyMeetsThreshold) {
                finalFailReason.push(`平均扣分${Math.abs(averagePenaltyScore).toFixed(1)}分超标（要求<80分）`);
              }

              const qualityFailedData = {
                step: 'quality-failed',
                status: 'failed',
                message: `⚠️ 经过${maxRewriteAttempts}次重写，质量仍未达标！\n\n📊 最终评分统计：\n• 平均评分：${averageFinalScore.toFixed(1)}分（要求>80分）\n• 平均扣分：${Math.abs(averagePenaltyScore).toFixed(1)}分（要求<80分）\n• 最差章节扣分：${Math.abs(maxPenaltyScore).toFixed(1)}分\n\n❌ 失败原因：\n${finalFailReason.map(r => `• ${r}`).join('\n')}\n\n💡 建议：\n• 检查大纲设定，确保符合写作规矩\n• 调整AI生成参数，提高质量要求\n• 减少生成章节数量，确保每章质量\n\n🔧 修复选项：\n• 点击"一键修改"按钮将完全重写这些章节，一次性解决所有问题`,
                qualityCheck: {
                  averageScore: averageFinalScore,
                  averagePenalty: averagePenaltyScore,
                  maxPenalty: maxPenaltyScore,
                  meetsThreshold: false,
                  failReason: finalFailReason
                },
                chapters: completedChapters
              };

              sendChunk(qualityFailedData);
              controller.close();
              return;
            }
          }

          console.log('[BatchGenerate] ========== 质量达标，继续处理 ==========');

          // 统计问题
          let totalIssues = 0;
          let totalErrors = 0;
          let totalWarnings = 0;
          let lowScoreChapters = 0;
          const issuesSummary: Array<{ title: string; errorCount: number; warningCount: number; score: number }> = [];

          issueCheckResults.forEach(check => {
            const { errorCount, warningCount } = check.result.summary;
            totalIssues += check.result.issues.length;
            totalErrors += errorCount;
            totalWarnings += warningCount;
            if (check.result.score < 80) lowScoreChapters++;
            issuesSummary.push({
              title: check.chapterTitle,
              errorCount,
              warningCount,
              score: check.result.score
            });
          });

          console.log('[BatchGenerate] 问题检测完成:', {
            totalIssues,
            totalErrors,
            totalWarnings,
            lowScoreChapters
          });

          // ========== 自动修复逻辑 ==========
          let autoFixCount = 0;
          let autoFixSuccess = 0;
          let autoFixFailed = 0;
          let autoFixedChapters: any[] = [];

          // 判断是否需要自动修复
          const needsAutoFix = totalIssues > 0 && chaptersNeedRewrite === 0; // 有问题但没有严重违规

          if (needsAutoFix) {
            console.log('[BatchGenerate] 开始自动修复问题...');
            sendChunk({
              step: 'auto-fixing',
              status: 'processing',
              message: `检测到 ${totalIssues} 个问题，正在自动修复...`,
              progress: { current: 100, total: 100, percentage: 100 }
            });

            // 批量自动修复（最多修复20章，避免超时）
            const chaptersToFix = completedChapters.slice(0, 20);
            console.log(`[BatchGenerate] 准备修复 ${chaptersToFix.length} 章...`);

            for (const chapter of chaptersToFix) {
              try {
                // 检查该章节是否有问题
                const chapterCheck = issueCheckResults.find(c => c.chapterTitle === chapter.title);
                if (!chapterCheck || chapterCheck.result.issues.length === 0) continue;

                autoFixCount++;
                console.log(`[BatchGenerate] 开始修复 ${chapter.title}（${chapterCheck.result.issues.length} 个问题）...`);

                // 收集所有问题
                const issues = chapterCheck.result.issues;
                const issuesText = issues.map((issue: any, idx: number) =>
                  `${idx + 1}. ${issue.type}：${issue.issue}${issue.suggestion ? `\n   建议：${issue.suggestion}` : ''}`
                ).join('\n');

                // 生成修复提示词
                const fixMessages = [
                  {
                    role: 'system' as const,
                    content: `你是一位专业的网络小说编辑。根据检测到的问题，修复章节内容。

${generatePenaltyPrompt()}

修复要求：
- 严格按照检测到的问题逐一修复
- 保持章节原有的风格、情节和人物设定
- 修复后的内容要自然流畅，不能有明显的修补痕迹
- 确保字数不减少，可以适当增加细节
- 严禁引入新的问题
- 严格遵守以上写作禁忌和惩罚机制

修复策略：
- 华美空洞：删除冗余形容词，使用更简洁有力的表达
- 流水账：减少"然后"、"接着"等连接词，使用更自然的过渡
- 不推剧情：删除无效描写，增加情节推进
- 内容注水：删除重复和无效内容
- 人物扁平：增加人物性格描写和心理活动
- 对话平淡：增强对话张力和潜台词
- 逻辑bug：修复矛盾之处
- 节奏问题：调整段落结构，张弛有度

请直接输出修复后的完整章节内容，不要任何解释和标记。`
                  },
                  {
                    role: 'user' as const,
                    content: `【章节标题】：${chapter.title}

【当前内容】：
${chapter.content}

【检测到的问题】：
${issuesText}

【要求】：
1. 逐一修复上述问题
2. 保持原有情节和风格
3. 确保修复后字数不小于 ${chapter.wordCount} 字
4. 严禁引入新问题

请输出修复后的完整章节内容：`
                  }
                ];

                // 调用LLM修复
                const fixedContent = await callLLMWithRetry(
                  client,
                  fixMessages,
                  { temperature: 0.7 },
                  2, // 修复只重试2次
                  `${chapter.title}-自动修复`
                );

                console.log(`[BatchGenerate] ${chapter.title} 修复完成，新长度: ${fixedContent.length}`);

                // 更新章节内容
                chapter.content = fixedContent;
                chapter.wordCount = fixedContent.length;
                autoFixSuccess++;
                autoFixedChapters.push(chapter.title);

              } catch (fixError: any) {
                console.error(`[BatchGenerate] ${chapter.title} 修复失败:`, fixError.message);
                autoFixFailed++;
              }
            }

            console.log('[BatchGenerate] 自动修复完成:', {
              total: autoFixCount,
              success: autoFixSuccess,
              failed: autoFixFailed,
              fixedChapters: autoFixedChapters
            });

            // ========== 修复后重新检测 ==========
            if (autoFixSuccess > 0) {
              console.log('[BatchGenerate] 修复后重新检测问题...');
              sendChunk({
                step: 're-detecting',
                status: 'processing',
                message: `修复完成，正在重新检测质量...`,
                progress: { current: 100, total: 100, percentage: 100 }
              });

              const fixedChaptersList = completedChapters.filter(c => autoFixedChapters.includes(c.title));
              const recheckResults = detectIssuesBatch(fixedChaptersList, true);

              // 统计修复后的问题
              let fixedTotalIssues = 0;
              let fixedTotalErrors = 0;
              let fixedTotalWarnings = 0;

              recheckResults.forEach(check => {
                const { errorCount, warningCount } = check.result.summary;
                fixedTotalIssues += check.result.issues.length;
                fixedTotalErrors += errorCount;
                fixedTotalWarnings += warningCount;
              });

              console.log('[BatchGenerate] 修复后问题检测:', {
                chapters: fixedChaptersList.length,
                totalIssues: fixedTotalIssues,
                totalErrors: fixedTotalErrors,
                totalWarnings: fixedTotalWarnings
              });

              // 更新总的统计数据
              const issuesBeforeFix = totalIssues;
              totalIssues = fixedTotalIssues + (totalIssues - autoFixCount * 5); // 估算
              totalErrors = fixedTotalErrors + (totalErrors - autoFixCount * 2);
              totalWarnings = fixedTotalWarnings + (totalWarnings - autoFixCount * 3);

              console.log('[BatchGenerate] 修复效果:', {
                issuesBefore: issuesBeforeFix,
                issuesAfter: totalIssues,
                reduced: issuesBeforeFix - totalIssues
              });
            }
          }

          let message = `✅ 批量生成完成！已成功生成 ${successCount} 章`;
          if (failCount > 0) {
            message += `（失败 ${failCount} 章已标记为待补充）`;
          }

          message += `\n\n✅ 质量检测合格`;
          message += `\n• 平均评分：${averageFinalScore.toFixed(1)}分（要求>80分）`;
          message += `\n• 平均扣分：${Math.abs(averagePenaltyScore).toFixed(1)}分（要求<80分）`;

          // 惩罚检测结果不显示给用户（内部检测使用，严重违规自动重写）
          // console.log('[BatchGenerate] 内部惩罚检测结果:', { totalViolations, totalPenaltyScore, chaptersNeedRewrite, chaptersNeedWarn });

          // 问题检测结果不显示给用户（内部检测使用）
          // console.log('[BatchGenerate] 内部问题检测结果:', { totalIssues, totalErrors, totalWarnings, lowScoreChapters });

          sendChunk({
            step: 'all-completed',
            status: 'completed',
            message,
            progress: { current: 100, total: 100, percentage: 100 },
            chapters: generatedChapters,
            summary: {
              total: chapterCount,
              success: successCount,
              failed: failCount,
              autoFix: {
                enabled: needsAutoFix,
                attempted: autoFixCount,
                success: autoFixSuccess,
                failed: autoFixFailed,
                fixedChapters: autoFixedChapters
              },
              qualityCheck: {
                averageScore: averageFinalScore,
                averagePenalty: averagePenaltyScore,
                maxPenalty: maxPenaltyScore,
                meetsThreshold: true,
                threshold: {
                  maxPenalty: 80,
                  minScore: 80
                }
              },
              penaltyCheck: {
                totalViolations,
                totalPenaltyScore,
                chaptersNeedRewrite,
                chaptersNeedWarn,
                results: penaltyResults
              },
              issueCheck: {
                totalIssues,
                totalErrors,
                totalWarnings,
                lowScoreChapters,
                issuesSummary
              }
            }
          });
          controller.close();

        } catch (error: any) {
          console.error('[BatchGenerate] 处理错误:', error);
          sendChunk({
            step: 'error',
            status: 'error',
            message: error.message || '批量生成失败',
            errorDetails: {
              name: error.name,
              message: error.message,
              stack: error.stack
            }
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
    console.error('[BatchGenerate] 请求处理失败:', error);
    return NextResponse.json(
      { error: '批量生成失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    );
  }
}
