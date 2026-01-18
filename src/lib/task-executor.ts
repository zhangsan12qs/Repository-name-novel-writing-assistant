import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { taskManager, TaskData } from './task-manager';

/**
 * 执行生成任务
 * 这个函数从 generate-all/route.ts 中提取出来，以便于断点续传
 */
export async function executeTask(taskId: string) {
  try {
    const task = taskManager.getTask(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    // 检查是否有已生成的章节，用于断点续传
    const existingChapters = task.result?.chapters || [];
    const startChapterIndex = existingChapters.length;

    // 如果已经有章节，直接从断点继续
    if (startChapterIndex > 0) {
      taskManager.updateProgress(taskId, {
        currentStep: 'generating-chapters',
        message: `从第${startChapterIndex + 1}章继续生成...`,
        currentChapter: startChapterIndex,
        percentage: 50 + Math.round((startChapterIndex / task.params.chapterCount) * 50),
      });
      await generateChapters(taskId, startChapterIndex);
      return;
    }

    taskManager.updateStatus(taskId, 'processing');
    taskManager.updateProgress(taskId, {
      currentStep: 'initializing',
      percentage: 0,
      message: '正在初始化生成任务...',
    });

    const config = new Config();
    const client = new LLMClient(config);
    const { genre, theme, protagonist, chapterCount } = task.params;

    // ========== 第一步：生成基础大纲 ==========
    taskManager.updateProgress(taskId, {
      currentStep: 'generating-outline',
      percentage: 5,
      message: '正在生成基础大纲...',
    });

    const outlineMessages = [
      {
        role: 'system' as const,
        content: `你是一位专业的网络小说策划师。根据用户提供的信息生成完整的小说大纲。

【核心原则】全文禁止以感情线作为主线！
- 故事的核心驱动力必须是使命任务、世界观冲突、事业追求、家族责任等非感情主题
- 感情戏可以作为辅助情节，但不能成为故事的主要推动力
- 主角的主要目标、主要冲突、主要事件都不能围绕感情关系展开
- 如果故事的核心矛盾是为了解决感情问题，则违反此原则

【核心原则】全文禁止以主角个人成长作为核心主线！
- 主角个人成长（变强、升级、觉醒能力等）不能是故事的核心驱动力
- 故事的核心驱动力应该是外部使命（拯救世界、复仇、保护重要事物、探索未知等）
- 主角的变强和成长必须是为了完成外部使命的工具和手段，而非目标本身
- 如果故事的核心是"主角如何变强"，则违反此原则
- 正确示例：主角为了拯救世界而变强；错误示例：主角为了变强而拯救世界

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻（形容词>3个/句），要求内容充实、有实质意义
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理（如"公交车坐三天三夜"）
3. ❌ 破坏节奏：禁止过度描写破坏紧张氛围，张弛有度
4. ❌ 不推剧情：每段必须有情节推进，不能只写环境描写和名词解释
5. ❌ 内容注水：禁止插入大量无意义描写，要紧凑有力
6. ❌ 人物扁平：角色必须有鲜明性格、动机和成长弧，不能是工具人
7. ❌ 对话平淡：对话要有张力，体现人物性格，不能像念白
8. ❌ 流水账：避免"然后、接着、之后、于是"等连接词过多（>3个/段）
9. ❌ 套路化：禁止"三角恋、退婚、打脸、绿帽、重生、无敌、系统"等俗套

格式要求：
【小说类型】：XXX（限定：玄幻/奇幻/科幻/仙侠/魔幻/异能/末世）
【核心主题】：XXX（拯救/复仇/探索/守护/争霸/解谜/对抗邪恶，禁止"成长"、"变强"等个人成长主题，禁止以感情为主题）
【故事梗概】：XXX（100-200字，描述主线剧情，不重点描写感情，不重点描写主角如何变强）

【分卷规划】：
第一卷：《卷名》
- 第一章：章节标题（简要描述，10-20字）
- 第二章：章节标题（简要描述，10-20字）
...（每卷4-5章）

【主要人物】：
- 主角：姓名、性格、背景（核心目标必须是外部使命，如拯救世界、复仇、守护重要事物等，禁止"变强"、"升级"等个人成长目标）
- 反派：姓名、动机
- 重要配角：2-3个（角色必须有动机，不能是工具人）

【世界观设定】：
- 核心设定：XXX
- 重要地点：XXX
- 关键规则：XXX`
      },
      {
        role: 'user' as const,
        content: `请生成小说大纲，共${chapterCount}章，分${Math.ceil(chapterCount / 4)}卷：

类型：${genre}（必须是玄幻/奇幻/科幻/仙侠/魔幻/异能/末世）
主题：${theme}（必须是拯救/复仇/探索/守护/争霸/解谜/对抗邪恶等外部使命主题，禁止"成长"、"变强"等个人成长主题，禁止感情主题）
主角：${protagonist || '未设定'}

重要提示：
1. 严禁以感情线作为主线
2. 严禁以主角个人成长（变强、升级、觉醒）作为核心主线
3. 避免所有AI写作弊端（华美的空洞、逻辑bug、流水账、内容注水、套路化等）
4. 确保故事有趣、紧凑、有悬念，不要平淡无趣`
      }
    ];

    const outlineResponse = await client.invoke(outlineMessages, { temperature: 0.7 });

    taskManager.updateResult(taskId, {
      outline: outlineResponse.content,
    });

    // ========== 第二步：生成详细大纲（每章300-500字）==========
    taskManager.updateProgress(taskId, {
      currentStep: 'generating-detailed-outline',
      percentage: 15,
      message: '正在生成详细大纲（每章详细情节）...',
    });

    const detailedOutlineMessages = [
      {
        role: 'system' as const,
        content: `你是一位专业的网络小说策划师。基于基础大纲，生成每章的详细情节描述。

【核心原则】全文禁止以感情线作为主线！
- 在详细描述每章情节时，确保主线是非感情主题
- 如果章节包含感情戏，必须服务于主线剧情，不能独立成为本章核心
- 每章的核心冲突、主要事件都不能围绕感情关系展开

【核心原则】全文禁止以主角个人成长作为核心主线！
- 确保每章的主要情节不是为了展示主角变强或升级
- 主角的变强和成长必须是为了完成外部使命的过程，而非目的
- 每章的核心目标应该是推进外部使命的进程

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻，要求内容充实、有实质意义
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理
3. ❌ 破坏节奏：详细大纲要张弛有度，为紧张氛围留空间
4. ❌ 不推剧情：每章必须有明确的情节推进
5. ❌ 内容注水：详细情节要紧凑，不写无意义细节
6. ❌ 人物扁平：角色在详细情节中要有动机和行动
7. ❌ 套路化：禁止"退婚、打脸、无敌"等俗套

要求：
- 每章300-500字的详细情节描述
- 包含场景、人物、冲突、转折等要素
- 保持情节连贯性和逻辑性
- 为后续写作提供明确的指导
- 确保每章都有悬念和转折，不要平淡

格式：
第一章：章节标题
【场景】：XXX
【出场人物】：XXX
【主要情节】：XXX（300-500字，明确本章主线目标）
【核心冲突】：XXX（必须是非感情冲突，除非感情戏服务于主线）
【本章结尾】：XXX

第二章：章节标题
...（以此类推）`
      },
      {
        role: 'user' as const,
        content: `基于以下基础大纲，生成每章的详细情节描述（共${chapterCount}章）：

${outlineResponse.content}

重要提示：
1. 确保每章的主要情节都不是以感情线为核心
2. 确保每章的主要情节都不是以主角个人成长（变强、升级）为核心
3. 避免所有AI写作弊端
4. 确保每章都有悬念和转折，吸引读者继续阅读`
      }
    ];

    const detailedOutlineResponse = await client.invoke(detailedOutlineMessages, { temperature: 0.7 });

    // ========== 第三步：解析结构 ==========
    taskManager.updateProgress(taskId, {
      currentStep: 'creating-structure',
      percentage: 25,
      message: '正在解析章节结构...',
    });

    const structureMessages = [
      {
        role: 'system' as const,
        content: `从详细大纲中提取分卷和章节结构，只输出JSON格式：

{
  "volumes": [
    {
      "id": "vol-1",
      "title": "第一卷标题",
      "description": "卷描述",
      "order": 1
    }
  ],
  "chapters": [
    {
      "id": "1",
      "title": "章节标题",
      "volumeId": "vol-1",
      "order": 1,
      "outline": "详细章节大纲（300-500字）"
    }
  ]
}`
      },
      {
        role: 'user' as const,
        content: `从以下详细大纲中提取分卷和章节结构，共${chapterCount}章：\n${detailedOutlineResponse.content}`
      }
    ];

    const structureResponse = await client.invoke(structureMessages, { temperature: 0.3 });

    // 尝试提取JSON
    let structure;
    const jsonMatch = structureResponse.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structure = JSON.parse(jsonMatch[0]);
    } else {
      // 如果解析失败，使用默认结构
      structure = {
        volumes: [
          { id: 'vol-1', title: '第一卷', description: '', order: 1 }
        ],
        chapters: Array.from({ length: chapterCount }, (_, i) => ({
          id: (i + 1).toString(),
          title: `第${i + 1}章`,
          volumeId: 'vol-1',
          order: i + 1,
          outline: `第${i + 1}章详细情节`
        }))
      };
    }

    taskManager.updateResult(taskId, {
      volumes: structure.volumes,
      chapters: structure.chapters,
    });

    // ========== 第四步：生成角色 ==========
    taskManager.updateProgress(taskId, {
      currentStep: 'generating-characters',
      percentage: 40,
      message: '正在生成角色设定...',
    });

    const characterMessages = [
      {
        role: 'system' as const,
        content: `从大纲中提取角色信息，生成详细的角色设定。只输出JSON格式：

{
  "characters": [
    {
      "id": "char-1",
      "name": "姓名",
      "age": "年龄",
      "role": "角色定位",
      "personality": "性格特点",
      "background": "背景故事",
      "appearance": "外貌特征",
      "abilities": "能力特长",
      "goals": "目标",
      "weaknesses": "弱点",
      "relationships": "人物关系"
    }
  ]
}`
      },
      {
        role: 'user' as const,
        content: `从以下大纲中提取并完善角色信息：\n${outlineResponse.content}`
      }
    ];

    const characterResponse = await client.invoke(characterMessages, { temperature: 0.7 });

    let charactersData;
    const charJsonMatch = characterResponse.content.match(/\{[\s\S]*\}/);
    if (charJsonMatch) {
      const parsed = JSON.parse(charJsonMatch[0]);
      charactersData = parsed.characters || [];
    } else {
      charactersData = [];
    }

    taskManager.updateResult(taskId, {
      characters: charactersData,
    });

    // ========== 第五步：生成世界观 ==========
    taskManager.updateProgress(taskId, {
      currentStep: 'generating-world-settings',
      percentage: 50,
      message: '正在构建世界观...',
    });

    const worldMessages = [
      {
        role: 'system' as const,
        content: `从大纲中提取世界观设定，输出JSON格式：

{
  "worldSettings": [
    {
      "id": "ws-1",
      "name": "设定名称",
      "type": "类型（地点/宗门/物品/规则）",
      "description": "详细描述"
    }
  ]
}`
      },
      {
        role: 'user' as const,
        content: `从以下大纲中提取世界观设定：\n${outlineResponse.content}`
      }
    ];

    const worldResponse = await client.invoke(worldMessages, { temperature: 0.7 });

    let worldData;
    const worldJsonMatch = worldResponse.content.match(/\{[\s\S]*\}/);
    if (worldJsonMatch) {
      const parsed = JSON.parse(worldJsonMatch[0]);
      worldData = parsed.worldSettings || [];
    } else {
      worldData = [];
    }

    taskManager.updateResult(taskId, {
      worldSettings: worldData,
    });

    // ========== 第六步：逐章生成完整内容 ==========
    await generateChapters(taskId, 0);

    // ========== 完成 ==========
    taskManager.updateStatus(taskId, 'completed');
    taskManager.updateProgress(taskId, {
      currentStep: 'completed',
      percentage: 100,
      message: '恭喜！小说生成完成',
    });

  } catch (error) {
    console.error('执行任务失败:', error);
    taskManager.updateStatus(taskId, 'failed', error instanceof Error ? error.message : '未知错误');
  }
}

