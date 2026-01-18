import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5分钟超时（Vercel 免费计划限制）

export async function POST(request: NextRequest) {
  console.log('[GenerateFullOutline] ========== 开始生成完整大纲 ==========');

  try {
    const body = await request.json();
    console.log('[GenerateFullOutline] 收到参数:', {
      title: body.title,
      novelType: body.novelType,
      targetChapterCount: body.targetChapterCount,
      targetWordCount: body.targetWordCount,
      protagonistName: body.protagonistName,
      protagonistGender: body.protagonistGender,
      storyMode: body.storyMode,
      needVolumes: body.needVolumes,
      volumeCount: body.volumeCount,
    });

    const {
      title = '未命名小说',
      novelType = '玄幻',
      targetChapterCount = 100,
      targetWordCount = 3000,
      // 主角设定
      protagonistName = '',
      protagonistGender = '男',
      protagonistPersonality = '',
      protagonistBackground = '',
      protagonistAbility = '',
      protagonistGoal = '',
      // 世界观细节
      worldBackground = '',
      powerSystem = '',
      geographicalEnvironment = '',
      socialStructure = '',
      coreConflict = '',
      // 故事风格
      narrativeStyle = '第三人称',
      languageStyle = '简洁',
      pacePreference = '适中',
      // 主题与核心
      coreTheme = '',
      philosophicalThinking = '',
      emotionalTone = '热血',
      // 关键设定
      goldenFinger = '',
      keyItems = '',
      importantLocations = '',
      // 剧情结构
      storyMode = '探险成长',
      conflictType = '人魔对抗',
      climaxSetting = '',
      // 分卷规划
      needVolumes = true,
      volumeCount = 5,
      // 禁忌设定
      avoidElements = '',
      avoidClichés = false,
      // 其他要求
      customRequirements = '',
    } = body;

    // 验证参数
    if (targetChapterCount < 10 || targetChapterCount > 1000) {
      console.error('[GenerateFullOutline] 章节数超出范围:', targetChapterCount);
      return NextResponse.json(
        { error: '章节数必须在10-1000之间' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);
    console.log('[GenerateFullOutline] LLMClient 初始化成功');

    // 创建流式响应
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ========== 阶段1: 生成世界观设定 ==========
          console.log('[GenerateFullOutline] 阶段1: 生成世界观设定');
          controller.enqueue(encoder.encode(`event:progress\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            phase: '世界观设定',
            percentage: 5,
            message: '正在生成世界观设定...'
          })}\n\n`));

          const worldPrompt = `你是一位专业的网文编辑，擅长${novelType}类型小说的世界观构建。

【任务】
为以下小说创建详细的世界观设定。

【小说信息】
- 标题：${title}
- 类型：${novelType}
- 章节目标：${targetChapterCount}章
- 每章字数：${targetWordCount}字
- 总字数目标：约${targetChapterCount * targetWordCount}字
- 故事模式：${storyMode}
- 冲突类型：${conflictType}

【用户提供的设定】
${worldBackground ? `- 世界背景：${worldBackground}` : ''}
${powerSystem ? `- 力量体系：${powerSystem}` : ''}
${geographicalEnvironment ? `- 地理环境：${geographicalEnvironment}` : ''}
${socialStructure ? `- 社会结构：${socialStructure}` : ''}
${coreConflict ? `- 核心冲突：${coreConflict}` : ''}
${goldenFinger ? `- 金手指设定：${goldenFinger}` : ''}
${keyItems ? `- 关键物品：${keyItems}` : ''}
${importantLocations ? `- 重要地点：${importantLocations}` : ''}
${climaxSetting ? `- 高潮设定：${climaxSetting}` : ''}

【要求】
1. 世界观必须适合长篇连载（${targetChapterCount}章）
2. 必须包含：力量体系、地理环境、社会结构、历史背景、核心冲突
3. 力量体系要有层次感，适合长期成长
4. 世界观要有足够的扩展性，支撑长篇故事
5. 如果用户提供了设定，必须基于用户设定进行完善和扩展
6. 避免套路化，要有创新点
7. 核心冲突要明确，能够推动长期剧情发展

【写作规矩（严格遵守）】
1. 全文禁止以感情线作为主线！
2. 全文禁止以主角个人成长作为核心主线！
3. 小说类型限定：玄幻、奇幻、科幻、仙侠、魔幻、异能、末世
4. 避免华美空洞、流水账、套路化等AI写作弊端
5. 确保内容紧凑、有悬念
${avoidClichés ? '6. 避免常见套路（如：退婚、打脸、后宫等）' : ''}

【输出格式】
请以JSON格式输出：
{
  "coreSetting": "核心设定（50-100字）",
  "powerSystem": "力量体系详细说明（200-300字）",
  "geographicalEnvironment": "地理环境（200-300字）",
  "socialStructure": "社会结构（200-300字）",
  "historicalBackground": "历史背景（200-300字）",
  "coreConflict": "核心冲突（100-200字）",
  "innovations": "创新点（100-200字）"
}`;

          let worldContent = '';
          try {
            const worldStream = client.stream([
              { role: 'user', content: worldPrompt }
            ], { temperature: 0.7 });

            for await (const chunk of worldStream) {
              if (chunk.content) {
                worldContent += chunk.content.toString();
              }
            }

            // 提取JSON
            const worldMatch = worldContent.match(/\{[\s\S]*\}/);
            const worldData = worldMatch ? JSON.parse(worldMatch[0]) : {
              coreSetting: worldContent.substring(0, 100),
              powerSystem: "待完善",
              geographicalEnvironment: "待完善",
              socialStructure: "待完善",
              historicalBackground: "待完善",
              coreConflict: "待完善",
              innovations: "待完善"
            };

            controller.enqueue(encoder.encode(`event:world\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify(worldData)}\n\n`));
            console.log('[GenerateFullOutline] 世界观设定生成完成');
          } catch (error: any) {
            console.error('[GenerateFullOutline] 世界观生成失败:', error);
            controller.enqueue(encoder.encode(`event:world\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify({
              coreSetting: "生成失败",
              powerSystem: "生成失败",
              geographicalEnvironment: "生成失败",
              socialStructure: "生成失败",
              historicalBackground: "生成失败",
              coreConflict: "生成失败",
              innovations: "生成失败"
            })}\n\n`));
          }

          // ========== 阶段2: 生成主要人物 ==========
          console.log('[GenerateFullOutline] 阶段2: 生成主要人物');
          controller.enqueue(encoder.encode(`event:progress\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            phase: '人物设定',
            percentage: 15,
            message: '正在生成主要人物...'
          })}\n\n`));

          const characterPrompt = `你是一位专业的网文编辑，擅长${novelType}类型小说的人物设计。

【任务】
为以下小说创建主要人物设定。

【小说信息】
- 标题：${title}
- 类型：${novelType}
- 故事模式：${storyMode}
- 情感基调：${emotionalTone}
- 世界观：${JSON.stringify(worldContent.substring(0, 500))}

【用户提供的设定】
${protagonistName ? `- 主角姓名：${protagonistName}` : ''}
${protagonistGender ? `- 主角性别：${protagonistGender}` : ''}
${protagonistPersonality ? `- 主角性格：${protagonistPersonality}` : ''}
${protagonistBackground ? `- 主角背景：${protagonistBackground}` : ''}
${protagonistAbility ? `- 主角能力：${protagonistAbility}` : ''}
${protagonistGoal ? `- 主角目标：${protagonistGoal}` : ''}

【要求】
1. 设计3-5个主要人物（主角+2-4个重要配角）
2. 如果用户提供了主角设定，必须使用用户设定的主角信息
3. 每个人物要有鲜明的性格、背景、动机
4. 人物关系要合理，符合剧情需要
5. 避免套路化人物形象
6. 人物成长轨迹要清晰
7. 人物目标必须服务于外部使命（如拯救世界、复仇、守护等），不能仅是个人成长

【写作规矩（严格遵守）】
1. 全文禁止以感情线作为主线！
2. 全文禁止以主角个人成长作为核心主线！
3. 人物的目标必须是外部使命，成长只是达成使命的手段
4. 避免华美空洞、流水账、套路化等AI写作弊端

【输出格式】
请以JSON格式输出：
[
  {
    "name": "人物姓名",
    "role": "主角/反派/配角",
    "age": "年龄",
    "personality": "性格特点（50-100字）",
    "background": "背景故事（100-200字）",
    "abilities": "能力/特长（50-100字）",
    "goals": "目标/动机（50-100字，必须是外部使命）",
    "weaknesses": "弱点/缺陷（30-50字）",
    "relationships": "人物关系（50-100字）"
  }
]`;

          let characterContent = '';
          try {
            const characterStream = client.stream([
              { role: 'user', content: characterPrompt }
            ], { temperature: 0.7 });

            for await (const chunk of characterStream) {
              if (chunk.content) {
                characterContent += chunk.content.toString();
              }
            }

            // 提取JSON数组
            const charMatch = characterContent.match(/\[[\s\S]*\]/);
            const characterData = charMatch ? JSON.parse(charMatch[0]) : [
              {
                name: "主角",
                role: "主角",
                age: "20岁",
                personality: "勇敢坚定",
                background: "待完善",
                abilities: "待完善",
                goals: "待完善",
                weaknesses: "待完善",
                relationships: "待完善"
              }
            ];

            controller.enqueue(encoder.encode(`event:characters\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify(characterData)}\n\n`));
            console.log('[GenerateFullOutline] 人物设定生成完成，共', characterData.length, '个角色');
          } catch (error: any) {
            console.error('[GenerateFullOutline] 人物生成失败:', error);
            controller.enqueue(encoder.encode(`event:characters\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify([
              {
                name: "主角",
                role: "主角",
                age: "20岁",
                personality: "生成失败",
                background: "生成失败",
                abilities: "生成失败",
                goals: "生成失败",
                weaknesses: "生成失败",
                relationships: "生成失败"
              }
            ])}\n\n`));
          }

          // ========== 阶段3: 生成故事大纲（分批生成章节） ==========
          console.log('[GenerateFullOutline] 阶段3: 生成故事大纲');
          controller.enqueue(encoder.encode(`event:progress\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            phase: '故事大纲',
            percentage: 20,
            message: '正在生成故事主线...'
          })}\n\n`));

          // 先生成整体故事大纲
          const storyPrompt = `你是一位专业的网文编辑，擅长${novelType}类型小说的剧情规划。

【任务】
为以下小说创建整体故事大纲，适合${targetChapterCount}章的长篇连载。

【小说信息】
- 标题：${title}
- 类型：${novelType}
- 章节目标：${targetChapterCount}章
- 每章字数：${targetWordCount}字
- 叙事风格：${narrativeStyle}
- 语言风格：${languageStyle}
- 节奏偏好：${pacePreference}
- 故事模式：${storyMode}
- 冲突类型：${conflictType}
- 情感基调：${emotionalTone}
- ${needVolumes ? `分卷规划：需要分成${volumeCount}卷` : '分卷规划：不需要分卷'}
- 世界观：${worldContent.substring(0, 300)}
- 主要人物：${JSON.stringify(characterContent.substring(0, 300))}

【主题设定】
${coreTheme ? `- 核心主题：${coreTheme}` : ''}
${philosophicalThinking ? `- 哲学思考：${philosophicalThinking}` : ''}

【用户提供的设定】
${climaxSetting ? `- 高潮设定：${climaxSetting}` : ''}

【要求】
1. 故事要有明确的开端、发展、高潮、结局
2. 整体大纲要能支撑${targetChapterCount}章的内容
3. 必须包含：起因、主要冲突、转折点、高潮、结局
4. 避免套路化剧情，要有创新点
5. 保持剧情的连贯性和吸引力
6. 根据故事模式调整剧情结构（探险成长、复仇、守护、争霸、解谜、生存、创造）
7. 主线必须围绕外部使命（拯救世界、复仇、守护重要事物等），禁止以感情线或个人成长为主线
8. ${needVolumes ? `剧情要合理分配到${volumeCount}卷中，每卷要有独立的起承转合` : '剧情结构要完整'}
9. ${avoidElements ? `避免以下元素：${avoidElements}` : ''}

【写作规矩（严格遵守）】
1. 全文禁止以感情线作为主线！
2. 全文禁止以主角个人成长作为核心主线！
3. 主角的一切成长和变强必须是为了完成外部使命的手段和工具
4. 小说类型限定：玄幻、奇幻、科幻、仙侠、魔幻、异能、末世
5. 避免华美空洞、流水账、套路化等AI写作弊端
6. 确保内容紧凑、有悬念
${avoidClichés ? '7. 避免常见套路（如：退婚、打脸、后宫等）' : ''}

【输出格式】
请以JSON格式输出：
{
  "beginning": "故事开端（100-200字）",
  "mainConflict": "主要冲突（100-200字）",
  "plotPoints": ["转折点1（50-100字）", "转折点2（50-100字）", ...],
  "climax": "高潮（100-200字）",
  "ending": "结局（100-200字）"
}`;

          let storyContent = '';
          let storyData: any = null;  // 定义在外部

          try {
            const storyStream = client.stream([
              { role: 'user', content: storyPrompt }
            ], { temperature: 0.7 });

            for await (const chunk of storyStream) {
              if (chunk.content) {
                storyContent += chunk.content.toString();
              }
            }

            // 提取JSON
            const storyMatch = storyContent.match(/\{[\s\S]*\}/);
            storyData = storyMatch ? JSON.parse(storyMatch[0]) : {
              beginning: "待完善",
              mainConflict: "待完善",
              plotPoints: ["待完善"],
              climax: "待完善",
              ending: "待完善"
            };

            controller.enqueue(encoder.encode(`event:story\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify(storyData)}\n\n`));
            console.log('[GenerateFullOutline] 故事大纲生成完成');
          } catch (error: any) {
            console.error('[GenerateFullOutline] 故事大纲生成失败:', error);
            storyData = {
              beginning: "生成失败",
              mainConflict: "生成失败",
              plotPoints: ["生成失败"],
              climax: "生成失败",
              ending: "生成失败"
            };
            controller.enqueue(encoder.encode(`event:story\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify(storyData)}\n\n`));
          }

          // ========== 阶段4: 生成章节概要（分批生成） ==========
          console.log('[GenerateFullOutline] 阶段4: 生成章节概要');
          const batchSize = 50; // 每批生成50章
          const totalBatches = Math.ceil(targetChapterCount / batchSize);
          let allChapters: any[] = [];

          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const startChapter = batchIndex * batchSize + 1;
            const endChapter = Math.min((batchIndex + 1) * batchSize, targetChapterCount);
            const chaptersInBatch = endChapter - startChapter + 1;

            const percentage = Math.round(20 + (batchIndex / totalBatches) * 70);

            console.log(`[GenerateFullOutline] 生成第${startChapter}-${endChapter}章概要（第${batchIndex + 1}/${totalBatches}批）`);
            controller.enqueue(encoder.encode(`event:progress\n`));
            controller.enqueue(encoder.encode(`data:${JSON.stringify({
              phase: '章节概要',
              percentage: percentage,
              message: `正在生成第${startChapter}-${endChapter}章概要...`
            })}\n\n`));

            // 生成这一批的章节概要
            const chapterPrompt = `你是一位专业的网文编辑，擅长${novelType}类型小说的章节规划。

【任务】
为以下小说的第${startChapter}-${endChapter}章生成详细的章节概要。

【小说信息】
- 标题：${title}
- 类型：${novelType}
- 总章节数：${targetChapterCount}章
- 当前批次：第${startChapter}-${endChapter}章（共${chaptersInBatch}章）
- 每章字数：${targetWordCount}字
- 叙事风格：${narrativeStyle}
- 语言风格：${languageStyle}
- 节奏偏好：${pacePreference}
- 故事模式：${storyMode}
- 冲突类型：${conflictType}
- 情感基调：${emotionalTone}
- ${needVolumes ? `分卷规划：需要分成${volumeCount}卷` : '分卷规划：不需要分卷'}
- 整体大纲：${JSON.stringify(storyData)}

【主题设定】
${coreTheme ? `- 核心主题：${coreTheme}` : ''}
${philosophicalThinking ? `- 哲学思考：${philosophicalThinking}` : ''}

【主要人物】
- 主角：${protagonistName || '未命名'}
${protagonistGoal ? `- 主角目标：${protagonistGoal}` : ''}

【关键设定】
${goldenFinger ? `- 金手指：${goldenFinger}` : ''}
${keyItems ? `- 关键物品：${keyItems}` : ''}
${importantLocations ? `- 重要地点：${importantLocations}` : ''}

【分卷信息】
${needVolumes ? `当前批次属于第${Math.ceil(startChapter / (targetChapterCount / volumeCount))}卷` : '当前批次为单卷结构'}

【要求】
1. 每章要有独立的章节标题（吸引人，符合${novelType}类型）
2. 每章概要100-200字，明确这一章的主要情节
3. 章节之间要有连贯性，形成完整的剧情线
4. 每章都要有冲突、转折或悬念
5. 注意：第${startChapter}章是这一批的开始，要注意承接上一批的剧情
6. 最后一批要为结局做好铺垫
7. ${needVolumes ? `当前批次要符合第${Math.ceil(startChapter / (targetChapterCount / volumeCount))}卷的主题和结构` : '保持整体结构完整'}
8. 语言风格要符合${languageStyle}风格
9. 节奏要符合${pacePreference}要求
10. ${avoidElements ? `避免以下元素：${avoidElements}` : ''}

【写作规矩（严格遵守）】
1. 全文禁止以感情线作为主线！
2. 全文禁止以主角个人成长作为核心主线！
3. 主角的一切成长和变强必须是为了完成外部使命的手段和工具
4. 主角的目标必须是外部使命（如拯救世界、复仇、守护重要事物等）
5. 小说类型限定：玄幻、奇幻、科幻、仙侠、魔幻、异能、末世
6. 避免华美空洞、流水账、套路化等AI写作弊端
7. 确保内容紧凑、有悬念
${avoidClichés ? '8. 避免常见套路（如：退婚、打脸、后宫等）' : ''}
${customRequirements ? `9. 其他要求：${customRequirements}` : ''}

【输出格式】
请以JSON格式输出（${chaptersInBatch}章）：
[
  {
    "chapter": ${startChapter},
    "title": "章节标题",
    "outline": "章节概要（100-200字）"
  },
  {
    "chapter": ${startChapter + 1},
    "title": "章节标题",
    "outline": "章节概要（100-200字）"
  },
  ...
  {
    "chapter": ${endChapter},
    "title": "章节标题",
    "outline": "章节概要（100-200字）"
  }
]`;

            let chapterContent = '';
            try {
              const chapterStream = client.stream([
                { role: 'user', content: chapterPrompt }
              ], { temperature: 0.7 });

              for await (const chunk of chapterStream) {
                if (chunk.content) {
                  chapterContent += chunk.content.toString();
                }
              }

              // 提取JSON数组
              const chapterMatch = chapterContent.match(/\[[\s\S]*\]/);
              const chapterData = chapterMatch ? JSON.parse(chapterMatch[0]) : [];

              // 验证章节数量
              if (chapterData.length !== chaptersInBatch) {
                console.warn(`[GenerateFullOutline] 第${startChapter}-${endChapter}章生成数量不匹配：期望${chaptersInBatch}章，实际${chapterData.length}章`);
              }

              allChapters = [...allChapters, ...chapterData];

              // 发送这批章节
              controller.enqueue(encoder.encode(`event:chapters\n`));
              controller.enqueue(encoder.encode(`data:${JSON.stringify({
                startChapter,
                endChapter,
                chapters: chapterData
              })}\n\n`));

              console.log(`[GenerateFullOutline] 第${startChapter}-${endChapter}章概要生成完成，共${chapterData.length}章`);
            } catch (error: any) {
              console.error(`[GenerateFullOutline] 第${startChapter}-${endChapter}章生成失败:`, error);
              // 生成占位章节
              const placeholderChapters = [];
              for (let i = startChapter; i <= endChapter; i++) {
                placeholderChapters.push({
                  chapter: i,
                  title: `第${i}章`,
                  outline: "生成失败，需要手动补充"
                });
              }
              allChapters = [...allChapters, ...placeholderChapters];

              controller.enqueue(encoder.encode(`event:chapters\n`));
              controller.enqueue(encoder.encode(`data:${JSON.stringify({
                startChapter,
                endChapter,
                chapters: placeholderChapters
              })}\n\n`));
            }
          }

          // ========== 完成 ==========
          console.log('[GenerateFullOutline] 全部章节概要生成完成，共', allChapters.length, '章');
          controller.enqueue(encoder.encode(`event:progress\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            phase: '完成',
            percentage: 100,
            message: '大纲生成完成！'
          })}\n\n`));

          controller.enqueue(encoder.encode(`event:complete\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            success: true,
            totalChapters: allChapters.length,
            targetChapters: targetChapterCount,
            targetWordCount: targetWordCount,
            totalWords: targetChapterCount * targetWordCount
          })}\n\n`));

        } catch (error: any) {
          console.error('[GenerateFullOutline] 生成过程出错:', error);
          controller.enqueue(encoder.encode(`event:error\n`));
          controller.enqueue(encoder.encode(`data:${JSON.stringify({
            error: error.message || '生成失败'
          })}\n\n`));
        }

        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[GenerateFullOutline] 服务器错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    );
  }
}