/**
 * 生成章节内容（支持断点续传）
 */
async function generateChapters(taskId: string, startIndex: number) {
  const task = taskManager.getTask(taskId);
  if (!task || !task.result?.chapters) {
    throw new Error('任务数据不完整');
  }

  const config = new Config();
  const client = new LLMClient(config);
  const { chapters, characters, worldSettings } = task.result;
  const generatedChapters = task.result?.chapters?.slice(0, startIndex) || [];

  taskManager.updateProgress(taskId, {
    currentStep: 'generating-chapters',
    percentage: 50,
    message: `准备生成${chapters.length}章完整内容...`,
    currentChapter: 0,
  });

  for (let i = startIndex; i < chapters.length; i++) {
    const chapter = chapters[i];
    const prevChapter = i > 0 ? generatedChapters[i - 1] : null;

    taskManager.updateProgress(taskId, {
      currentStep: 'generating-chapters',
      message: `正在生成第${i + 1}章：${chapter.title}（扩展至3000字）...`,
      currentChapter: i + 1,
      percentage: 50 + Math.round(((i + 1) / chapters.length) * 50),
    });

    const chapterMessages = [
      {
        role: 'system' as const,
        content: `你是一位专业的网络小说作家。基于详细的章节大纲，扩展成完整的章节内容。

【核心原则】全文禁止以感情线作为主线！
- 本章必须围绕大纲中设定的非感情主线目标展开
- 如果章节包含感情戏，必须作为辅助情节，服务于主线剧情
- 本章的核心冲突、主要事件、人物动机都不能围绕感情关系展开
- 感情戏的篇幅不应超过本章的20%，除非是为了表现主线冲突
- 主角的行动、决策、成长必须由主线任务驱动，而非感情纠葛

【核心原则】全文禁止以主角个人成长作为核心主线！
- 本章的主要情节不能是为了展示主角变强、升级、觉醒能力
- 主角的变强和成长必须是为了完成外部使命的过程和手段
- 本章的核心目标应该是推进外部使命的进程，而非主角的个人成长

【禁止AI写作弊端】（编辑拒稿的主要原因，必须严格遵守）
1. ❌ 华美的空洞：禁止堆砌华丽词藻（形容词>3个/句），要求内容充实
2. ❌ 逻辑bug：严禁人设矛盾、前后不一致、情节不合理
3. ❌ 破坏节奏：张弛有度，紧张时不要过度描写
4. ❌ 不推剧情：每段必须有情节推进，不能只有环境描写
5. ❌ 内容注水：3000字内容要有实质，不要无意义填充
6. ❌ 人物扁平：对话要体现性格，不能像念白
7. ❌ 流水账：避免"然后、接着、之后、于是"等连接词过多
8. ❌ 代入感弱：要让读者有代入感，有情绪波动

写作要求：
- 严格遵循详细大纲的情节描述
- 文笔流畅，描写生动，有画面感
- 人物性格要符合设定，对话要推动情节
- 避免狗血剧情、流水账和套路化
- 保持故事节奏，张弛有度
- 篇幅要求：3000-3500字
- 章节结尾要吸引读者，留下悬念或转折

扩展技巧：
1. 将大纲中的每个情节点扩展成200-300字的场景描写
2. 加入环境描写、人物心理活动、细节刻画
3. 对话要生动自然，体现人物性格（每句对话不超过80字）
4. 适当加入伏笔和暗示
5. 控制节奏，该快则快，该慢则慢

章节结构：
- 开头：场景描写，引出本章主线目标（500字）
- 发展：通过对话和行动推进主线情节（1500字）
- 高潮：关键情节转折或主线冲突爆发（800字）
- 结尾：悬念收尾，为下章铺垫（200字）

写作风格：
- 现代网络小说风格，节奏明快
- 语言简洁有力，避免冗长
- 有代入感，让读者身临其境
- 适当使用符合世界观的表达

请直接输出章节正文，不要任何解释和标记。`
      },
      {
        role: 'user' as const,
        content: `请将以下详细大纲扩展成完整的章节内容（3000-3500字）：

【章节标题】：${chapter.title}

【详细大纲】：${chapter.outline}

${prevChapter ? `【上一章结尾（用于衔接）】：
${prevChapter.content.slice(-300)}` : ''}

${characters && characters.length > 0 ? `\n【本章出场人物】：
${characters.map((c: any) => `- ${c.name}：${c.personality} ${c.role ? `(${c.role})` : ''}`).join('\n')}` : ''}

${worldSettings && worldSettings.length > 0 ? `\n【世界观设定】：
${worldSettings.slice(0, 3).map((w: any) => `- ${w.name}：${w.description}`).join('\n')}` : ''}

重要提示：
1. 本章必须围绕主线剧情展开，严禁以感情线作为主线
2. 本章的主要情节不能是为了展示主角变强、升级，严禁以主角个人成长作为核心主线
3. 避免所有AI写作弊端（华美的空洞、逻辑bug、流水账、内容注水、对话平淡等）
4. 确保有代入感，能让读者产生情绪波动

现在开始撰写本章正文：`
      }
    ];

    const chapterResponse = await client.invoke(chapterMessages, {
      temperature: 0.9,
    });

    generatedChapters.push({
      id: chapter.id,
      title: chapter.title,
      content: chapterResponse.content,
      volumeId: chapter.volumeId,
      order: chapter.order,
      wordCount: chapterResponse.content.length,
      outline: chapter.outline,
    });

    // 实时更新结果，支持断点续传
    taskManager.updateResult(taskId, {
      chapters: generatedChapters,
    });
  }
}

/**
 * 执行基于大纲重新生成任务
 */
export async function executeRegenerateTask(
  taskId: string,
  params: {
    outline: string;
    characters: any[];
    worldSettings: any[];
    existingVolumes: any[];
    existingChapters: any[];
  }
) {
  try {
    const task = taskManager.getTask(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    taskManager.updateStatus(taskId, 'processing');
    taskManager.updateProgress(taskId, {
      currentStep: 'initializing',
      percentage: 0,
      message: '正在初始化重新生成任务...',
    });

    const config = new Config();
    const client = new LLMClient(config);

    // ========== 第一步：解析大纲结构 ==========
    taskManager.updateProgress(taskId, {
      currentStep: 'creating-structure',
      percentage: 10,
      message: '正在解析大纲结构...',
    });

    const structureMessages = [
      {
        role: 'system' as const,
        content: `从小说大纲中提取分卷和章节结构，只输出JSON格式：

{
  "volumes": [
    {
      "id": "vol-1",
      "title": "第一卷标题",
      "description": "卷描述",
      "order": 1
    }
  ],
  "chapters": [
    {
      "id": "1",
      "title": "章节标题",
      "volumeId": "vol-1",
      "order": 1,
      "outline": "章节大纲描述"
    }
  ]
}

注意：
- 如果大纲中没有分卷信息，默认创建一个分卷
- 如果大纲中章节没有详细描述，使用章节标题作为大纲
- 保持现有的分卷和章节ID（如果存在）`
      },
      {
        role: 'user' as const,
        content: `从以下大纲中提取分卷和章节结构：\n${params.outline}`
      }
    ];

    const structureResponse = await client.invoke(structureMessages, { temperature: 0.3 });

    // 尝试提取JSON
    let structure;
    const jsonMatch = structureResponse.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structure = JSON.parse(jsonMatch[0]);
    } else {
      // 如果解析失败，使用现有结构或创建默认结构
      structure = {
        volumes: params.existingVolumes.length > 0 ? params.existingVolumes : [
          { id: 'vol-1', title: '第一卷', description: '', order: 1 }
        ],
        chapters: params.existingChapters.length > 0 ? params.existingChapters.map((ch: any, i: number) => ({
          id: ch.id,
          title: ch.title,
          volumeId: ch.volumeId || 'vol-1',
          order: ch.order || i + 1,
          outline: ch.outline || ch.title,
        })) : []
      };
    }

    taskManager.updateResult(taskId, {
      volumes: structure.volumes,
      chapters: structure.chapters,
      outline: params.outline,
      characters: params.characters,
      worldSettings: params.worldSettings,
    });

    // ========== 第二步：检查并生成详细大纲 ==========
    // 检查是否有章节缺少详细大纲
    const chaptersNeedingDetail = structure.chapters.filter(
      (ch: any) => !ch.outline || ch.outline.length < 100
    );

    if (chaptersNeedingDetail.length > 0) {
      taskManager.updateProgress(taskId, {
        currentStep: 'generating-detailed-outline',
        percentage: 20,
        message: `正在为${chaptersNeedingDetail.length}个章节生成详细大纲...`,
      });

      const detailedOutlineMessages = [
        {
          role: 'system' as const,
          content: `你是一位专业的网络小说策划师。基于基础大纲，生成每章的详细情节描述。

【核心原则】全文禁止以感情线作为主线！
- 在详细描述每章情节时，确保主线是非感情主题
- 如果章节包含感情戏，必须服务于主线剧情，不能独立成为本章核心
- 每章的核心冲突、主要事件都不能围绕感情关系展开

【核心原则】全文禁止以主角个人成长作为核心主线！
- 确保每章的主要情节不是为了展示主角变强或升级
- 主角的变强和成长必须是为了完成外部使命的过程，而非目的
- 每章的核心目标应该是推进外部使命的进程

要求：
- 每章300-500字的详细情节描述
- 包含场景、人物、冲突、转折等要素
- 保持情节连贯性和逻辑性

格式：
第一章：章节标题
【场景】：XXX
【出场人物】：XXX
【主要情节】：XXX（300-500字，明确本章主线目标，必须是外部使命目标）
【核心冲突】：XXX（必须是非感情冲突，除非感情戏服务于主线）
【本章结尾】：XXX

第二章：章节标题
...（以此类推）`
        },
        {
          role: 'user' as const,
          content: `基于以下基础大纲，生成需要详细描写的章节（${chaptersNeedingDetail.length}章）：

${params.outline}

重要提示：
1. 确保每章的主要情节都不是以感情线为核心
2. 确保每章的主要情节都不是以主角个人成长（变强、升级）为核心`
        }
      ];

      const detailedOutlineResponse = await client.invoke(detailedOutlineMessages, { temperature: 0.7 });

      // 尝试解析详细大纲并更新章节
      const detailJsonMatch = detailedOutlineResponse.content.match(/\{[\s\S]*\}/);
      if (detailJsonMatch) {
        const detailStructure = JSON.parse(detailJsonMatch[0]);
        if (detailStructure.chapters) {
          // 合并详细大纲到现有结构
          detailStructure.chapters.forEach((detailChapter: any) => {
            const existingChapter = structure.chapters.find(
              (ch: any) => ch.title === detailChapter.title || ch.order === detailChapter.order
            );
            if (existingChapter) {
              existingChapter.outline = detailChapter.outline;
            }
          });
          taskManager.updateResult(taskId, {
            chapters: structure.chapters,
          });
        }
      }
    }

    // ========== 第三步：逐章重新生成完整内容 ==========
    await generateChapters(taskId, 0);

    // ========== 完成 ==========
    taskManager.updateStatus(taskId, 'completed');
    taskManager.updateProgress(taskId, {
      currentStep: 'completed',
      percentage: 100,
      message: '重新生成完成！',
    });

  } catch (error) {
    console.error('执行重新生成任务失败:', error);
    taskManager.updateStatus(taskId, 'failed', error instanceof Error ? error.message : '未知错误');
  }
}
