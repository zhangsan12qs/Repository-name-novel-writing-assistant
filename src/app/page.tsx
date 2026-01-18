'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Users,
  ListTodo,
  Save,
  Eye,
  AlertTriangle,
  CheckCircle,
  FileText,
  Plus,
  Trash2,
  Wand2,
  Sparkles,
  BookMarked,
  Settings,
  Loader2,
  Copy,
  Edit,
  Check,
  Database,
  History,
  Activity,
  Network,
  Wrench,
  XCircle
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { dataProtector } from '@/lib/data-protector';
import { indexedDBStore } from '@/lib/indexeddb-store';
import ThankAuthorButton from '@/components/thank-author-button';
import AutoOutlineDialog from '@/components/auto-outline-dialog';

// 防抖函数
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 问题检测常量 - 提取到组件外部，避免重复创建
const ADJECTIVE_PATTERN = /(美丽|漂亮|壮观|雄伟|绚烂|辉煌|耀眼|璀璨|迷人|娇艳)/g;
const CONNECTIVE_PATTERN = /(然后|接着|之后|于是|随后|紧接着)/g;
const DOG_PLOTS = ['三角恋', '重生', '退婚', '打脸', '绿帽', '种马', '后宫', '逆天', '无敌', '系统'];
const ROMANCE_KEYWORDS = [
  '心动', '暗恋', '表白', '告白', '暧昧', '亲吻', '拥抱', '吃醋',
  '恋爱', '爱情', '情人', '心上人', '喜欢', '爱上', '深情', '痴情',
  '多情', '薄情', '负心', '薄幸', '专情', '专一', '移情别恋', '虐恋',
  '痴缠', '缠绵', '温存', '悸动'
];
const GROWTH_KEYWORDS = [
  '变强', '升级', '觉醒', '突破', '修炼', '提升', '进阶', '成长',
  '强大', '力量', '实力', '境遇', '境界', '阶位', '段位'
];
const RARE_CHARS_PATTERN = /[𠮷你𠰌𡧈]/g;

type Character = {
  id: string;
  name: string;
  age?: string;
  role?: string;
  personality?: string;
  background?: string;
  appearance?: string;
  abilities?: string;
  goals?: string;
  weaknesses?: string;
  relationships?: string;
  // 人物追踪字段
  firstAppearanceChapter?: string; // 首次出现的章节ID
  firstAppearanceChapterTitle?: string; // 首次出现的章节标题
  lastAppearanceChapter?: string; // 最后出现的章节ID
  lastAppearanceChapterTitle?: string; // 最后出现的章节标题
  appearanceReason?: string; // 出现原因
  disappearanceReason?: string; // 消失原因
  status: 'active' | 'inactive' | 'deceased' | 'unknown'; // 当前状态
  chapterAppearances: string[]; // 出现的章节ID列表
};

type Volume = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

type Chapter = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: 'draft' | 'in_progress' | 'completed';
  volumeId: string;
  order: number;
};

type Issue = {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  suggestion?: string;
};

type WorldSetting = {
  id: string;
  name: string;
  type: string;
  description: string;
};

type ToolResult = {
  content: string;
  isStreaming?: boolean;
};

export default function NovelEditor() {
  const [title, setTitle] = useState('');
  const [volumes, setVolumes] = useState<Volume[]>([
    { id: 'vol-1', title: '第一卷', description: '', order: 1 },
  ]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    age: '',
    role: '',
    personality: '',
    background: '',
    appearance: '',
    abilities: '',
    goals: '',
    weaknesses: '',
    relationships: '',
    appearanceReason: '',
    disappearanceReason: '',
    status: 'active',
  });
  const [outline, setOutline] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([]);
  // 创作步骤状态
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeTab, setActiveTab] = useState<'characters' | 'world' | 'tools' | 'tasks' | 'analysis' | 'analysisResult' | 'import'>('characters');

  // 步骤定义
  const steps = [
    { id: 1, name: '准备设定', icon: '📝', color: 'blue', description: '生成大纲、设定人物和世界观' },
    { id: 2, name: '规划结构', icon: '📚', color: 'purple', description: '设置章节、分卷和批量生成' },
    { id: 3, name: '内容创作', icon: '✍️', color: 'green', description: '使用AI工具编写章节' },
    { id: 4, name: '质量检查', icon: '✅', color: 'orange', description: '检查剧情、修复问题' },
    { id: 5, name: '高级功能', icon: '⚙️', color: 'gray', description: '拆书分析、任务管理等' },
  ];

  // 批量生成章节相关状态
  const [batchChapterGenerating, setBatchChapterGenerating] = useState(false);
  const [batchGenerateChapterCount, setBatchGenerateChapterCount] = useState(5);
  const [batchGenerateProgress, setBatchGenerateProgress] = useState({
    stepName: '',
    percentage: 0,
    message: '',
  });
  const [batchRewriteProgress, setBatchRewriteProgress] = useState<{
    currentAttempt: number;
    maxAttempts: number;
    currentScore: number;
    currentPenalty: number;
    isRewriting: boolean;
  } | null>(null);
  const [batchGenerateResult, setBatchGenerateResult] = useState<any>(null);
  const [refreshingStats, setRefreshingStats] = useState(false);

  // 章节设置
  const [chapterSettings, setChapterSettings] = useState({
    targetChapterCount: 20,
    targetWordCountPerChapter: 3000,
  });

  // 写作反馈与调整
  const [feedbackSettings, setFeedbackSettings] = useState({
    dissatisfactionReason: '',
    idealContent: '',
  });

  // 大纲反馈与调整
  const [outlineFeedbackSettings, setOutlineFeedbackSettings] = useState({
    dissatisfactionReason: '', // 对当前大纲哪里不满意的原因
    idealOutline: '', // 理想的大纲描述
  });

  // 文章目的需求与更改指令
  const [articleRequirements, setArticleRequirements] = useState({
    purpose: '', // 文章目的（如：介绍世界观、推进剧情、展示角色性格等）
    styleChange: '', // 风格调整（如：更简洁、更华丽、更幽默等）
    contentChange: '', // 内容增删（如：增加打斗场面、减少对话等）
    characterAdjust: '', // 角色调整（如：让主角更冷静、让反派更狡猾等）
    plotDirection: '', // 剧情走向（如：增加悬念、加快节奏、铺垫伏笔等）
    dialogueOptimization: '', // 对话优化（如：让对话更有张力、体现角色性格等）
    descriptionEnhance: '', // 描写优化（如：增强环境描写、增加感官细节等）
  });

  // 拆书分析相关状态
  const [bookContentToAnalyze, setBookContentToAnalyze] = useState('');
  const [analyzingBook, setAnalyzingBook] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({
    step: '',
    percentage: 0,
    message: '',
  });

  // 按钮loading状态管理器 - 提供即时反馈
  const [buttonLoading, setButtonLoading] = useState<{[key: string]: boolean}>({});
  const setButtonLoadingState = useCallback((buttonId: string, loading: boolean) => {
    setButtonLoading(prev => ({ ...prev, [buttonId]: loading }));
  }, []);

  // 处理自动生成大纲完成
  const handleAutoOutlineComplete = (data: any) => {
    console.log('[AutoOutline] 收到生成数据:', data);

    // 设置标题
    if (data.title) {
      setTitle(data.title);
    }

    // 设置章节设置
    if (data.targetChapterCount || data.targetWordCount) {
      setChapterSettings({
        targetChapterCount: data.targetChapterCount || 100,
        targetWordCountPerChapter: data.targetWordCount || 3000,
      });
    }

    // 设置世界观
    if (data.world) {
      const worldText = `核心设定：${data.world.coreSetting || ''}
力量体系：${data.world.powerSystem || ''}
地理环境：${data.world.geographicalEnvironment || ''}
社会结构：${data.world.socialStructure || ''}
历史背景：${data.world.historicalBackground || ''}
核心冲突：${data.world.coreConflict || ''}
创新点：${data.world.innovations || ''}`;
      setWorldSettings([
        {
          id: 'world-1',
          name: '世界观设定',
          type: data.novelType || '玄幻',
          description: worldText
        }
      ]);
    }

    // 设置人物
    if (data.characters && data.characters.length > 0) {
      const newCharacters = data.characters.map((char: any, index: number) => ({
        id: `char-${Date.now()}-${index}`,
        name: char.name || `人物${index + 1}`,
        age: char.age || '',
        role: char.role || '配角',
        personality: char.personality || '',
        background: char.background || '',
        appearance: char.appearance || '',
        abilities: char.abilities || '',
        goals: char.goals || '',
        weaknesses: char.weaknesses || '',
        relationships: char.relationships || '',
        appearanceReason: '',
        disappearanceReason: '',
        status: 'active' as const,
        chapterAppearances: [] as string[],
      }));
      setCharacters(newCharacters);
    }

    // 设置故事大纲
    if (data.story) {
      const storyText = `【故事开端】
${data.story.beginning || ''}

【主要冲突】
${data.story.mainConflict || ''}

【转折点】
${data.story.plotPoints?.map((p: string) => `• ${p}`).join('\n') || ''}

【高潮】
${data.story.climax || ''}

【结局】
${data.story.ending || ''}`;
      setOutline(storyText);
    }

    // 设置章节概要（如果有）
    if (data.chapters && data.chapters.length > 0) {
      const chaptersText = data.chapters.map((ch: any) =>
        `第${ch.chapter}章：${ch.title}\n${ch.outline}`
      ).join('\n\n');
      // 可以将章节概要追加到大纲中，或者单独保存
      console.log('[AutoOutline] 章节概要已生成，共', data.chapters.length, '章');
    }

    alert(`大纲生成完成！\n\n包含：\n• 世界观设定\n• ${data.characters?.length || 0}个主要人物\n• 完整故事大纲\n• ${data.chapters?.length || 0}章详细概要\n\n你可以根据这个大纲开始批量生成章节了！`);
  };

  // 实时部分结果（用于边分析边显示）
  const [partialResults, setPartialResults] = useState<any[]>([]);

  // 更改导入状态
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importData, setImportData] = useState({
    worldview: '',
    characters: [] as any[],
    plotStructure: '',
    writingStyle: '',
    coreTheme: '',
    suggestions: '',
  });

  // 智能改写状态 - 分步改写
  const [rewriting, setRewriting] = useState<{[key: string]: boolean}>({});
  const [rewriteProgress, setRewriteProgress] = useState<{[key: string]: string}>({});
  const [rewriteResult, setRewriteResult] = useState<string>('');

  // 改写完成状态追踪（必须改写后才能导入）
  const [rewriteCompleted, setRewriteCompleted] = useState({
    worldview: false,
    characters: false,
    plot: false,
    style: false,
    theme: false,
  });

  // 改写要求与改进模块
  const [rewriteFeedbackSettings, setRewriteFeedbackSettings] = useState({
    dissatisfactionReason: '', // 对原分析结果哪里不满意
    idealRewrite: '', // 理想的改写方向和要求
    specificChanges: '', // 具体需要修改的内容
  });

  // 高效模式开关 - 智能优化
  const [performanceMode, setPerformanceMode] = useState(false);
  // 当章节数超过100或人物数超过50时，自动开启高效模式
  useEffect(() => {
    const shouldEnablePerformanceMode = chapters.length > 100 || characters.length > 50;
    if (shouldEnablePerformanceMode !== performanceMode) {
      setPerformanceMode(shouldEnablePerformanceMode);
      if (shouldEnablePerformanceMode) {
        console.log('[高效模式] 已自动开启，章节数:', chapters.length, '人物数:', characters.length);
      }
    }
  }, [chapters.length, characters.length, performanceMode]);

  // 激活系统相关状态
  const [userId, setUserId] = useState('');

  // 加载用户ID（只在客户端执行）
  useEffect(() => {
    let id = localStorage.getItem('novel-user-id');
    if (!id) {
      id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('novel-user-id', id);
    }
    setUserId(id);
  }, []);

  // 列表渲染限制 - 避免大量数据卡顿
  const [charactersLimit, setCharactersLimit] = useState(20);
  const [chaptersLimit, setChaptersLimit] = useState(50);

  // 初始加载状态 - 确保数据加载完成后再显示编辑器
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // IndexedDB 初始化和数据迁移
  useEffect(() => {
    let mounted = true;

    const initializeStorage = async () => {
      try {
        // 初始化IndexedDB
        await dataProtector.init();

        if (!mounted) return;

        // 检查是否需要从localStorage迁移
        const needMigrate = await dataProtector.needMigration();

        if (needMigrate) {
          console.log('[初始化] 检测到localStorage数据，开始迁移...');
          const migrated = await dataProtector.migrateFromLocalStorage();

          if (migrated) {
            console.log('[初始化] ✅ 数据迁移完成！');
          } else {
            console.warn('[初始化] ⚠️ 数据迁移失败或被跳过');
          }
        } else {
          console.log('[初始化] IndexedDB已就绪，无需迁移');
        }
      } catch (error) {
        console.error('[初始化] IndexedDB初始化失败:', error);
      }
    };

    initializeStorage();

    return () => {
      mounted = false;
    };
  }, []);

  // 数据加载（异步）
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // 使用数据保护器加载数据（包含快照恢复机制）
        const savedData = await dataProtector.safeLoad();

        if (!mounted) return;

        if (savedData) {
          console.log('[加载] 从存储加载数据');
          console.log('[加载] 章节数量:', savedData.chapters?.length || 0);
          if (savedData.chapters && savedData.chapters.length > 0) {
            console.log('[加载] 第一章内容长度:', savedData.chapters[0].content?.length || 0);
          }
          try {
            if (savedData.title) setTitle(savedData.title);
            if (savedData.volumes && savedData.volumes.length > 0) setVolumes(savedData.volumes);
            
            // 确保章节数据完整（包括内容）
            if (savedData.chapters && savedData.chapters.length > 0) {
              // 检查每个章节的内容是否完整
              const chaptersWithContent = await Promise.all(
                savedData.chapters.map(async (chapter: Chapter) => {
                  // 如果章节没有内容，尝试从IndexedDB加载
                  if (!chapter.content || chapter.content.length === 0) {
                    console.log(`[加载] 章节 ${chapter.id} 内容为空，从IndexedDB加载...`);
                    try {
                      const content = await indexedDBStore.loadChapterContent(chapter.id);
                      if (content && content.length > 0) {
                        console.log(`[加载] 章节 ${chapter.id} 从IndexedDB加载内容成功，长度: ${content.length}`);
                        return { ...chapter, content };
                      }
                    } catch (error) {
                      console.error(`[加载] 章节 ${chapter.id} 从IndexedDB加载失败:`, error);
                    }
                  }
                  return chapter;
                })
              );
              
              console.log('[加载] 所有章节内容已确认完整');
              console.log('[加载] 第一章内容长度:', chaptersWithContent[0].content?.length || 0);
              
              setChapters(chaptersWithContent);
              setCurrentChapter(chaptersWithContent[0]);
            }
            if (savedData.characters) setCharacters(savedData.characters);
            if (savedData.outline) setOutline(savedData.outline);
            if (savedData.worldSettings) setWorldSettings(savedData.worldSettings);
            if (savedData.chapterSettings) setChapterSettings(savedData.chapterSettings);
            if (savedData.feedbackSettings) setFeedbackSettings(savedData.feedbackSettings);
            if (savedData.outlineFeedbackSettings) setOutlineFeedbackSettings(savedData.outlineFeedbackSettings);
            if (savedData.articleRequirements) setArticleRequirements(savedData.articleRequirements);
            // 恢复拆书分析相关数据
            if (savedData.analysisResult) setAnalysisResult(savedData.analysisResult);
            if (savedData.uploadedFileName) setUploadedFileName(savedData.uploadedFileName);
            if (savedData.partialResults) setPartialResults(savedData.partialResults);
            // 恢复更改导入相关数据
            if (savedData.importData) setImportData(savedData.importData);
            if (savedData.rewriteCompleted) setRewriteCompleted(savedData.rewriteCompleted);
            if (savedData.rewriteFeedbackSettings) setRewriteFeedbackSettings(savedData.rewriteFeedbackSettings);
            if (savedData.performanceMode !== undefined) setPerformanceMode(savedData.performanceMode);

            console.log('[加载] 数据加载完成');
          } catch (error) {
            console.error('加载保存的数据失败:', error);
          }
        } else {
          console.log('[加载] 未找到保存的数据');
        }

        // 标记初始加载完成
        if (mounted) {
          setIsInitialLoading(false);
        }
      } catch (error) {
        console.error('[加载] 异步加载失败:', error);
        // 即使加载失败，也要标记加载完成，避免无限加载
        if (mounted) {
          setIsInitialLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // 创建一个保存函数，使用防抖避免频繁写入
  const saveDataRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const hasUnsavedChangesRef = useRef<boolean>(false);

  // 快速检查数据是否真的需要保存（只检查关键字段）
  const needsSave = useCallback(() => {
    const currentData = {
      t: title,
      c: chapters.length,
      cc: characters.length,
      ol: outline.length,
      ws: worldSettings.length,
    };
    const lastDataStr = lastSavedDataRef.current.substring(0, 100); // 只比较前100个字符作为快速检查
    const currentDataStr = JSON.stringify(currentData);
    return !lastDataStr || lastDataStr !== currentDataStr;
  }, [title, chapters.length, characters.length, outline.length, worldSettings.length]);

  const saveData = useCallback(async () => {
    // 快速检查是否需要保存
    if (!hasUnsavedChangesRef.current && !needsSave()) {
      return;
    }

    if (saveDataRef.current) {
      clearTimeout(saveDataRef.current);
    }
    saveDataRef.current = setTimeout(async () => {
      const startTime = performance.now();

      try {
        // 保存所有数据，确保不丢失任何内容
        const dataToSave = {
          title,
          volumes,
          chapters,
          characters,
          outline,
          worldSettings,
          chapterSettings,
          feedbackSettings,
          outlineFeedbackSettings,
          articleRequirements,
          // 保存拆书分析相关数据
          analysisResult: analysisResult || null,
          uploadedFileName: uploadedFileName || '',
          partialResults: partialResults || [],
          // 保存更改导入相关数据
          importData: importData,
          rewriteCompleted: rewriteCompleted,
          rewriteFeedbackSettings: rewriteFeedbackSettings,
          performanceMode: performanceMode, // 保存性能模式设置
          lastSaved: new Date().toISOString(),
        };

        // 只在数据真正改变时才保存
        const dataStr = JSON.stringify(dataToSave);
        if (dataStr !== lastSavedDataRef.current) {
          // 使用数据保护器保存到IndexedDB（大数据支持）
          const saved = await dataProtector.safeSave(dataToSave);
          if (saved) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (duration > 100) {
              console.warn(`[性能警告] IndexedDB保存耗时 ${duration.toFixed(2)}ms`);
            }
            lastSavedDataRef.current = dataStr;
            hasUnsavedChangesRef.current = false;
            console.log('[保存] 数据已安全保存到IndexedDB');
          }
        }
      } catch (error) {
        console.error('保存数据失败:', error);
      }
    }, performanceMode ? 5000 : 3000); // 高效模式下增加到5秒，正常模式3秒
  }, [
    title,
    volumes,
    chapters,
    characters,
    outline,
    worldSettings,
    chapterSettings,
    feedbackSettings,
    outlineFeedbackSettings,
    articleRequirements,
    analysisResult,
    uploadedFileName,
    partialResults,
    importData,
    rewriteCompleted,
    rewriteFeedbackSettings,
    needsSave
  ]);

  // 标记有未保存的更改
  useEffect(() => {
    hasUnsavedChangesRef.current = true;
  }, [
    title,
    volumes,
    chapters,
    characters,
    outline,
    worldSettings,
    chapterSettings,
    feedbackSettings,
    outlineFeedbackSettings,
    articleRequirements,
    analysisResult,
    uploadedFileName,
    partialResults,
    importData,
    rewriteCompleted,
    rewriteFeedbackSettings
  ]);

  // 自动保存数据到 IndexedDB
  useEffect(() => {
    saveData();
  }, [saveData]);

  // 页面加载时重置分析状态（因为刷新会中断之前的分析）
  useEffect(() => {
    if (analyzingBook) {
      setAnalyzingBook(false);
      setAnalyzeProgress({ step: '', percentage: 0, message: '' });
    }
  }, []);

  // 切换到"更改导入"标签页时自动填充数据
  // 注意：此功能暂时禁用，以确保网站稳定性
  // 用户可以在"更改导入"标签页中手动点击"应用分析结果"按钮来填充数据
  // useEffect(() => {
  //   // 延迟执行，确保组件完全加载
  //   setTimeout(() => {
  //     if (activeTab === 'import' && !importDataInitialized.current) {
  //       // 检查是否有分析结果
  //       if (!analysisResult) {
  //         return;
  //       }

  //       // 检查importData是否为空，如果为空则从analysisResult填充
  //       const isImportDataEmpty = !importData.worldview &&
  //         (!importData.characters || importData.characters.length === 0) &&
  //         !importData.plotStructure &&
  //         !importData.writingStyle &&
  //         !importData.coreTheme;

  //       if (isImportDataEmpty) {
  //         console.log('[更改导入] importData为空，从analysisResult填充数据');
  //         // 安全地填充数据，避免类型错误
  //         try {
  //           setImportData({
  //             worldview: typeof analysisResult.worldview === 'string' ? analysisResult.worldview : '',
  //             characters: Array.isArray(analysisResult.characters) ? analysisResult.characters : [],
  //             plotStructure: typeof analysisResult.plotStructure === 'string' ? analysisResult.plotStructure : '',
  //             writingStyle: typeof analysisResult.writingStyle === 'string' ? analysisResult.writingStyle : '',
  //             coreTheme: typeof analysisResult.coreTheme === 'string' ? analysisResult.coreTheme : '',
  //             suggestions: typeof analysisResult.suggestions === 'string' ? analysisResult.suggestions : '',
  //           });
  //         } catch (error) {
  //           console.error('[更改导入] 填充数据时出错:', error);
  //         }
  //       }
  //       // 标记为已初始化
  //       importDataInitialized.current = true;
  //     }
  //   }, 100);
  // }, [activeTab]);

  // AI功能状态
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [selectedAiTool, setSelectedAiTool] = useState<string>('continue');
  const [aiPrompt, setAiPrompt] = useState('');

  // 剧情检查状态
  const [checkingPlot, setCheckingPlot] = useState(false);
  const [plotCheckResult, setPlotCheckResult] = useState<any>(null);
  const [showPlotCheck, setShowPlotCheck] = useState(false);

  // 问题修复状态
  const [fixingIssue, setFixingIssue] = useState(false);
  const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
  const [fixingChapterId, setFixingChapterId] = useState<string | null>(null);
  const [fixingResult, setFixingResult] = useState<string>('');

  // 批量修复状态
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [batchFixing, setBatchFixing] = useState(false);
  const [batchFixResult, setBatchFixResult] = useState<string>('');

  // 自动校核状态
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState({
    iteration: 0,
    maxIterations: 3,
    status: '',
  });
  const [verifyResult, setVerifyResult] = useState<any>(null);

  // 批量生成状态
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [generatedCharacters, setGeneratedCharacters] = useState<Partial<Character>[]>([]);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);

  // 改人名状态
  const [generatingName, setGeneratingName] = useState(false);
  const [batchRenaming, setBatchRenaming] = useState(false);
  const [renameProgress, setRenameProgress] = useState({ current: 0, total: 0, message: '' });

  // 分卷管理状态
  const [newVolumeTitle, setNewVolumeTitle] = useState('');
  const [newVolumeDescription, setNewVolumeDescription] = useState('');
  const [showVolumeManager, setShowVolumeManager] = useState(false);

  // 任务队列状态
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshingTasks, setRefreshingTasks] = useState(false);

  // 一键生成状态
  const [showGenerateAll, setShowGenerateAll] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<{
    step: number;
    stepName: string;
    status: string;
    message: string;
    progress?: { current: number; total: number; percentage: number };
  }>({
    step: 0,
    stepName: '',
    status: '',
    message: '',
  });
  const [generateParams, setGenerateParams] = useState({
    genre: '玄幻',
    theme: '拯救世界',
    protagonist: '少年',
    chapterCount: 5,
    wordCountPerChapter: 3000,
  });

  const updateChapterContent = (content: string) => {
    if (!currentChapter) return;
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    setCurrentChapter({ ...currentChapter, content, wordCount });
    // 同步更新chapters数组中的对应章节
    setChapters(prevChapters =>
      prevChapters.map(ch =>
        ch.id === currentChapter?.id ? { ...ch, content, wordCount } : ch
      )
    );
    // 不在这里直接调用checkIssues，改为使用防抖后的版本
  };

  // 为问题检测添加防抖 - 使用useMemo缓存结果
  const debouncedContent = useDebounce(currentChapter?.content || '', 500);

  // 纯函数版本的人物问题检测
  const detectCharacterIssuesPure = (charactersList: Character[], chaptersList: Chapter[]): Issue[] => {
    const issues: Issue[] = [];

    // 优化：提前检查，避免在循环中重复计算
    const totalChapters = chaptersList.length;

    charactersList.forEach(character => {
      // 检查凭空出现
      if (character.chapterAppearances.length > 0) {
        const firstChapterIndex = chaptersList.findIndex(c => c.id === character.chapterAppearances[0]);

        // 如果不是在第一章出现，且没有出现原因说明
        if (firstChapterIndex > 0 && !character.appearanceReason) {
          issues.push({
            id: `character-sudden-appearance-${character.id}`,
            type: 'error',
            message: `人物"${character.name}"在${character.firstAppearanceChapterTitle}中凭空出现，没有铺垫`,
            suggestion: `请在人物设定中填写"出现原因"，或者在之前的章节中铺垫此人物的存在（如：提前提及、侧面描写等）`,
          });
        }

        // 检查突然消失
        const lastChapterIndex = chaptersList.findIndex(c => c.id === character.chapterAppearances[character.chapterAppearances.length - 1]);
        const remainingChapters = totalChapters - lastChapterIndex - 1;

        // 如果在故事中途消失，且没有消失原因
        if (lastChapterIndex < totalChapters - 1 && remainingChapters >= 2 && character.role !== '龙套') {
          if (!character.disappearanceReason && character.status !== 'active') {
            issues.push({
              id: `character-sudden-disappearance-${character.id}`,
              type: 'error',
              message: `人物"${character.name}"在${character.lastAppearanceChapterTitle}后突然消失，未说明原因`,
              suggestion: `请在人物设定中填写"消失原因"，或者安排后续章节解释该人物的去向（如：完成任务离开、死亡、转入暗处等）`,
            });
          }
        }
      }
    });

    return issues;
  };

  // 纯函数版本的问题检测，用于useMemo - 智能优化版
  const checkIssuesPure = (content: string, charactersList: Character[], chaptersList: Chapter[]): Issue[] => {
    const startTime = performance.now();

    // 如果内容为空或很短，直接返回
    if (!content || content.length < 10) {
      return [];
    }

    // 优化：如果内容超过2000字，只检测核心问题（避免阻塞UI）
    const isLongContent = content.length > 2000;

    const foundIssues: Issue[] = [];
    const lines = content.split('\n');
    const hasParentsDeath = content.includes('父母双亡'); // 提前检查，避免在循环中重复检查

    // 提前构建检测需要的变量，避免在循环中重复计算
    const hasTalkKeywords = ['说', '想', '做'].some(kw => content.includes(kw));

    lines.forEach((line, index) => {
      // 跳过空行
      if (!line.trim()) return;

      const lineLower = line.toLowerCase();

      // 快速检查：如果行太短，跳过大部分检测
      if (line.length < 20) return;

      // 高效模式下，只检测核心问题（华美空洞、流水账、狗血剧情、感情线、成长线）
      const isPerformanceMode = performanceMode;

      // 检查华美的空洞（形容词堆砌）- 核心问题，必须检测
      const adjCount = (line.match(ADJECTIVE_PATTERN) || []).length;
      if (adjCount >= 3 && line.length > 50) {
        foundIssues.push({
          id: `${index}-flowery`,
          type: 'error',
          message: '存在"华美的空洞"，形容词过多，编辑判定为AI文特征',
          line: index + 1,
          suggestion: '避免堆砌华丽词藻，用具体动作、细节描写替代，注重内容而非形式',
        });
      }

      // 检查流水账（连接词过多）- 核心问题，必须检测
      const connectiveMatches = line.match(CONNECTIVE_PATTERN);
      if (connectiveMatches && connectiveMatches.length >= 3 && line.length < 200) {
        foundIssues.push({
          id: `${index}-log`,
          type: 'error',
          message: '流水账写法，罗列事件缺乏重点',
          line: index + 1,
          suggestion: '挑选关键事件深入描写，增加对话和环境渲染，而非简单罗列',
        });
      }

      // 检查常见狗血剧情 - 核心问题，必须检测
      if (DOG_PLOTS.some(plot => lineLower.includes(plot))) {
        const foundPlot = DOG_PLOTS.find(plot => lineLower.includes(plot));
        foundIssues.push({
          id: `${index}-${foundPlot}`,
          type: 'error',
          message: `包含常见狗血剧情"${foundPlot}"，套路化严重`,
          line: index + 1,
          suggestion: '尝试寻找新的冲突方式和情节推进方式，避免俗套',
        });
      }

      // 检查感情线作为主线的问题
      let romanceCount = 0;
      for (const kw of ROMANCE_KEYWORDS) {
        if (line.includes(kw)) romanceCount++;
        if (romanceCount >= 2) break; // 提前退出
      }

      // 如果一行中包含2个以上感情相关词汇，可能感情线比重过大
      if (romanceCount >= 2) {
        foundIssues.push({
          id: `${index}-romance-heavy`,
          type: 'error',
          message: '感情描写占比过高，禁止以感情线作为主线',
          line: index + 1,
          suggestion: '感情戏应为主线剧情的调味剂，而非主菜。请将重点放在外部使命（拯救世界、复仇、守护重要事物等）上',
        });
      }

      // 检查主角个人成长作为主线的问题
      if (lineLower.includes('为了')) {
        let growthCount = 0;
        for (const kw of GROWTH_KEYWORDS) {
          if (line.includes(kw)) growthCount++;
          if (growthCount > 0) break; // 提前退出
        }
        if (growthCount > 0) {
          foundIssues.push({
            id: `${index}-growth-mainline`,
            type: 'error',
            message: '疑似以主角个人成长（变强、升级）作为核心主线',
            line: index + 1,
            suggestion: '主角的变强和成长必须是为了完成外部使命的工具和手段，而非目标本身。请将主线回归到拯救世界、复仇、守护重要事物等外部使命',
          });
        }
      }

      // 检查逻辑问题（突然、竟然）- 高效模式下跳过
      if (!isPerformanceMode && (lineLower.match(/.*突然.*突然.*$/) || lineLower.match(/.*突然.*竟然.*$/))) {
        foundIssues.push({
          id: `${index}-logic`,
          type: 'warning',
          message: '情节转折缺乏逻辑铺垫',
          line: index + 1,
          suggestion: '提前埋下伏笔，让转折更自然，避免突兀',
        });
      }

      // 检查人设矛盾 - 核心问题，必须检测
      if (index > 5 && index < 50 && hasParentsDeath) {
        if (line.includes('爸爸') || line.includes('妈妈') || line.includes('父亲') || line.includes('母亲')) {
          foundIssues.push({
            id: `${index}-character-conflict`,
            type: 'error',
            message: '人设矛盾：之前设定父母双亡，此处却提到父母',
            line: index + 1,
            suggestion: '检查人物设定，确保前后一致，这是编辑重点扣分项',
          });
        }
      }

      // 检查对话问题（过长或平淡）- 核心问题，必须检测
      if (line.startsWith('"') && line.endsWith('"') && line.length > 120) {
        foundIssues.push({
          id: `${index}-dialogue-long`,
          type: 'error',
          message: '对话过长，缺乏动作和表情描写，AI文特征',
          line: index + 1,
          suggestion: '在对话中加入人物动作、表情、心理活动，打破单一对话形式',
        });
      }

      // 检查重复句式（代词重复）- 高效模式下跳过
      if (!isPerformanceMode && lineLower.match(/.*(他|她|它).*?(他|她|它).*?(他|她|它)/)) {
        foundIssues.push({
          id: `${index}-repetition`,
          type: 'warning',
          message: '代词重复使用，文呆板',
          line: index + 1,
          suggestion: '尝试用名字、具体称呼或不同表达方式替换部分代词',
        });
      }

      // 检查场景转换不明确 - 高效模式下跳过
      if (!isPerformanceMode && index > 0 && (lineLower.startsWith('与此同时') || lineLower.startsWith('另一边') || lineLower.startsWith('另外'))) {
        const prevLine = lines[index - 1].trim();
        if (prevLine && !prevLine.endsWith('。') && !prevLine.endsWith('！') && !prevLine.endsWith('？')) {
          foundIssues.push({
            id: `${index}-scene-change`,
            type: 'warning',
            message: '场景转换不明确，可能导致读者困惑',
            line: index + 1,
            suggestion: '使用分段或空行明确场景转换，可添加场景描写过渡',
          });
        }
      }

      // 检查内容注水（长段落但无实质内容）- 核心问题，必须检测
      if (line.length > 200 && adjCount >= 2 && !line.includes('说') && !line.includes('想') && !line.includes('做')) {
        foundIssues.push({
          id: `${index}-padded`,
          type: 'warning',
          message: '疑似内容注水，长段落缺乏实质内容',
          line: index + 1,
          suggestion: '删减无意义描写，增加人物互动和情节推进',
        });
      }

      // 检查缺乏情节推进（纯描写）- 核心问题，必须检测
      if (line.length > 100 && !line.includes('说') && !line.includes('想') && !line.includes('做') &&
          !line.includes('走') && !line.includes('跑') && !line.includes('看') && !line.includes('听') &&
          !line.includes('喊') && !line.includes('叫')) {
        const commonWords = line.match(/[是有在的了]/g);
        if (commonWords && commonWords.length > 5) {
          foundIssues.push({
            id: `${index}-no-plot`,
            type: 'error',
            message: '纯描写缺乏情节推进，AI文常见问题',
            line: index + 1,
            suggestion: '增加人物动作、对话和心理活动，推动剧情发展',
          });
        }
      }

      // 检查生僻字过多 - 高效模式下跳过
      if (!isPerformanceMode) {
        const rareChars = (line.match(RARE_CHARS_PATTERN) || []).length;
        if (rareChars > 0) {
          foundIssues.push({
            id: `${index}-rare-chars`,
            type: 'warning',
            message: '包含生僻字，影响阅读体验',
            line: index + 1,
            suggestion: '使用常见汉字，避免读者阅读困难',
          });
        }
      }

      // 检查不合理情节 - 核心问题，必须检测
      if (lineLower.includes('三天三夜')) {
        foundIssues.push({
          id: `${index}-unreasonable`,
          type: 'error',
          message: '情节不合理：公交车或交通工具不可能持续"三天三夜"',
          line: index + 1,
          suggestion: '检查情节逻辑，确保时间、空间等基本常识合理',
        });
      }
    });

    // 添加人物出现/消失问题检测
    const characterIssues = detectCharacterIssuesPure(charactersList, chaptersList);
    foundIssues.push(...characterIssues);

    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 50) {
      console.warn(`[性能警告] 问题检测耗时 ${duration.toFixed(2)}ms，内容长度: ${content.length}`);
    }

    return foundIssues;
  };

  // 使用useMemo缓存问题检测结果（优化版）
  const lastContentHashRef = useRef<string>('');

  const detectedIssues = useMemo(() => {
    // 安全检查：确保debouncedContent存在
    if (!debouncedContent) {
      return [];
    }

    // 快速检查内容是否真的变化了
    const currentContentHash = debouncedContent.length + ':' + debouncedContent.substring(0, 50);

    // 如果内容和上次一样，且人物和章节数量没变，跳过检测
    if (currentContentHash === lastContentHashRef.current &&
        lastContentHashRef.current.length > 0) {
      return []; // 返回空数组，避免重复计算
    }

    lastContentHashRef.current = currentContentHash;

    // 只在内容真正变化时才进行完整检测
    return checkIssuesPure(debouncedContent, characters, chapters);
  }, [debouncedContent, characters, chapters]);

  // 更新issues状态（添加防抖）
  const updateIssuesRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (updateIssuesRef.current) {
      clearTimeout(updateIssuesRef.current);
    }
    updateIssuesRef.current = setTimeout(() => {
      setIssues(detectedIssues);
    }, 300); // 300ms 防抖，避免频繁更新

    return () => {
      if (updateIssuesRef.current) {
        clearTimeout(updateIssuesRef.current);
      }
    };
  }, [detectedIssues]);

  const checkIssues = (content: string) => {
    // 保留原有函数签名以兼容，但不再直接使用
    return checkIssuesPure(content, characters, chapters);
  };

  const addCharacter = () => {
    if (!newCharacter.name) return;

    // 立即设置loading状态，提供即时反馈
    setButtonLoadingState('add-character', true);

    // 使用 requestAnimationFrame 确保loading状态先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCharacters([...characters, {
          ...newCharacter,
          id: Date.now().toString(),
          status: 'active',
          chapterAppearances: [],
        } as Character]);
        setNewCharacter({
          name: '',
          age: '',
          role: '',
          personality: '',
          background: '',
          appearance: '',
          abilities: '',
          goals: '',
          weaknesses: '',
          relationships: '',
          appearanceReason: '',
          disappearanceReason: '',
          status: 'active',
        });

        // 移除loading状态
        setButtonLoadingState('add-character', false);
      });
    });
  };

  // 创建完整的 Character 对象的辅助函数
  const createFullCharacter = (partial: Partial<Character>): Character => {
    return {
      ...partial,
      id: Date.now().toString(),
      status: partial.status || 'active',
      chapterAppearances: partial.chapterAppearances || [],
      firstAppearanceChapter: partial.firstAppearanceChapter,
      firstAppearanceChapterTitle: partial.firstAppearanceChapterTitle,
      lastAppearanceChapter: partial.lastAppearanceChapter,
      lastAppearanceChapterTitle: partial.lastAppearanceChapterTitle,
      appearanceReason: partial.appearanceReason || '',
      disappearanceReason: partial.disappearanceReason || '',
    } as Character;
  };

  // 一键改人名（当前正在编辑的人物）
  const handleGenerateName = async () => {
    setGeneratingName(true);

    try {
      // 构建请求参数
      const request = {
        gender: determineGender(newCharacter.name || ''),
        role: newCharacter.role,
        personality: newCharacter.personality,
        background: newCharacter.background,
        style: determineStyle(),
        avoidNames: characters.map(c => c.name)
      };

      console.log('[改人名] 开始生成名字:', request);

      const response = await fetch('/api/ai/generate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[改人名] 生成结果:', data);

        // 更新名字
        setNewCharacter({
          ...newCharacter,
          name: data.name
        });

        // 显示寓意
        if (data.meaning) {
          alert(`✨ 新名字：${data.name}\n\n寓意：${data.meaning}\n\n${data.reason ? `选择原因：${data.reason}` : ''}`);
        }
      } else {
        throw new Error('起名失败');
      }
    } catch (error) {
      console.error('[改人名] 错误:', error);
      alert('起名失败，请重试');
    } finally {
      setGeneratingName(false);
    }
  };

  // 批量改人名（所有人物并更新章节引用）
  const handleBatchRenameCharacters = async () => {
    if (characters.length === 0) {
      alert('暂无人物可改名');
      return;
    }

    if (!confirm(`确定要为所有 ${characters.length} 个人物生成新名字吗？\n\n此操作将：\n1. 为每个人物生成新名字\n2. 自动更新所有章节中的人物引用\n3. 保留原人物的其他属性\n\n⚠️ 此操作不可撤销！`)) {
      return;
    }

    setBatchRenaming(true);
    setRenameProgress({ current: 0, total: characters.length, message: '正在准备...' });

    const oldToNewNames: Record<string, string> = {};

    try {
      // 1. 为每个人物生成新名字
      for (let i = 0; i < characters.length; i++) {
        const character = characters[i];

        setRenameProgress({
          current: i + 1,
          total: characters.length,
          message: `正在为 "${character.name}" 生成新名字...`
        });

        try {
          const request = {
            gender: determineGender(character.name),
            role: character.role,
            personality: character.personality,
            background: character.background,
            style: determineStyle(),
            avoidNames: characters.map(c => c.name).concat(Object.values(oldToNewNames))
          };

          const response = await fetch('/api/ai/generate-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
          });

          if (response.ok) {
            const data = await response.json();
            oldToNewNames[character.name] = data.name;
          } else {
            // 如果失败，保留原名
            oldToNewNames[character.name] = character.name;
          }
        } catch (error) {
          console.error(`[批量改人名] 为 ${character.name} 生成名字失败:`, error);
          oldToNewNames[character.name] = character.name;
        }

        // 添加延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setRenameProgress({
        current: characters.length,
        total: characters.length,
        message: '正在更新章节内容...'
      });

      // 2. 更新人物列表
      const updatedCharacters = characters.map(char => ({
        ...char,
        name: oldToNewNames[char.name] || char.name
      }));
      setCharacters(updatedCharacters);

      // 3. 更新所有章节中的人物引用
      const updatedChapters = chapters.map(chapter => {
        let newContent = chapter.content || '';

        // 按名字长度降序排列，避免部分匹配问题
        const namePairs = Object.entries(oldToNewNames)
          .filter(([oldName, newName]) => oldName !== newName)
          .sort((a, b) => b[0].length - a[0].length);

        // 替换每个旧名字为新名字
        for (const [oldName, newName] of namePairs) {
          // 使用正则替换，支持更灵活的匹配
          // 排除名字前面有标点符号的情况
          const regex = new RegExp(`(?<![\\w一-龥])${oldName}(?![\\w一-龥])`, 'g');
          newContent = newContent.replace(regex, newName);
        }

        return {
          ...chapter,
          content: newContent,
          wordCount: newContent.trim() ? newContent.trim().split(/\s+/).length : 0
        };
      });

      setChapters(updatedChapters);

      // 4. 如果当前章节被更新，也要更新currentChapter
      if (currentChapter) {
        const updatedCurrent = updatedChapters.find(ch => ch.id === currentChapter?.id);
        if (updatedCurrent) {
          setCurrentChapter(updatedCurrent);
        }
      }

      setRenameProgress({
        current: characters.length,
        total: characters.length,
        message: '完成！'
      });

      // 显示结果
      const renamedCount = Object.entries(oldToNewNames).filter(([old, newN]) => old !== newN).length;
      const nameChanges = Object.entries(oldToNewNames)
        .filter(([old, newN]) => old !== newN)
        .map(([old, newN]) => `• ${old} → ${newN}`)
        .join('\n');

      alert(`✅ 批量改人名完成！\n\n成功改名 ${renamedCount} 个人物：\n${nameChanges}\n\n所有章节中的人物引用已自动更新。`);

    } catch (error) {
      console.error('[批量改人名] 错误:', error);
      alert('批量改人名失败，请重试');
    } finally {
      setBatchRenaming(false);
      setRenameProgress({ current: 0, total: 0, message: '' });
    }
  };

  // 辅助函数：推断性别（基于名字）
  const determineGender = (name: string): 'male' | 'female' | 'neutral' => {
    // 常见女性字
    const femaleChars = ['女', '妹', '姐', '婆', '娘', '姑', '妃', '后', '姬', '娣', '娜', '丽', '雅', '敏', '芳', '霞', '娟', '玲', '洁', '莹', '静', '雪', '云', '雨', '月', '星', '灵', '梦', '璃', '瑶', '婉', '怡', '婷'];
    // 常见男性字
    const maleChars = ['男', '郎', '父', '子', '公', '王', '帝', '皇', '将', '军', '侠', '豪', '雄', '杰', '强', '伟', '刚', '剑', '刀', '雷', '电', '炎', '火', '龙', '虎', '鹏', '昊', '阳', '天', '地', '山', '海', '林', '风', '云', '辰', '轩', '修', '玄', '墨', '影'];

    for (const char of name) {
      if (femaleChars.includes(char)) return 'female';
      if (maleChars.includes(char)) return 'male';
    }

    return 'neutral';
  };

  // 辅助函数：推断风格（基于小说类型）
  const determineStyle = (): string => {
    // 这里可以根据实际需求推断风格
    // 简单起见，默认返回fantasy
    return 'fantasy';
  };

  // 人物自动追踪功能 - 智能优化版
  const trackCharacterAppearancesPure = (charactersList: Character[], chaptersList: Chapter[]): Character[] => {
    const startTime = performance.now();

    // 如果没有章节或人物，直接返回
    if (charactersList.length === 0 || chaptersList.length === 0) {
      return charactersList;
    }

    // 智能优化：如果章节过多，降低检测频率（但不禁用）
    const isPerformanceMode = performanceMode;
    const isTooManyChapters = chaptersList.length > 100;
    const isTooManyCharacters = charactersList.length > 50;

    // 如果数据量过大，跳过本次追踪（等待下次触发）
    if (isTooManyChapters || isTooManyCharacters) {
      console.log('[人物追踪] 数据量过大，跳过本次追踪（章节数:', chaptersList.length, '人物数:', charactersList.length, '）');
      return charactersList;
    }

    // 提前创建章节映射，避免在循环中重复查找
    const chapterMap = new Map(chaptersList.map(c => [c.id, c]));
    const totalChapters = chaptersList.length;

    // 扫描所有章节，检测每个人物出现的章节
    const updatedCharacters = charactersList.map(character => {
      const appearances: string[] = [];

      // 检查每个章节中是否包含人物名字
      for (const chapter of chaptersList) {
        if (chapter.content && chapter.content.includes(character.name)) {
          appearances.push(chapter.id);
        }
      }

      // 更新首次出现和最后出现
      let firstAppearanceChapter = character.firstAppearanceChapter;
      let firstAppearanceChapterTitle = character.firstAppearanceChapterTitle;
      let lastAppearanceChapter = character.lastAppearanceChapter;
      let lastAppearanceChapterTitle = character.lastAppearanceChapterTitle;
      let status = character.status;

      if (appearances.length > 0) {
        // 按章节顺序排序（使用预先创建的映射）
        appearances.sort((a, b) => {
          const chapterA = chapterMap.get(a);
          const chapterB = chapterMap.get(b);
          return (chapterA?.order || 0) - (chapterB?.order || 0);
        });

        // 首次出现
        const firstChapter = chapterMap.get(appearances[0]);
        if (firstChapter) {
          firstAppearanceChapter = firstChapter.id;
          firstAppearanceChapterTitle = firstChapter.title;
        }

        // 最后出现
        const lastChapter = chapterMap.get(appearances[appearances.length - 1]);
        if (lastChapter) {
          lastAppearanceChapter = lastChapter.id;
          lastAppearanceChapterTitle = lastChapter.title;
        }

        // 检查是否应该标记为不活跃（在多个章节后没有再出现）
        if (appearances.length > 0) {
          const lastChapter = chapterMap.get(appearances[appearances.length - 1]);
          const remainingChapters = totalChapters - (lastChapter?.order || 0);

          // 如果在最后3章中没有出现，且不是主要角色，标记为不活跃
          if (remainingChapters >= 3 && character.role !== '主角' && character.role !== '主要角色') {
            status = 'inactive';
          }
        }
      }

      return {
        ...character,
        chapterAppearances: appearances,
        firstAppearanceChapter,
        firstAppearanceChapterTitle,
        lastAppearanceChapter,
        lastAppearanceChapterTitle,
        status,
      };
    });

    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 50) {
      console.warn(`[性能警告] 人物追踪耗时 ${duration.toFixed(2)}ms，人物数: ${charactersList.length}，章节数: ${chaptersList.length}`);
    }

    return updatedCharacters;
  };

  // 使用useMemo缓存人物追踪结果（优化版）
  const lastChaptersHashRef = useRef<string>('');

  const trackedCharacters = useMemo(() => {
    // 计算章节数据的哈希（只检查章节数量和ID）
    const chaptersHash = chapters.map(c => c.id + ':' + (c.content?.length || 0)).join('|');

    // 如果章节没有变化，跳过追踪
    if (chaptersHash === lastChaptersHashRef.current && lastChaptersHashRef.current.length > 0) {
      return characters; // 返回原始数据，避免重复计算
    }

    lastChaptersHashRef.current = chaptersHash;

    // 只在章节内容变化时才进行完整追踪
    return trackCharacterAppearancesPure(characters, chapters);
  }, [characters, chapters]);

  // 计算有内容的章节数（只统计有文字的章节）
  const validChapterCount = useMemo(() => {
    return chapters.filter(c => c.content && c.content.trim().length > 0).length;
  }, [chapters]);

  // 更新characters状态（添加防抖和智能检查）
  const updateCharactersRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // 快速检查是否真的需要更新
    const needsUpdate = trackedCharacters.some((updated, index) => {
      if (!characters[index]) return true;

      const original = characters[index];
      // 只检查关键字段，避免深拷贝
      return (
        updated.chapterAppearances.length !== original.chapterAppearances.length ||
        updated.firstAppearanceChapter !== original.firstAppearanceChapter ||
        updated.lastAppearanceChapter !== original.lastAppearanceChapter ||
        updated.status !== original.status
      );
    });

    if (!needsUpdate) return;

    // 添加防抖，避免频繁更新
    if (updateCharactersRef.current) {
      clearTimeout(updateCharactersRef.current);
    }

    updateCharactersRef.current = setTimeout(() => {
      setCharacters(trackedCharacters);
    }, 800); // 800ms 防抖，避免频繁更新

    return () => {
      if (updateCharactersRef.current) {
        clearTimeout(updateCharactersRef.current);
      }
    };
  }, [trackedCharacters, characters]);

  // 保留旧函数以兼容
  const trackCharacterAppearances = () => {
    // 不再直接使用，改为通过useMemo和useEffect处理
  };

  // 检测人物出现/消失问题
  const detectCharacterIssues = (): Issue[] => {
    return detectCharacterIssuesPure(characters, chapters);
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(c => c.id !== id));
  };

  const addChapter = () => {
    // 立即设置loading状态
    setButtonLoadingState('add-chapter', true);

    // 使用 requestAnimationFrame 确保loading状态先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newId = (chapters.length + 1).toString();
        const currentVolume = volumes.find(v => v.id === currentChapter?.volumeId) || volumes[0];
        const volumeChapters = chapters.filter(c => c.volumeId === currentVolume.id);
        const newOrder = volumeChapters.length + 1;

        const newChapter: Chapter = {
          id: newId,
          title: `第${newOrder}章`,
          content: '',
          wordCount: 0,
          status: 'draft',
          volumeId: currentVolume.id,
          order: newOrder,
        };
        setChapters([...chapters, newChapter]);
        setCurrentChapter(newChapter);

        // 移除loading状态
        setButtonLoadingState('add-chapter', false);
      });
    });
  };

  const selectChapter = (id: string) => {
    const selected = chapters.find(c => c.id === id);
    if (selected) {
      setCurrentChapter(selected);
    }
  };

  // 分卷管理函数
  const addVolume = () => {
    if (!newVolumeTitle) return;

    // 立即设置loading状态
    setButtonLoadingState('add-volume', true);

    // 使用 requestAnimationFrame 确保loading状态先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const newVolume: Volume = {
          id: `vol-${Date.now()}`,
          title: newVolumeTitle,
          description: newVolumeDescription,
          order: volumes.length + 1,
        };
        setVolumes([...volumes, newVolume]);
        setNewVolumeTitle('');
        setNewVolumeDescription('');

        // 移除loading状态
        setButtonLoadingState('add-volume', false);
      });
    });
  };

  const removeVolume = (volumeId: string) => {
    if (volumes.length <= 1) {
      alert('至少保留一个分卷');
      return;
    }
    setVolumes(volumes.filter(v => v.id !== volumeId));
    // 将该卷的章节移动到第一个卷
    const firstVolume = volumes[0];
    const updatedChapters = chapters.map(c => 
      c.volumeId === volumeId ? { ...c, volumeId: firstVolume.id } : c
    );
    setChapters(updatedChapters);
  };

  const selectVolume = (volumeId: string) => {
    const volumeChapters = chapters.filter(c => c.volumeId === volumeId);
    if (volumeChapters.length > 0) {
      setCurrentChapter(volumeChapters[0]);
    }
  };

  const handleAddChapter = () => {
    const newId = (chapters.length + 1).toString();
    const newOrder = chapters.length + 1;
    const newChapter: Chapter = {
      id: newId,
      title: `第${newOrder}章`,
      content: '',
      wordCount: 0,
      status: 'draft',
      volumeId: volumes[0]?.id || 'vol-1',
      order: newOrder
    };
    setChapters([...chapters, newChapter]);
    setCurrentChapter(newChapter);
  };

  const saveChapter = () => {
    if (!currentChapter) return;
    setChapters(chapters.map(c => c.id === currentChapter?.id ? currentChapter : c));
    alert('章节已保存！');
  };

  // 自动写作功能
  const handleAutoWrite = async () => {
    setAiLoading(true);
    setAiResult('');

    try {
      if (!currentChapter) {
        alert('请先选择或创建章节！');
        setAiLoading(false);
        return;
      }
      const response = await fetch('/api/ai/auto-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: currentChapter?.title,
          chapterOutline: aiPrompt,
          previousContent: chapters.find(c => c.id === (parseInt(currentChapter?.id) - 1).toString())?.content || '',
          characters: characters.filter(c => aiPrompt?.includes(c.name)),
          worldSetting: worldSettings.map(w => w.name + '：' + w.description).join('\n'),
          articleRequirements: articleRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error('自动写作失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setAiResult(prev => prev + chunk);
        }
      }
    } catch (error) {
      console.error('自动写作错误:', error);
      setAiResult('自动写作失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };
  const handleAiAction = async () => {
    setAiLoading(true);
    setAiResult('');

    try {
      let endpoint = '/api/ai/continue';
      let body: any = { content: currentChapter?.content };

      if (selectedAiTool === 'continue') {
        endpoint = '/api/ai/continue';
        body.context = aiPrompt;
        body.articleRequirements = articleRequirements;
      } else if (selectedAiTool === 'expand') {
        endpoint = '/api/ai/expand';
        body.instructions = aiPrompt;
        body.articleRequirements = articleRequirements;
      } else if (selectedAiTool === 'polish') {
        endpoint = '/api/ai/polish';
        body.style = aiPrompt || '简洁明快';
        body.articleRequirements = articleRequirements;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('AI请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          setAiResult(prev => prev + chunk);
        }
      }
    } catch (error) {
      console.error('AI错误:', error);
      setAiResult('AI请求失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    const newContent = currentChapter?.content + '\n' + aiResult;
    updateChapterContent(newContent);
    setAiResult('');
  };

  // 基于世界观重新生成大纲
  const handleRegenerateOutlineFromWorld = async () => {
    setAiLoading(true);
    setAiResult('');

    try {
      const response = await fetch('/api/ai/regenerate-outline-from-world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOutline: outline,
          worldSettings: worldSettings,
          characters: characters,
          title: title,
        }),
      });

      if (!response.ok) {
        throw new Error('基于世界观重新生成大纲失败');
      }

      const data = await response.json();

      if (data.content) {
        setOutline(data.content);
        setAiResult('大纲已根据世界观和角色信息重新生成！');
      }
    } catch (error) {
      console.error('基于世界观重新生成大纲错误:', error);
      setAiResult('生成失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 大纲反馈与调整
  const handleAdjustOutline = async () => {
    if (!outline.trim()) {
      alert('当前大纲为空，请先生成或输入大纲');
      return;
    }

    if (!outlineFeedbackSettings.dissatisfactionReason.trim() && !outlineFeedbackSettings.idealOutline.trim()) {
      alert('请填写对大纲的反馈（不满意原因或理想大纲描述）');
      return;
    }

    const confirmed = confirm(
      '确定要根据反馈调整大纲吗？\n\n调整后当前大纲将被替换。'
    );

    if (!confirmed) return;

    setAiLoading(true);
    setAiResult('');

    try {
      const response = await fetch('/api/ai/adjust-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentOutline: outline,
          dissatisfactionReason: outlineFeedbackSettings.dissatisfactionReason,
          idealOutline: outlineFeedbackSettings.idealOutline,
          characters,
          worldSettings,
          title,
        }),
      });

      if (!response.ok) {
        throw new Error('大纲调整失败');
      }

      const data = await response.json();

      if (data.content) {
        setOutline(data.content);
        setAiResult('大纲已根据您的反馈调整完成！');

        // 清空反馈
        setOutlineFeedbackSettings({
          dissatisfactionReason: '',
          idealOutline: '',
        });

        // 切换到世界观标签页查看结果
        setActiveTab('world');
      }
    } catch (error) {
      console.error('大纲调整错误:', error);
      setAiResult('大纲调整失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 直接编辑功能
  const handleDirectEdit = async () => {
    if (!currentChapter?.content.trim()) {
      alert('当前章节内容为空，请先输入内容！');
      return;
    }

    setAiLoading(true);
    setAiResult('');

    try {
      const response = await fetch('/api/ai/direct-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentChapter?.content,
          feedbackSettings: feedbackSettings,
          articleRequirements: articleRequirements,
        }),
      });

      if (!response.ok) {
        throw new Error('直接编辑失败');
      }

      const data = await response.json();

      if (data.content) {
        // 直接替换当前章节的内容
        updateChapterContent(data.content);
        setAiResult('内容已根据要求直接修改完成！');
      }
    } catch (error) {
      console.error('直接编辑错误:', error);
      setAiResult('直接编辑失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 工具箱功能
  const handleToolGenerate = async (tool: string) => {
    setAiLoading(true);
    setAiResult('');

    try {
      let endpoint = '';
      let body: any = {};

      if (tool === 'outline') {
        endpoint = '/api/ai/outline';
        body = {
          genre: aiPrompt.split(',')[0]?.trim() || '玄幻',
          theme: aiPrompt.split(',')[1]?.trim() || '成长',
          protagonist: aiPrompt.split(',')[2]?.trim() || '',
          targetChapterCount: chapterSettings.targetChapterCount,
          dissatisfactionReason: feedbackSettings.dissatisfactionReason,
          idealContent: feedbackSettings.idealContent,
        };
      } else if (tool === 'character') {
        endpoint = '/api/ai/character';
        body = {
          role: aiPrompt.split(',')[0]?.trim() || '主角',
          personality: aiPrompt.split(',')[1]?.trim(),
          background: aiPrompt.split(',')[2]?.trim(),
        };
      } else if (tool === 'dialogue') {
        endpoint = '/api/ai/dialogue';
        body = {
          content: aiPrompt,
          characterInfo: '',
          context: '',
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('工具请求失败');
      }

      const data = await response.json();

      // 根据工具类型自动填充到对应位置
      if (tool === 'outline') {
        setOutline(data.content);
        setAiResult('大纲已自动填充到"世界观"标签页，可随时修改');
        setActiveTab('world');
      } else if (tool === 'character') {
        // 尝试解析角色JSON
        try {
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const charData = JSON.parse(jsonMatch[0]);
            setNewCharacter({
              name: charData.name || '',
              age: charData.age || '',
              role: charData.role || '',
              personality: charData.personality || '',
              background: charData.background || '',
              appearance: charData.appearance || '',
              abilities: charData.abilities || '',
              goals: charData.goals || '',
              weaknesses: charData.weaknesses || '',
              relationships: charData.relationships || '',
            });
            setAiResult('角色信息已自动填充到"人物"标签页的表单，可修改后点击"添加人物"保存');
            setActiveTab('characters');
          } else {
            setAiResult(data.content);
          }
        } catch {
          setAiResult(data.content);
        }
      } else {
        setAiResult(data.content);
      }
    } catch (error) {
      console.error('工具错误:', error);
      setAiResult('工具请求失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 批量生成章节处理函数
  const handleBatchGenerateChapters = async () => {
    if (!outline) {
      alert('请先生成大纲！');
      return;
    }

    setBatchChapterGenerating(true);

    setBatchGenerateProgress({
      stepName: '准备中...',
      percentage: 0,
      message: '正在初始化批量生成任务...',
    });
    setBatchRewriteProgress(null);
    setBatchGenerateResult(null);

    try {
      console.log('[BatchGenerate] 开始发送请求');

      // 添加超时控制 - 30分钟超时（批量生成可能需要很长时间）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[BatchGenerate] 请求超时');
        controller.abort();
      }, 30 * 60 * 1000); // 30分钟

      const response = await fetch('/api/ai/batch-generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterCount: batchGenerateChapterCount,
          targetWordCount: chapterSettings.targetWordCountPerChapter,
          outline,
          characters,
          worldSettings,
          existingChapters: chapters,
          existingVolumes: volumes,
          title,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('[BatchGenerate] 收到响应', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BatchGenerate] 响应错误:', errorText);
        throw new Error(`批量生成请求失败: ${response.status} - ${errorText}`);
      }

      // 使用流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      console.log('[BatchGenerate] 开始读取流式数据');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[BatchGenerate] 流式数据读取完成');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 处理完整的数据行
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          // 跳过空行
          if (!line.trim()) {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              // 检查是否为有效JSON字符串
              if (!jsonStr || jsonStr === '[DONE]') {
                continue;
              }
              const data = JSON.parse(jsonStr);

              // 对所有数据都记录详细信息
              if (data.step === 'quality-failed') {
                const dataStr = JSON.stringify(data, null, 2);
                console.log('[BatchGenerate] 收到quality-failed数据:', dataStr);
                console.log('[BatchGenerate] 数据章节数量:', data.chapters?.length || 0);
              } else {
                console.log('[BatchGenerate] 收到数据:', data.step, data.message);
              }

              if (data.step === 'generating-chapters') {
                setBatchGenerateProgress({
                  stepName: '生成章节中...',
                  percentage: data.progress?.percentage || 0,
                  message: data.message || '',
                });
              } else if (data.step === 'generation-completed') {
                setBatchGenerateProgress({
                  stepName: '章节生成完成',
                  percentage: data.progress?.percentage || 50,
                  message: data.message || '',
                });
              } else if (data.step === 'rewriting-chapters') {
                // 更新重写进度
                setBatchRewriteProgress({
                  currentAttempt: data.progress?.current || 1,
                  maxAttempts: data.progress?.total || 5,
                  currentScore: 0, // 等待后端返回
                  currentPenalty: 0, // 等待后端返回
                  isRewriting: true,
                });

                setBatchGenerateProgress({
                  stepName: `质量校核中（第${data.progress?.current || 1}/${data.progress?.total || 5}次）`,
                  percentage: data.progress?.percentage || 60,
                  message: data.message || '正在重写章节以提升质量...',
                });
              } else if (data.step === 'rewrite-check-complete') {
                // 更新重写后的分数
                if (data.qualityCheck) {
                  setBatchRewriteProgress(prev => prev ? {
                    ...prev,
                    currentScore: data.qualityCheck.averageScore || 0,
                    currentPenalty: Math.abs(data.qualityCheck.averagePenalty || 0),
                  } : prev);
                }
              } else if (data.step === 'all-completed') {
                console.log('[BatchGenerate] ========== 收到完成信号 ==========');
                console.log('[BatchGenerate] 数据对象:', data);
                console.log('[BatchGenerate] 章节数量:', data.chapters?.length);
                console.log('[BatchGenerate] Summary:', data.summary);

                setBatchGenerateProgress({
                  stepName: '全部完成',
                  percentage: 100,
                  message: data.message || '',
                });
                setBatchRewriteProgress(null); // 清除重写进度

                // 更新章节状态
                if (data.chapters && Array.isArray(data.chapters)) {
                  console.log('[BatchGenerate] 开始更新章节列表...');
                  console.log('[BatchGenerate] 收到章节列表，数量:', data.chapters.length);
                  console.log('[BatchGenerate] 更新前当前章节数量:', chapters.length);

                  // 详细记录每个章节的信息
                  data.chapters.forEach((ch: any, idx: number) => {
                    console.log(`[BatchGenerate] 章节${idx + 1}: id=${ch.id}, title=${ch.title}, contentLength=${ch.content?.length || 0}, wordCount=${ch.wordCount}`);
                  });

                  // 先更新章节列表
                  setChapters(data.chapters);
                  console.log('[BatchGenerate] setChapters 已调用');

                  // 章节列表更新后，自动增加显示限制，确保新生成的章节可见
                  const newChaptersCount = data.chapters.length;
                  if (newChaptersCount > chaptersLimit) {
                    setChaptersLimit(newChaptersCount);
                    console.log('[BatchGenerate] 自动增加章节显示限制至:', newChaptersCount);
                  }

                  // 设置当前章节
                  const lastGeneratedChapter = data.chapters[data.chapters.length - 1];
                  if (lastGeneratedChapter) {
                    console.log('[BatchGenerate] 设置最后生成的章节为当前章节:', lastGeneratedChapter.title, 'content长度:', lastGeneratedChapter.content?.length || 0);

                    // 直接设置当前章节，不需要验证（lastGeneratedChapter 已经有数据了）
                    setCurrentChapter(lastGeneratedChapter);
                    console.log('[BatchGenerate] 当前章节已设置');
                  } else if (data.chapters.length > 0) {
                    // 备选方案：使用第一个章节
                    console.log('[BatchGenerate] 设置第一个章节为当前章节:', data.chapters[0]?.title);

                    const firstChapter = data.chapters[0];
                    setCurrentChapter(firstChapter);
                    console.log('[BatchGenerate] 当前章节已设置');
                  }

                    // 验证状态是否更新成功
                  console.log('[BatchGenerate] 章节列表更新完成');
                } else {
                  console.error('[BatchGenerate] 没有收到有效的章节数据！');
                }

                // 保存结果
                const successCount = data.summary?.success || data.chapters?.length || 0;
                const failCount = data.summary?.failed || 0;
                const issueCheck = data.summary?.issueCheck;
                const penaltyCheck = data.summary?.penaltyCheck;
                const autoFix = data.summary?.autoFix;
                const qualityCheck = data.summary?.qualityCheck;

                setBatchGenerateResult({
                  chapterCount: successCount,
                  issueCount: issueCheck?.totalIssues || 0,
                  fixedCount: autoFix?.success || 0,
                  penaltyCheck: penaltyCheck || null,
                  qualityCheck: qualityCheck || null,
                  autoFix: autoFix || null,
                  message: data.message || '批量生成完成',
                });

                // 将完整的消息显示给用户（后端已经生成了包含惩罚检测的完整消息）
                if (data.message) {
                  alert(data.message);
                }
              } else if (data.step === 'quality-failed') {
                // 质量检测失败，不呈现内容，但显示提示和一键修改按钮
                const dataStr = JSON.stringify(data, null, 2);
                console.error('[BatchGenerate] 质量检测失败:', dataStr);
                console.error('[BatchGenerate] 质量检查详情:', JSON.stringify(data.qualityCheck, null, 2));
                console.error('[BatchGenerate] 未达标章节数量:', data.chapters?.length || 0);

                setBatchGenerateProgress({
                  stepName: '质量检测失败',
                  percentage: 100,
                  message: '质量未达标，请手动修改',
                });
                setBatchRewriteProgress(null); // 清除重写进度
                setBatchGenerateResult({
                  chapterCount: 0,
                  issueCount: 0,
                  fixedCount: 0,
                  qualityFailed: true,
                  qualityCheck: data.qualityCheck || null,
                  message: data.message || '质量检测未达标，内容未呈现',
                  chapters: data.chapters || [] // 保存未达标的内容
                });
              } else if (data.step === 'error') {
                throw new Error(data.message || '批量生成失败');
              }
            } catch (e) {
              console.error('[BatchGenerate] 解析流式数据失败:', e, '数据前200字符:', line.substring(0, 200));
              // 如果解析失败，尝试重新组合缓冲区
              buffer = line + '\n' + buffer;
            }
          }
        }
      }
    } catch (error) {
      console.error('[BatchGenerate] 批量生成错误:', error);

      // 详细的错误信息
      let errorMessage = '未知错误';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';

        // 检查是否是超时错误
        if (error.name === 'AbortError' || errorMessage.includes('timeout') || errorMessage.includes('超时')) {
          errorMessage = '批量生成超时（30分钟）\n\n可能原因：\n1. 网络连接不稳定\n2. 服务器负载过高\n3. LLM服务响应慢\n\n建议：\n- 减少每次生成的章节数（如20章）\n- 检查网络连接\n- 稍后再试';
        }
        // 检查是否是网络错误
        else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
          errorMessage = '网络连接错误\n\n可能原因：\n1. 网络断开\n2. 代理或防火墙阻止\n3. 服务器无响应\n\n建议：\n- 检查网络连接\n- 刷新页面重试\n- 使用网络诊断工具检查';
        }
        // 检查是否是500错误
        else if (errorMessage.includes('500')) {
          errorMessage = '服务器内部错误\n\n建议：\n- 稍后再试\n- 减少每次生成的章节数\n- 如问题持续，请联系技术支持';
        }
      }

      console.error('[BatchGenerate] 错误详情:', errorDetails);

      alert('批量生成失败：\n\n' + errorMessage);

      setBatchGenerateResult({
        chapterCount: 0,
        issueCount: 0,
        fixedCount: 0,
        error: errorMessage,
      });
    } finally {
      setBatchChapterGenerating(false);
      setBatchRewriteProgress(null); // 清除重写进度
    }
  };

  // 一键修改功能（质量不达标时调用）
  const handleOneClickFix = async () => {
    if (!batchGenerateResult || !batchGenerateResult.chapters || batchGenerateResult.chapters.length === 0) {
      alert('没有需要修改的章节！');
      return;
    }

    if (!confirm(`检测到 ${batchGenerateResult.chapters.length} 章内容质量不达标，是否进行一键修改？\n\n修改策略：\n• 基于当前内容进行优化改进\n• 重点修复评分较低的问题\n• 保持原有情节和人物设定\n• 提升整体质量至标准以上\n\n预计耗时：${Math.ceil(batchGenerateResult.chapters.length * 30 / 60)} 分钟`)) {
      return;
    }

    setBatchChapterGenerating(true);
    setBatchGenerateProgress({
      stepName: '正在修复...',
      percentage: 0,
      message: '准备修复不达标的章节...',
    });

    try {
      console.log('[一键修改] 开始修复章节，数量:', batchGenerateResult.chapters.length);

      // 调用批量生成API，但传入修复模式标志
      const response = await fetch('/api/ai/batch-generate-chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterCount: batchGenerateResult.chapters.length,
          targetWordCount: chapterSettings.targetWordCountPerChapter,
          outline,
          characters,
          worldSettings,
          existingChapters: chapters,
          existingVolumes: volumes,
          title,
          fixMode: true, // 修复模式标志
          chaptersToFix: batchGenerateResult.chapters, // 需要修复的章节
          qualityCheck: batchGenerateResult.qualityCheck // 传入质量检查结果
        }),
      });

      if (!response.ok) {
        throw new Error('修复请求失败');
      }

      // 读取流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                // 对所有数据都记录详细信息
                if (data.step === 'quality-failed') {
                  const dataStr = JSON.stringify(data, null, 2);
                  console.log('[一键修改] 收到quality-failed数据:', dataStr);
                  console.log('[一键修改] 数据章节数量:', data.chapters?.length || 0);
                } else {
                  console.log('[一键修改] 收到数据:', data.step, data.message);
                }

                // 更新进度
                if (data.step === 'generating' || data.step === 'fixing') {
                  setBatchGenerateProgress({
                    stepName: data.stepName || '正在修复...',
                    percentage: data.progress?.percentage || 0,
                    message: data.message || '正在修复章节...',
                  });
                }

                // 处理修复完成的数据
                if (data.step === 'all-completed' || data.step === 'completed') {
                  console.log('[一键修改] 修复完成，章节数量:', data.chapters?.length || 0);

                  // 更新章节列表
                  if (data.chapters && data.chapters.length > 0) {
                    setChapters(prev => {
                      const updated = [...prev];
                      data.chapters.forEach((newChapter: any) => {
                        const existingIndex = updated.findIndex(c => c.id === newChapter.id);
                        if (existingIndex >= 0) {
                          updated[existingIndex] = { ...newChapter, status: 'completed' };
                        } else {
                          updated.push({ ...newChapter, status: 'completed' });
                        }
                      });
                      return updated;
                    });

                    // 设置当前章节为最后修复的章节
                    if (data.chapters[data.chapters.length - 1]) {
                      setCurrentChapter(data.chapters[data.chapters.length - 1]);
                    }
                  }

                  // 更新结果
                  const successCount = data.summary?.success || data.chapters?.length || 0;
                  const issueCheck = data.summary?.issueCheck;
                  const penaltyCheck = data.summary?.penaltyCheck;

                  setBatchGenerateResult({
                    chapterCount: successCount,
                    issueCount: issueCheck?.totalIssues || 0,
                    fixedCount: data.summary?.autoFix?.success || 0,
                    penaltyCheck: penaltyCheck || null,
                    qualityCheck: data.summary?.qualityCheck || null,
                    autoFix: data.summary?.autoFix || null
                  });

                  if (data.message) {
                    alert(data.message);
                  }
                } else if (data.step === 'quality-failed') {
                  // 修复后仍然不达标
                  const dataStr = JSON.stringify(data, null, 2);
                  console.error('[一键修改] 修复后质量仍不达标:', dataStr);
                  console.error('[一键修改] 修复后质量检查详情:', data.qualityCheck);
                  console.error('[一键修改] 修复后未达标章节数量:', data.chapters?.length || 0);
                  setBatchGenerateResult({
                    chapterCount: 0,
                    issueCount: 0,
                    fixedCount: 0,
                    qualityFailed: true,
                    qualityCheck: data.qualityCheck || null,
                    message: data.message || '修复后质量仍未达标',
                    chapters: data.chapters || []
                  });
                  alert('修复后质量仍未达标！\n\n' + data.message);
                } else if (data.step === 'error') {
                  throw new Error(data.message || '修复失败');
                }
              } catch (e) {
                console.error('[一键修改] 解析数据失败:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[一键修改] 错误:', error);
      const errorMessage = error instanceof Error ? error.message : '修复失败';
      alert('一键修改失败：\n\n' + errorMessage);
    } finally {
      setBatchChapterGenerating(false);
      setBatchRewriteProgress(null); // 清除重写进度
    }
  };

  const addWorldSetting = () => {
    if (!aiPrompt) return;

    // 立即设置loading状态，提供即时反馈
    setButtonLoadingState('add-world-setting', true);

    // 使用 requestAnimationFrame 确保loading状态先渲染
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const [name, type, description] = aiPrompt.split(',');
        if (name) {
          setWorldSettings([
            ...worldSettings,
            {
              id: Date.now().toString(),
              name: name.trim(),
              type: type?.trim() || '场景',
              description: description?.trim() || '',
            },
          ]);
          setAiPrompt('');
        }

        // 移除loading状态
        setButtonLoadingState('add-world-setting', false);
      });
    });
  };

  // 批量生成功能
  const handleBatchGenerate = async () => {
    setBatchGenerating(true);
    setGeneratedCharacters([]);
    setCurrentCharacterIndex(0);
    setAiResult('');

    try {
      // 1. 生成大纲
      setAiResult('正在生成大纲...');
      const outlineResponse = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: aiPrompt.split(',')[0]?.trim() || '玄幻',
          theme: aiPrompt.split(',')[1]?.trim() || '成长',
          protagonist: aiPrompt.split(',')[2]?.trim() || '',
        }),
      });

      const outlineData = await outlineResponse.json();
      setOutline(outlineData.content);

      // 2. 从大纲中提取角色并生成
      const extractCharsResponse = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: '角色生成',
          theme: aiPrompt,
          protagonist: aiPrompt,
        }),
      });

      const charsData = await extractCharsResponse.json();

      // 解析生成的角色列表
      const jsonMatch = charsData.content.match(/\[[\s\S]*\]/);
      let charactersList: any[] = [];
      if (jsonMatch) {
        try {
          charactersList = JSON.parse(jsonMatch[0]);
        } catch {
          // 如果解析失败，创建单个角色
          charactersList = [charsData.content];
        }
      } else {
        charactersList = [{ name: '主角', role: '主角', personality: '', background: '' }];
      }

      setGeneratedCharacters(charactersList);

      if (charactersList.length > 0) {
        // 填充第一个角色
        const firstChar = charactersList[0];
        if (typeof firstChar === 'object') {
          setNewCharacter({
            name: firstChar.name || '',
            age: firstChar.age || '',
            role: firstChar.role || '',
            personality: firstChar.personality || '',
            background: firstChar.background || '',
            appearance: firstChar.appearance || '',
            abilities: firstChar.abilities || '',
            goals: firstChar.goals || '',
            weaknesses: firstChar.weaknesses || '',
            relationships: firstChar.relationships || '',
          });
        }
      }

      setAiResult(`生成完成！大纲已填充到"世界观"标签页。共生成 ${charactersList.length} 个角色，当前显示第 1 个角色。`);
      setActiveTab('characters');
    } catch (error) {
      console.error('批量生成错误:', error);
      setAiResult('批量生成失败，请重试');
    } finally {
      setBatchGenerating(false);
    }
  };

  // 切换到下一个生成的角色
  const nextGeneratedCharacter = () => {
    if (currentCharacterIndex < generatedCharacters.length - 1) {
      const nextIndex = currentCharacterIndex + 1;
      setCurrentCharacterIndex(nextIndex);
      const char = generatedCharacters[nextIndex];
      if (typeof char === 'object') {
        setNewCharacter({
          name: char.name || '',
          age: char.age || '',
          role: char.role || '',
          personality: char.personality || '',
          background: char.background || '',
          appearance: char.appearance || '',
          abilities: char.abilities || '',
          goals: char.goals || '',
          weaknesses: char.weaknesses || '',
          relationships: char.relationships || '',
        });
      }
    }
  };

  // 切换到上一个生成的角色
  const prevGeneratedCharacter = () => {
    if (currentCharacterIndex > 0) {
      const prevIndex = currentCharacterIndex - 1;
      setCurrentCharacterIndex(prevIndex);
      const char = generatedCharacters[prevIndex];
      if (typeof char === 'object') {
        setNewCharacter({
          name: char.name || '',
          age: char.age || '',
          role: char.role || '',
          personality: char.personality || '',
          background: char.background || '',
          appearance: char.appearance || '',
          abilities: char.abilities || '',
          goals: char.goals || '',
          weaknesses: char.weaknesses || '',
          relationships: char.relationships || '',
        });
      }
    }
  };

  // 智能改写分析结果
  // 通用改写函数
  const handleRewritePart = async (part: string, partName: string) => {
    console.log(`[改写] 开始改写: ${part} (${partName})`);
    console.log(`[改写] analysisResult存在:`, !!analysisResult);
    console.log(`[改写] importData:`, importData);

    if (!analysisResult) {
      alert('没有分析结果可以改写！');
      console.error(`[改写] 失败：没有分析结果`);
      return;
    }

    // 检查要改写的内容是否存在
    let contentToRewrite = '';
    if (part === 'worldview') {
      contentToRewrite = importData.worldview || analysisResult.worldview || '';
    } else if (part === 'characters') {
      contentToRewrite = JSON.stringify(importData.characters.length > 0 ? importData.characters : analysisResult.characters || []);
    } else if (part === 'plot') {
      contentToRewrite = importData.plotStructure || analysisResult.plotStructure || '';
    } else if (part === 'style') {
      contentToRewrite = importData.writingStyle || analysisResult.writingStyle || '';
    } else if (part === 'theme') {
      contentToRewrite = importData.coreTheme || analysisResult.coreTheme || '';
    }

    if (!contentToRewrite || contentToRewrite.trim().length < 5) {
      alert(`${partName}内容为空或过短，无法改写！\n\n请确保：\n1. 已完成拆书分析\n2. 分析结果中有${partName}内容\n3. 内容长度至少5个字符`);
      console.error(`[改写] 失败：${part}内容无效: "${contentToRewrite}"`);
      return;
    }

    setRewriting(prev => ({ ...prev, [part]: true }));
    setRewriteProgress(prev => ({ ...prev, [part]: `正在智能改写${partName}...` }));

    console.log(`[改写] 状态已设置为改写中...`);

    try {
      // 构建要改写的数据源：优先使用用户已修改的内容（importData），否则使用原始分析结果（analysisResult）
      const dataToRewrite = {
        worldview: importData.worldview || analysisResult.worldview || '',
        characters: importData.characters && importData.characters.length > 0 ? importData.characters : analysisResult.characters || [],
        plotStructure: importData.plotStructure || analysisResult.plotStructure || '',
        writingStyle: importData.writingStyle || analysisResult.writingStyle || '',
        coreTheme: importData.coreTheme || analysisResult.coreTheme || '',
      };

      console.log(`[改写] 将要改写的内容长度:`, contentToRewrite.length);

      const response = await fetch('/api/ai/rewrite-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: dataToRewrite,
          part,
          feedbackSettings: rewriteFeedbackSettings,
        }),
      });

      console.log(`[改写] 响应状态: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[改写] API错误:`, errorText);
        throw new Error(`${partName}改写请求失败 (${response.status}): ${errorText}`);
      }

      // 流式处理响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const json = JSON.parse(data);
                if (json.content) {
                  fullContent += json.content;
                  setRewriteProgress(prev => ({ ...prev, [part]: `正在改写${partName}...已接收 ${fullContent.length} 字符` }));
                }
                if (json.done && json.result) {
                  // 改写完成，根据part更新对应的importData字段
                  if (part === 'worldview') {
                    setImportData(prev => ({ ...prev, worldview: json.result.worldview || '' }));
                    setRewriteCompleted(prev => ({ ...prev, worldview: true }));
                  } else if (part === 'characters') {
                    setImportData(prev => ({ ...prev, characters: json.result.characters || [] }));
                    setRewriteCompleted(prev => ({ ...prev, characters: true }));
                  } else if (part === 'plot') {
                    setImportData(prev => ({ ...prev, plotStructure: json.result.plotStructure || '' }));
                    setRewriteCompleted(prev => ({ ...prev, plot: true }));
                  } else if (part === 'style') {
                    setImportData(prev => ({ ...prev, writingStyle: json.result.writingStyle || '' }));
                    setRewriteCompleted(prev => ({ ...prev, style: true }));
                  } else if (part === 'theme') {
                    setImportData(prev => ({ ...prev, coreTheme: json.result.coreTheme || '' }));
                    setRewriteCompleted(prev => ({ ...prev, theme: true }));
                  }
                  setRewriteProgress(prev => ({ ...prev, [part]: `✅ ${partName}改写完成！` }));
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`${partName}改写错误:`, error);
      const errorMsg = error instanceof Error ? error.message : '改写失败';
      setRewriteProgress(prev => ({ ...prev, [part]: `❌ ${errorMsg}` }));
      alert(`${partName}改写失败：${errorMsg}\n\n请检查：\n1. 是否已完成拆书分析\n2. 网络连接是否正常\n3. 是否有有效的剧情内容`);
    } finally {
      console.log(`[改写] 重置改写状态: ${part}`);
      setRewriting(prev => ({ ...prev, [part]: false }));
    }
  };

  // 便捷改写函数
  const handleRewriteWorldview = () => handleRewritePart('worldview', '世界观');
  const handleRewriteCharacters = () => handleRewritePart('characters', '人物');
  const handleRewritePlot = () => handleRewritePart('plot', '剧情');
  const handleRewriteStyle = () => handleRewritePart('style', '风格');
  const handleRewriteTheme = () => handleRewritePart('theme', '主题');

  // 一键生成功能
  const handleGenerateAll = async () => {
    setGenerating(true);
    setShowGenerateAll(false);

    try {
      const response = await fetch('/api/ai/generate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateParams),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                // 更新进度
                setGenerateProgress({
                  step: data.step,
                  stepName: data.stepName,
                  status: data.status,
                  message: data.message,
                  progress: data.progress,
                });

                // 处理各步骤的数据
                if (data.step === 1 && data.data?.outline) {
                  setOutline(data.data.outline);
                }

                if (data.step === 2 && data.data) {
                  setVolumes(data.data.volumes || volumes);
                  // 章节会在步骤5中逐个添加
                }

                if (data.step === 3 && data.data?.characters) {
                  setCharacters(data.data.characters);
                }

                if (data.step === 4 && data.data?.worldSettings) {
                  setWorldSettings(data.data.worldSettings);
                }

                if (data.step === 5 && data.chapterData) {
                  setChapters(prev => {
                    const existing = prev.find(c => c.id === data.chapterData.id);
                    if (existing) {
                      return prev.map(c =>
                        c.id === data.chapterData.id
                          ? { ...c, ...data.chapterData, status: 'completed' as const }
                          : c
                      );
                    }
                    return [...prev, { ...data.chapterData, status: 'completed' as const }];
                  });

                  // 设置当前章节
                  if (data.chapterData.id === '1' || !currentChapter?.content) {
                    setCurrentChapter({
                      ...data.chapterData,
                      status: 'completed' as const,
                    });
                  }
                }
              } catch (e) {
                console.error('解析数据失败:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('一键生成错误:', error);
      alert('一键生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // 基于大纲重新生成功能
  const handleRegenerateFromOutline = async () => {
    if (!outline.trim()) {
      alert('请先输入或修改大纲');
      return;
    }

    try {
      setAiLoading(true);
      setAiResult('正在分析大纲并创建生成任务...');

      // 调用重新生成API
      const response = await fetch('/api/ai/regenerate-from-outline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outline,
          characters,
          worldSettings,
          existingVolumes: volumes,
          existingChapters: chapters,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '重新生成失败');
      }

      setAiResult(`已创建重新生成任务（ID: ${data.taskId}），正在后台执行...\n请切换到"任务"标签页查看进度。`);

      // 切换到任务标签页
      setActiveTab('tasks');

      // 刷新任务列表
      setTimeout(() => {
        fetchTasks();
      }, 1000);

    } catch (error) {
      console.error('重新生成失败:', error);
      alert('重新生成失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAiLoading(false);
    }
  };

  // 剧情检查功能
  const handleCheckPlot = async () => {
    // 检查是否有实际内容的章节
    const chaptersWithContent = chapters.filter(c => c.content && c.content.trim().length > 0);

    if (chapters.length === 0) {
      alert('请先创建章节');
      return;
    }

    if (chaptersWithContent.length === 0) {
      alert('章节内容为空，请先编写一些内容再进行检查');
      return;
    }

    if (chaptersWithContent.length < chapters.length) {
      const proceed = confirm(`共有 ${chapters.length} 个章节，其中 ${chaptersWithContent.length} 个有内容。是否继续检查？`);
      if (!proceed) return;
    }

    setCheckingPlot(true);
    setPlotCheckResult(null);
    setShowPlotCheck(true);

    try {
      const response = await fetch('/api/ai/check-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          outline,
          chapters,
          characters,
          worldSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('剧情检查失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.status === 'processing') {
                  console.log('正在分析:', data.message);
                }

                if (data.status === 'completed' && data.data) {
                  setPlotCheckResult(data.data);
                }

                if (data.status === 'error') {
                  throw new Error(data.message);
                }
              } catch (e) {
                console.error('解析数据失败:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('剧情检查错误:', error);
      alert('剧情检查失败，请重试');
    } finally {
      setCheckingPlot(false);
    }
  };

  // 一键修复问题
  const handleFixIssue = async (issue: any, chapterId?: string) => {
    // 确定要修复的章节
    const targetChapterId = chapterId || currentChapter?.id || '';
    const targetChapter = chapters.find(c => c.id === targetChapterId);

    if (!targetChapter || !targetChapter.content) {
      alert('章节内容为空，无法修复');
      return;
    }

    // 确认修复
    const confirmed = confirm(
      `确定要修复以下问题吗？\n\n问题：${issue.description || issue.message}\n建议：${issue.suggestion || '根据问题描述进行修复'}\n\n修复后章节内容将被替换。`
    );

    if (!confirmed) return;

    setFixingIssue(true);
    setFixingIssueId(issue.id || issue.description || issue.message);
    setFixingChapterId(targetChapterId);
    setFixingResult('');

    try {
      const response = await fetch('/api/ai/fix-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue,
          chapterId: targetChapterId,
          content: targetChapter.content,
          characters,
          worldSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '问题修复失败');
      }

      const data = await response.json();

      if (data.content) {
        setFixingResult(data.content);
      } else {
        throw new Error('未返回修复内容');
      }
    } catch (error) {
      console.error('修复问题错误:', error);
      alert('修复失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setFixingIssue(false);
      setFixingIssueId(null);
      setFixingChapterId(null);
    }
  };

  // 应用修复结果
  const applyFixResult = async () => {
    if (!fixingResult.trim()) {
      alert('修复结果为空');
      return;
    }

    const targetChapterId = fixingChapterId || currentChapter?.id;
    const originalContent = chapters.find(c => c.id === targetChapterId)?.content || '';

    setAutoVerifying(true);
    setVerifyProgress({
      iteration: 0,
      maxIterations: 3,
      status: '正在自动校核修复...',
    });
    setVerifyResult(null);

    try {
      const response = await fetch('/api/ai/fix-and-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issues: [{
            id: fixingIssueId || 'manual',
            description: '手动修复',
            suggestion: fixingResult,
            type: 'error',
          }],
          chapterId: targetChapterId,
          content: originalContent,
          characters,
          worldSettings,
          maxIterations: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('自动校核失败');
      }

      const data = await response.json();

      setVerifyResult(data);

      if (data.success) {
        // 自动校核成功，应用最终内容
        const updatedChapters = chapters.map(c =>
          c.id === targetChapterId
            ? { ...c, content: data.finalContent }
            : c
        );

        setChapters(updatedChapters);

        if (targetChapterId === currentChapter?.id && currentChapter) {
          setCurrentChapter({
            ...currentChapter,
            content: data.finalContent,
            wordCount: data.finalContent.trim().split(/\s+/).length,
          });
          checkIssues(data.finalContent);
        }

        setFixingResult('');
        alert(`自动校核完成！经过 ${data.iterationCount} 次修复和校核，内容质量达标。`);
      } else {
        // 达到最大迭代次数，仍有问题
        const updatedChapters = chapters.map(c =>
          c.id === targetChapterId
            ? { ...c, content: data.finalContent }
            : c
        );

        setChapters(updatedChapters);

        if (targetChapterId === currentChapter?.id && currentChapter) {
          setCurrentChapter({
            ...currentChapter,
            content: data.finalContent,
            wordCount: data.finalContent.trim().split(/\s+/).length,
          });
          checkIssues(data.finalContent);
        }

        setFixingResult('');
        alert(data.summary);
      }

      // 重新运行剧情检查
      setTimeout(() => {
        handleCheckPlot();
      }, 500);
    } catch (error) {
      console.error('自动校核错误:', error);
      alert('自动校核失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAutoVerifying(false);
    }
  };

  // 批量选择问题
  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  // 批量修复问题
  const handleBatchFixIssues = async () => {
    if (selectedIssues.size === 0) {
      alert('请先选择要修复的问题');
      return;
    }

    // 确定要修复的章节（基于选中的问题）
    const targetChapterId = fixingChapterId || currentChapter?.id;
    const targetChapter = chapters.find(c => c.id === targetChapterId);

    if (!targetChapter || !targetChapter.content) {
      alert('章节内容为空，无法修复');
      return;
    }

    const confirmed = confirm(
      `确定要批量修复 ${selectedIssues.size} 个问题吗？\n\n修复后章节内容将被替换。`
    );

    if (!confirmed) return;

    setBatchFixing(true);
    setBatchFixResult('');

    try {
      // 构建要修复的问题列表
      const issuesToFix: any[] = [];
      if (showPlotCheck && plotCheckResult?.issues) {
        plotCheckResult.issues.forEach((issue: any, index: number) => {
          if (selectedIssues.has(issue.id || String(index))) {
            issuesToFix.push(issue);
          }
        });
      } else {
        issues.forEach(issue => {
          if (selectedIssues.has(issue.id)) {
            issuesToFix.push({
              id: issue.id,
              description: issue.message,
              suggestion: issue.suggestion,
              type: issue.type,
              line: issue.line,
            });
          }
        });
      }

      const response = await fetch('/api/ai/batch-fix-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issues: issuesToFix,
          chapterId: targetChapterId,
          content: targetChapter.content,
          characters,
          worldSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '批量修复失败');
      }

      const data = await response.json();

      if (data.content) {
        setBatchFixResult(data.content);
      } else {
        throw new Error('未返回修复内容');
      }
    } catch (error) {
      console.error('批量修复错误:', error);
      alert('批量修复失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setBatchFixing(false);
    }
  };

  // 应用批量修复结果
  const applyBatchFixResult = async () => {
    if (!batchFixResult.trim()) {
      alert('修复结果为空');
      return;
    }

    const targetChapterId = fixingChapterId || currentChapter?.id;
    const originalContent = chapters.find(c => c.id === targetChapterId)?.content || '';

    // 构建要修复的问题列表
    const issuesToFix: any[] = [];
    if (showPlotCheck && plotCheckResult?.issues) {
      plotCheckResult.issues.forEach((issue: any, index: number) => {
        if (selectedIssues.has(issue.id || String(index))) {
          issuesToFix.push(issue);
        }
      });
    } else {
      issues.forEach(issue => {
        if (selectedIssues.has(issue.id)) {
          issuesToFix.push({
            id: issue.id,
            description: issue.message,
            suggestion: issue.suggestion,
            type: issue.type,
            line: issue.line,
          });
        }
      });
    }

    setAutoVerifying(true);
    setVerifyProgress({
      iteration: 0,
      maxIterations: 3,
      status: `正在自动校核批量修复（${issuesToFix.length}个问题）...`,
    });
    setVerifyResult(null);

    try {
      const response = await fetch('/api/ai/fix-and-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issues: issuesToFix,
          chapterId: targetChapterId,
          content: originalContent,
          characters,
          worldSettings,
          maxIterations: 3,
        }),
      });

      if (!response.ok) {
        throw new Error('自动校核失败');
      }

      const data = await response.json();

      setVerifyResult(data);

      if (data.success) {
        // 自动校核成功，应用最终内容
        const updatedChapters = chapters.map(c =>
          c.id === targetChapterId
            ? { ...c, content: data.finalContent }
            : c
        );

        setChapters(updatedChapters);

        if (targetChapterId === currentChapter?.id && currentChapter) {
          setCurrentChapter({
            ...currentChapter,
            content: data.finalContent,
            wordCount: data.finalContent.trim().split(/\s+/).length,
          });
          checkIssues(data.finalContent);
        }

        setBatchFixResult('');
        setSelectedIssues(new Set());
        alert(`自动校核完成！经过 ${data.iterationCount} 次修复和校核，${data.summary}`);
      } else {
        // 达到最大迭代次数，仍有问题
        const updatedChapters = chapters.map(c =>
          c.id === targetChapterId
            ? { ...c, content: data.finalContent }
            : c
        );

        setChapters(updatedChapters);

        if (targetChapterId === currentChapter?.id && currentChapter) {
          setCurrentChapter({
            ...currentChapter,
            content: data.finalContent,
            wordCount: data.finalContent.trim().split(/\s+/).length,
          });
          checkIssues(data.finalContent);
        }

        setBatchFixResult('');
        setSelectedIssues(new Set());
        alert(data.summary);
      }

      // 重新运行剧情检查
      setTimeout(() => {
        handleCheckPlot();
      }, 500);
    } catch (error) {
      console.error('自动校核错误:', error);
      alert('自动校核失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAutoVerifying(false);
    }
  };

  // 任务队列功能
  const fetchTasks = async () => {
    try {
      setRefreshingTasks(true);
      const response = await fetch('/api/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setRefreshingTasks(false);
    }
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/pause`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('暂停任务失败:', error);
      alert('暂停任务失败');
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/resume`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('恢复任务失败:', error);
      alert('恢复任务失败');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const confirmed = confirm('确定要删除这个任务吗？删除后无法恢复。');
      if (!confirmed) return;

      const response = await fetch(`/api/tasks/${taskId}/delete`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        fetchTasks();
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除任务失败');
    }
  };

  const handleApplyTaskResult = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task || !task.result) {
        alert('任务结果不完整');
        return;
      }

      // 应用结果到当前编辑器
      if (task.result.outline) {
        setOutline(task.result.outline);
      }
      if (task.result.volumes) {
        setVolumes(task.result.volumes);
      }
      if (task.result.characters) {
        setCharacters(task.result.characters);
      }
      if (task.result.worldSettings) {
        setWorldSettings(task.result.worldSettings);
      }
      if (task.result.chapters) {
        setChapters(task.result.chapters.map((ch: any) => ({
          ...ch,
          status: 'completed' as const,
        })));
        if (task.result.chapters.length > 0) {
          setCurrentChapter({
            ...task.result.chapters[0],
            status: 'completed' as const,
          });
        }
      }

      alert('任务结果已应用到当前项目！');
    } catch (error) {
      console.error('应用任务结果失败:', error);
      alert('应用任务结果失败');
    }
  };

  // 实时刷新任务列表
  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000); // 每5秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 删除单个章节
  const handleDeleteChapter = async (chapterId: string) => {
    const chapterToDelete = chapters.find(c => c.id === chapterId);
    if (!chapterToDelete) {
      alert('章节不存在');
      return;
    }

    const confirmed = confirm(`确定要删除章节"${chapterToDelete.title}"吗？\n\n此操作无法撤销！`);
    if (!confirmed) return;

    try {
      // 从IndexedDB中删除章节内容
      await indexedDBStore.deleteChapter(chapterId);

      // 从chapters数组中删除该章节
      const newChapters = chapters.filter(c => c.id !== chapterId);

      // 重新计算章节的order编号
      const reorderedChapters = newChapters.map((chapter, index) => ({
        ...chapter,
        order: index + 1,
      }));

      // 更新状态
      setChapters(reorderedChapters);

      // 如果删除的是当前章节，设置为第一个章节
      if (currentChapter?.id === chapterId) {
        if (reorderedChapters.length > 0) {
          setCurrentChapter(reorderedChapters[0]);
        } else {
          // 如果没有章节了，创建一个空章节
          const emptyChapter = {
            id: '1',
            title: '第一章',
            content: '',
            wordCount: 0,
            status: 'draft' as const,
            volumeId: volumes[0]?.id || 'vol-1',
            order: 1,
          };
          setChapters([emptyChapter]);
          setCurrentChapter(emptyChapter);
        }
      }

      console.log(`[删除章节] 章节 ${chapterId} 已删除`);
      alert(`章节"${chapterToDelete.title}"已删除`);
    } catch (error) {
      console.error('[删除章节] 失败:', error);
      alert('删除章节失败，请刷新页面重试');
    }
  };

  // 刷新统计信息（重新检测实际章节数）
  const handleRefreshStats = async () => {
    setRefreshingStats(true);
    
    try {
      console.log('[刷新统计] 开始刷新章节数量...');
      console.log('[刷新统计] 前端章节状态:', {
        count: chapters.length,
        chapterIds: chapters.map(c => ({ id: c.id, title: c.title, wordCount: c.wordCount }))
      });
      
      // 从IndexedDB重新加载主数据
      const mainData = await indexedDBStore.loadMainData();
      
      if (mainData && mainData.chapters && Array.isArray(mainData.chapters)) {
        console.log('[刷新统计] 从IndexedDB加载到章节数据:', mainData.chapters.length);
        console.log('[刷新统计] IndexedDB章节ID列表:', mainData.chapters.map((c: any) => c.id));
        
        // 加载每个章节的内容
        const chaptersWithContent = await Promise.all(
          mainData.chapters.map(async (chapter: any) => {
            const content = await indexedDBStore.loadChapterContent(chapter.id);
            console.log(`[刷新统计] 章节 ${chapter.id} 内容长度:`, content?.length || 0);
            return {
              ...chapter,
              content: content || '',
              wordCount: content ? content.trim().split(/\s+/).length : 0,
            };
          })
        );
        
        // 重新计算order编号
        const reorderedChapters = chaptersWithContent.map((chapter, index) => ({
          ...chapter,
          order: index + 1,
        }));
        
        console.log('[刷新统计] 重新排序后的章节:', reorderedChapters.map((c: any) => ({
          id: c.id,
          title: c.title,
          order: c.order,
          wordCount: c.wordCount
        })));
        
        // 对比前端和IndexedDB的差异
        const frontendIds = new Set(chapters.map(c => c.id));
        const indexedDbIds = new Set(reorderedChapters.map((c: any) => c.id));
        
        const onlyInFrontend = [...frontendIds].filter(id => !indexedDbIds.has(id));
        const onlyInIndexedDB = [...indexedDbIds].filter(id => !frontendIds.has(id));
        
        if (onlyInFrontend.length > 0 || onlyInIndexedDB.length > 0) {
          console.warn('[刷新统计] 检测到数据不一致:');
          console.warn('[刷新统计] 仅在前端:', onlyInFrontend);
          console.warn('[刷新统计] 仅在IndexedDB:', onlyInIndexedDB);
        }
        
        // 更新状态
        setChapters(reorderedChapters);
        
        // 如果当前章节不在新列表中，设置为第一个章节
        if (!reorderedChapters.find((c: any) => c.id === currentChapter?.id)) {
          if (reorderedChapters.length > 0) {
            setCurrentChapter(reorderedChapters[0]);
          }
        }
        
        // 更新分卷信息
        if (mainData.volumes && Array.isArray(mainData.volumes)) {
          setVolumes(mainData.volumes);
        }
        
        console.log('[刷新统计] 刷新完成，实际章节数:', reorderedChapters.length);
        
        // 计算有内容的章节数
        const validChaptersCount = reorderedChapters.filter((c: any) => c.content && c.content.trim().length > 0).length;
        
        let alertMessage = `✅ 刷新成功！\n\n当前实际章节数：${validChaptersCount} 章\n总字数：${reorderedChapters.reduce((sum: number, c: any) => sum + c.wordCount, 0).toLocaleString()} 字`;
        
        if (onlyInFrontend.length > 0 || onlyInIndexedDB.length > 0) {
          alertMessage += `\n\n⚠️ 检测到数据不一致:\n`;
          if (onlyInFrontend.length > 0) {
            alertMessage += `- 仅在前端: ${onlyInFrontend.length} 章\n`;
          }
          if (onlyInIndexedDB.length > 0) {
            alertMessage += `- 仅在IndexedDB: ${onlyInIndexedDB.length} 章\n`;
          }
          alertMessage += `\n已同步为IndexedDB中的数据。`;
        }
        
        alert(alertMessage);
      } else {
        console.warn('[刷新统计] IndexedDB中没有章节数据');
        
        // 如果IndexedDB没有数据但前端有，询问是否用前端数据覆盖IndexedDB
        if (chapters.length > 0) {
          const confirmed = confirm('IndexedDB中没有检测到章节数据，但前端有显示。\n\n是否用前端数据重新保存到IndexedDB？\n\n建议选择"是"以恢复数据。');
          if (confirmed) {
            await dataProtector.safeSave({
              title,
              volumes,
              chapters,
              characters,
              outline,
              worldSettings,
              chapterSettings,
              feedbackSettings,
              outlineFeedbackSettings,
              articleRequirements,
              analysisResult,
              uploadedFileName,
              partialResults,
              importData,
              rewriteCompleted,
              rewriteFeedbackSettings,
              performanceMode,
              lastSaved: new Date().toISOString(),
            });
            alert('✅ 已将前端数据保存到IndexedDB！');
          }
        } else {
          alert('未检测到章节数据');
        }
      }
    } catch (error) {
      console.error('[刷新统计] 失败:', error);
      alert('刷新失败，请刷新页面重试');
    } finally {
      setRefreshingStats(false);
    }
  };

  // 强制清除所有章节
  const handleClearAllChapters = async () => {
    const confirmed = confirm('确定要清除所有章节吗？\n\n⚠️ 此操作将删除所有章节内容和IndexedDB中的章节数据！\n\n此操作无法撤销！');
    if (!confirmed) return;
    
    const doubleConfirmed = confirm('再次确认：真的要删除所有章节吗？\n\n章节内容将永久丢失！');
    if (!doubleConfirmed) return;
    
    try {
      console.log('[清除章节] 开始清除所有章节...');
      
      // 1. 清除IndexedDB中的所有章节数据
      const db = await indexedDBStore['ensureDB']();
      const transaction = db.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      console.log('[清除章节] IndexedDB章节数据已清除');

      // 2. 重置为空章节（不创建默认章节）
      // 3. 更新前端状态
      setChapters([]);
      setCurrentChapter(null);

      // 4. 保存到IndexedDB（确保数据一致性）
      await dataProtector.safeSave({
        title,
        volumes,
        chapters: [],
        characters,
        outline,
        worldSettings,
        chapterSettings,
        feedbackSettings,
        outlineFeedbackSettings,
        articleRequirements,
        analysisResult,
        uploadedFileName,
        partialResults,
        importData,
        rewriteCompleted,
        rewriteFeedbackSettings,
        performanceMode,
        lastSaved: new Date().toISOString(),
      });
      
      console.log('[清除章节] 所有章节已清除');
      alert('✅ 所有章节已清除！\n\nIndexedDB中的章节数据也已删除。');
    } catch (error) {
      console.error('[清除章节] 失败:', error);
      alert('清除章节失败，请刷新页面重试');
    }
  };

  // 清除所有数据
  const handleClearData = async () => {
    const confirmed = confirm('确定要清除所有数据吗？此操作无法撤销！\n\n包括：小说标题、大纲、角色设定、世界观、章节内容、章节设置等所有数据。');
    if (!confirmed) return;

    try {
      // 清除 IndexedDB 中的所有数据
      const cleared = await dataProtector.clearAll();
      
      if (!cleared) {
        alert('清除IndexedDB数据失败，请刷新页面重试');
        return;
      }

      // 清除 localStorage
      localStorage.removeItem('novel-editor-data');

      // 重置所有状态
      setTitle('');
      setVolumes([{ id: 'vol-1', title: '第一卷', description: '', order: 1 }]);
      setChapters([]);
      setCurrentChapter(null);
      setCharacters([]);
      setOutline('');
      setWorldSettings([]);
      setIssues([]);
      setChapterSettings({
        targetChapterCount: 20,
        targetWordCountPerChapter: 3000,
      });

      alert('所有数据已清除！\n\n注意：请刷新页面以确保 IndexedDB 数据完全清除。');
    } catch (error) {
      console.error('清除数据失败:', error);
      alert('清除数据失败，请刷新页面重试');
    }
  };

  // 拆书分析功能
  const handleAnalyzeBook = async (continueFromPrevious: boolean = false) => {
    if (!bookContentToAnalyze.trim()) {
      alert('请上传或输入要分析的小说内容');
      return;
    }

    setAnalyzingBook(true);
    setAnalysisResult(null);

    // 如果不是继续生成，则清空之前的部分结果
    if (!continueFromPrevious) {
      setPartialResults([]);
    }

    setAnalyzeProgress({
      step: '分析中',
      percentage: 0,
      message: continueFromPrevious
        ? `继续分析...（已完成 ${partialResults.length} 部分，从第 ${partialResults.length + 1} 部分开始）`
        : '开始分析小说内容...'
    });

    try {
      const response = await fetch('/api/ai/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookContent: bookContentToAnalyze,
          partialResults: continueFromPrevious ? partialResults : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '拆书分析失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.error) {
                  throw new Error(data.error);
                }

                // 更新进度
                if (data.progress) {
                  setAnalyzeProgress({
                    step: data.progress.step,
                    percentage: data.progress.percentage,
                    message: data.progress.message,
                  });
                }

                // 部分结果（实时显示）
                if (data.status === 'partial' && data.data) {
                  setPartialResults((prev) => [
                    ...prev,
                    {
                      partIndex: data.partIndex,
                      totalParts: data.totalParts,
                      data: data.data,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                }

                // 分析完成
                if (data.status === 'completed' && data.data) {
                  setAnalysisResult(data.data);
                }

                // 校核结果
                if (data.status === 'verified' && data.verification) {
                  setAnalysisResult((prev: any) => ({
                    ...prev,
                    verification: data.verification,
                  }));
                }
              } catch (e) {
                console.error('解析数据失败:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('拆书分析错误:', error);
      alert('拆书分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setAnalyzingBook(false);
      setAnalyzeProgress({ step: '', percentage: 0, message: '' });
    }
  };

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      setBookContentToAnalyze(content);
      setUploadingFile(false);
    };

    reader.onerror = () => {
      alert('文件读取失败');
      setUploadingFile(false);
    };

    // 对于大文件，使用readAsText
    reader.readAsText(file);
  };

  // 清除文件
  const clearFile = () => {
    const hasPartialResults = partialResults.length > 0;
    const confirmMessage = hasPartialResults
      ? '确定要清除文件和分析结果吗？\n\n此操作将：\n- 清除已上传的文件内容\n- 清除已保存的分析结果（包括已完成的 ' + partialResults.length + ' 部分结果）\n\n操作后需要重新上传文件进行分析。'
      : '确定要清除文件和分析结果吗？\n\n此操作将：\n- 清除已上传的文件内容\n- 清除已保存的分析结果\n\n操作后需要重新上传文件进行分析。';

    if (!confirm(confirmMessage)) return;

    setBookContentToAnalyze('');
    setUploadedFileName('');
    setAnalysisResult(null);
    setPartialResults([]); // 同时清除部分结果
  };

  // 只清除文件内容，保留分析结果
  const clearFileContent = () => {
    const hasPartialResults = partialResults.length > 0 && !analysisResult;
    const hasCompletedResult = analysisResult !== null;

    let confirmMessage = '确定要清除文件内容吗？\n\n此操作将：\n- 清除已上传的文件内容\n';

    if (hasPartialResults) {
      confirmMessage += `- 保留已完成的 ${partialResults.length} 部分分析结果\n⚠️ 注意：清除文件内容后，需要重新上传同一文件才能继续分析\n`;
    } else if (hasCompletedResult) {
      confirmMessage += '- 保留已保存的完整分析结果\n';
    }

    confirmMessage += '\n分析结果可以继续使用，如需重新分析请重新上传文件。';

    if (!confirm(confirmMessage)) return;

    setBookContentToAnalyze('');
    // 不清除文件名和分析结果和部分结果
  };

  // 只清除分析结果，保留文件
  const clearAnalysisResult = () => {
    const confirmed = confirm(
      '确定要清除分析结果吗？\n\n此操作将：\n- 清除已保存的分析结果\n- 保留已上传的文件内容\n\n可以重新点击"开始分析"来生成新的分析结果。'
    );
    if (!confirmed) return;

    setAnalysisResult(null);
  };

  // 清除所有
  const clearAll = () => {
    const hasPartialResults = partialResults.length > 0;
    const confirmMessage = hasPartialResults
      ? '确定要清除所有内容吗？\n\n此操作将：\n- 清除已上传的文件内容\n- 清除文件名\n- 清除已保存的分析结果（包括已完成的 ' + partialResults.length + ' 部分结果）\n\n操作后需要重新上传文件进行分析。'
      : '确定要清除所有内容吗？\n\n此操作将：\n- 清除已上传的文件内容\n- 清除文件名\n- 清除已保存的分析结果\n\n操作后需要重新上传文件进行分析。';

    if (!confirm(confirmMessage)) return;

    setBookContentToAnalyze('');
    setUploadedFileName('');
    setAnalysisResult(null);
    setPartialResults([]); // 清除部分结果
  };

  // 格式化世界观数据（处理对象或字符串）
  const formatWorldview = (worldview: any): string => {
    if (typeof worldview === 'string') {
      return worldview;
    }

    if (typeof worldview === 'object' && worldview !== null) {
      // 如果是对象，将其转换为格式化的字符串
      const parts: string[] = [];
      if (worldview.coreSetting) parts.push(`核心设定：${worldview.coreSetting}`);
      if (worldview.powerSystem) parts.push(`力量体系：${worldview.powerSystem}`);
      if (worldview.geographicalEnvironment) parts.push(`地理环境：${worldview.geographicalEnvironment}`);
      if (worldview.socialStructure) parts.push(`社会结构：${worldview.socialStructure}`);
      if (worldview.historicalBackground) parts.push(`历史背景：${worldview.historicalBackground}`);

      return parts.join('\n') || JSON.stringify(worldview);
    }

    return String(worldview);
  };

  // 格式化任意数据为可显示的字符串
  const formatDisplayText = (data: any): string => {
    if (data === null || data === undefined) {
      return '';
    }

    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    if (typeof data === 'object') {
      try {
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return String(data);
      }
    }

    return String(data);
  };

  // 应用拆书分析结果
  const applyAnalysisResult = () => {
    if (!analysisResult) return;

    const confirmed = confirm(
      '确定要应用拆书分析结果吗？\n\n这将：\n1. 填充世界观设定\n2. 添加角色设定\n3. 生成故事大纲\n\n注意：原有人物和世界观可能会被合并，大纲将被替换。'
    );

    if (!confirmed) return;

    // 1. 应用世界观
    if (analysisResult.worldview) {
      const worldviewText = formatWorldview(analysisResult.worldview);
      const worldviewLines = worldviewText.split('\n').filter((line: string) => line.trim());
      worldviewLines.forEach((line: string) => {
        if (line.includes('：') || line.includes(':')) {
          const parts = line.split(/[：:]/);
          if (parts.length >= 2) {
            setWorldSettings(prev => [...prev, {
              id: Date.now().toString() + Math.random(),
              name: parts[0].trim(),
              type: '世界观',
              description: parts.slice(1).join('').trim(),
            }]);
          }
        }
      });
    }

    // 2. 应用角色设定
    if (analysisResult.characters && Array.isArray(analysisResult.characters)) {
      analysisResult.characters.forEach((char: any) => {
        if (char.name) {
          setCharacters(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            name: char.name,
            age: char.age || '',
            role: char.role || '',
            personality: char.personality || '',
            background: char.background || '',
            appearance: '',
            abilities: char.ability || '',
            goals: '',
            weaknesses: '',
            relationships: '',
            appearanceReason: '',
            disappearanceReason: '',
            status: 'active',
            chapterAppearances: [],
          }]);
        }
      });
    }

    // 3. 应用大纲
    if (analysisResult.plotStructure) {
      setOutline(analysisResult.plotStructure);
    }

    // 4. 应用写作风格作为文章目的
    if (analysisResult.writingStyle) {
      setArticleRequirements(prev => ({
        ...prev,
        styleChange: analysisResult.writingStyle,
      }));
    }

    alert('拆书分析结果已应用！\n\n请检查各个模块，根据需要进行调整。');
    setAnalysisResult(null);
    setBookContentToAnalyze('');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* 左侧导航栏 */}
      <div className="w-72 border-r bg-card p-4 overflow-y-auto max-h-screen">
        {/* 头部 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">小说写作助手</h1>
          </div>

          {/* 小说标题 */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="小说标题"
            className="mb-2"
          />
        </div>

        {/* 创作步骤导航 */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-2">创作流程指引</div>
          <div className="space-y-1">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const colorClasses = {
                blue: {
                  bg: isActive ? 'bg-blue-500' : isCompleted ? 'bg-blue-500' : 'bg-blue-100 dark:bg-blue-900',
                  text: isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-blue-700 dark:text-blue-300',
                  border: isActive ? 'border-blue-500' : isCompleted ? 'border-blue-500' : 'border-blue-200 dark:border-blue-800',
                },
                purple: {
                  bg: isActive ? 'bg-purple-500' : isCompleted ? 'bg-purple-500' : 'bg-purple-100 dark:bg-purple-900',
                  text: isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-purple-700 dark:text-purple-300',
                  border: isActive ? 'border-purple-500' : isCompleted ? 'border-purple-500' : 'border-purple-200 dark:border-purple-800',
                },
                green: {
                  bg: isActive ? 'bg-green-500' : isCompleted ? 'bg-green-500' : 'bg-green-100 dark:bg-green-900',
                  text: isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-green-700 dark:text-green-300',
                  border: isActive ? 'border-green-500' : isCompleted ? 'border-green-500' : 'border-green-200 dark:border-green-800',
                },
                orange: {
                  bg: isActive ? 'bg-orange-500' : isCompleted ? 'bg-orange-500' : 'bg-orange-100 dark:bg-orange-900',
                  text: isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-orange-700 dark:text-orange-300',
                  border: isActive ? 'border-orange-500' : isCompleted ? 'border-orange-500' : 'border-orange-200 dark:border-orange-800',
                },
                gray: {
                  bg: isActive ? 'bg-gray-500' : isCompleted ? 'bg-gray-500' : 'bg-gray-100 dark:bg-gray-900',
                  text: isActive ? 'text-white' : isCompleted ? 'text-white' : 'text-gray-700 dark:text-gray-300',
                  border: isActive ? 'border-gray-500' : isCompleted ? 'border-gray-500' : 'border-gray-200 dark:border-gray-800',
                },
              };
              const colors = colorClasses[step.color as keyof typeof colorClasses];

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
                  onClick={() => setCurrentStep(step.id as 1 | 2 | 3 | 4 | 5)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${colors.text} ${isActive ? 'ring-2 ring-white' : ''}`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <div className={`flex-1 ${colors.text}`}>
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-[10px] opacity-80">{step.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="border-t my-3" />

        {/* 感谢作者 - 独立显示，不属于任何阶段 */}
        <Card className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800">
          <ThankAuthorButton />
        </Card>

        {/* 分隔线 */}
        <div className="border-t my-3" />

        {/* 阶段1：准备设定 */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
              <div className="w-1 h-4 bg-blue-500 rounded" />
              阶段1：准备设定
            </div>

            {/* 自动生成大纲 */}
            <AutoOutlineDialog onGenerateComplete={handleAutoOutlineComplete} />

            {/* 一键自动生成 */}
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600"
              onClick={() => setShowGenerateAll(!showGenerateAll)}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  一键自动生成
                </>
              )}
            </Button>

            {/* 核心写作规则 */}
            <Card className="p-2 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <div className="text-xs font-medium mb-1 text-red-700 dark:text-red-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                核心写作规则
              </div>
              <div className="text-[10px] text-red-600 dark:text-red-400 space-y-0.5">
                <div className="font-bold">🚫 禁止感情线/成长线作为主线</div>
              </div>
            </Card>
          </div>
        )}

        {/* 阶段2：规划结构 */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1">
              <div className="w-1 h-4 bg-purple-500 rounded" />
              阶段2：规划结构
            </div>

            {/* 章节设置 */}
            <Card className="p-2 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
              <div className="text-xs font-medium mb-1 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                <Settings className="h-3 w-3" />
                章节设置
              </div>
              <div className="space-y-1">
                <div>
                  <Label className="text-[10px] text-purple-600 dark:text-purple-400">目标章节数</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={chapterSettings.targetChapterCount}
                    onChange={(e) => setChapterSettings({ ...chapterSettings, targetChapterCount: parseInt(e.target.value) || 1 })}
                    className="h-6 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-purple-600 dark:text-purple-400">每章字数要求</Label>
                  <Input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={chapterSettings.targetWordCountPerChapter}
                    onChange={(e) => setChapterSettings({ ...chapterSettings, targetWordCountPerChapter: parseInt(e.target.value) || 1000 })}
                    className="h-6 text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* 批量生成章节按钮 */}
            <Button
              size="sm"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
              onClick={() => setActiveTab('tools')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              批量生成章节
            </Button>
          </div>
        )}

        {/* 阶段3：内容创作 */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1">
              <div className="w-1 h-4 bg-green-500 rounded" />
              阶段3：内容创作
            </div>

            {/* 写作反馈与调整 */}
            <Card className="p-2 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="text-xs font-medium mb-1 text-green-700 dark:text-green-300 flex items-center gap-1">
                <Edit className="h-3 w-3" />
                写作反馈
              </div>
              <Textarea
                value={feedbackSettings.dissatisfactionReason}
                onChange={(e) => setFeedbackSettings({ ...feedbackSettings, dissatisfactionReason: e.target.value })}
                placeholder="哪里不满意？"
                className="min-h-[60px] resize-none text-xs"
              />
            </Card>

            {/* 文章目的需求 */}
            <Card className="p-2 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
              <div className="text-xs font-medium mb-1 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                写作需求
              </div>
              <Textarea
                value={articleRequirements.purpose}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, purpose: e.target.value })}
                placeholder="本章目的、风格、内容调整..."
                className="min-h-[60px] resize-none text-xs"
              />
            </Card>

            <Button
              size="sm"
              onClick={handleDirectEdit}
              disabled={aiLoading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 hover:from-green-600 hover:to-teal-600"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              立即更改当前内容
            </Button>
          </div>
        )}

        {/* 阶段4：质量检查 */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-orange-700 dark:text-orange-300 flex items-center gap-1">
              <div className="w-1 h-4 bg-orange-500 rounded" />
              阶段4：质量检查
            </div>

            {/* 问题检查 */}
            <Card className="p-2 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
              <div className="text-xs font-medium mb-1 text-orange-700 dark:text-orange-300 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                问题检查
              </div>
              <div className="flex items-center gap-2 text-xs">
                {issues.filter(i => i.type === 'error').length > 0 && (
                  <span className="text-destructive">{issues.filter(i => i.type === 'error').length} 错误</span>
                )}
                {issues.filter(i => i.type === 'warning').length > 0 && (
                  <span className="text-yellow-600">{issues.filter(i => i.type === 'warning').length} 警告</span>
                )}
                {issues.length === 0 && (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    无问题
                  </span>
                )}
              </div>
            </Card>

            {/* 剧情检查按钮 */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckPlot}
              disabled={checkingPlot || validChapterCount === 0}
              className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
            >
              {checkingPlot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  检查中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  剧情检查
                </>
              )}
            </Button>

            {/* AI写作弊端禁忌 */}
            <Card className="p-2 bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800">
              <div className="text-[10px] text-orange-600 dark:text-orange-400">
                <div className="font-bold mb-1">❌ 禁止：华美空洞、逻辑bug、流水账、套路化</div>
              </div>
            </Card>
          </div>
        )}

        {/* 阶段5：高级功能 */}
        {currentStep === 5 && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <div className="w-1 h-4 bg-gray-500 rounded" />
              阶段5：高级功能
            </div>

            {/* 数据管理 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => window.location.href = '/data-manager'}
            >
              <Database className="h-4 w-4 mr-2" />
              数据管理
            </Button>

            {/* 性能监控 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
              onClick={() => window.location.href = '/performance-monitor'}
            >
              <Activity className="h-4 w-4 mr-2" />
              性能监控
            </Button>

            {/* 网络诊断 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50"
              onClick={() => window.location.href = '/network-diagnostics'}
            >
              <Network className="h-4 w-4 mr-2" />
              网络诊断
            </Button>

            {/* 清除所有数据 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              onClick={handleClearData}
              disabled={generating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清除所有数据
            </Button>
          </div>
        )}

        {/* 分隔线 */}
        <div className="border-t my-3" />

        {/* 章节列表（所有阶段都显示） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">分卷与章节</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowVolumeManager(!showVolumeManager)}>
                <BookMarked className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={addChapter} disabled={buttonLoading['add-chapter']}>
                {buttonLoading['add-chapter'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 分卷管理面板 */}
          {showVolumeManager && (
          <Card className="p-3 mb-4 bg-primary/5 border-primary/20">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">小说类型</Label>
                <Select
                  value={generateParams.genre}
                  onValueChange={(value) => setGenerateParams({ ...generateParams, genre: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="玄幻">玄幻</SelectItem>
                    <SelectItem value="奇幻">奇幻</SelectItem>
                    <SelectItem value="科幻">科幻</SelectItem>
                    <SelectItem value="仙侠">仙侠</SelectItem>
                    <SelectItem value="魔幻">魔幻</SelectItem>
                    <SelectItem value="异能">异能</SelectItem>
                    <SelectItem value="末世">末世</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">核心主题</Label>
                <Input
                  value={generateParams.theme}
                  onChange={(e) => setGenerateParams({ ...generateParams, theme: e.target.value })}
                  placeholder="如：拯救世界、复仇、探索未知、守护家园（禁止个人成长主题）"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">主角设定</Label>
                <Input
                  value={generateParams.protagonist}
                  onChange={(e) => setGenerateParams({ ...generateParams, protagonist: e.target.value })}
                  placeholder="如：少年、少年英雄"
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">章节数</Label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={generateParams.chapterCount}
                    onChange={(e) => setGenerateParams({ ...generateParams, chapterCount: parseInt(e.target.value) || chapterSettings.targetChapterCount })}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">每章字数</Label>
                  <Input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={generateParams.wordCountPerChapter || chapterSettings.targetWordCountPerChapter}
                    onChange={(e) => setGenerateParams({ ...generateParams, wordCountPerChapter: parseInt(e.target.value) || chapterSettings.targetWordCountPerChapter })}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground">
                💡 提示：也可在"章节设置"模块中统一设置
              </div>
              <Button size="sm" onClick={handleGenerateAll} className="w-full">
                <Wand2 className="h-4 w-4 mr-2" />
                开始生成
              </Button>
            </div>
          </Card>
        )}

        {/* 生成进度 */}
        {generating && generateProgress.step > 0 && (
          <Card className="p-4 mb-4 bg-primary/10 border-primary/30">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              正在生成...
            </h3>
            <div className="space-y-3">
              {/* 步骤进度 */}
              <div className="space-y-2">
                {[
                  { step: 1, name: '生成小说大纲' },
                  { step: 2, name: '创建分卷结构' },
                  { step: 3, name: '生成角色设定' },
                  { step: 4, name: '生成世界观设定' },
                  { step: 5, name: '生成章节内容' },
                ].map((s) => {
                  const status = s.step < generateProgress.step
                    ? 'completed'
                    : s.step === generateProgress.step
                    ? 'current'
                    : 'pending';

                  return (
                    <div key={s.step} className="flex items-center gap-2 text-sm">
                      <div className={
                        'w-5 h-5 rounded-full flex items-center justify-center text-xs ' +
                        (status === 'completed' ? 'bg-green-500 text-white ' : '') +
                        (status === 'current' ? 'bg-primary text-white animate-pulse ' : '') +
                        (status === 'pending' ? 'bg-muted text-muted-foreground ' : '')
                      }>
                        {status === 'completed' ? '✓' : s.step}
                      </div>
                      <span className={status === 'pending' ? 'text-muted-foreground' : ''}>
                        {s.name}
                      </span>
                      {status === 'current' && (
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 当前消息 */}
              <div className="text-xs text-muted-foreground">
                {generateProgress.message}
              </div>

              {/* 进度条 */}
              {generateProgress.progress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>章节生成进度</span>
                    <span>{generateProgress.progress.current} / {generateProgress.progress.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: generateProgress.progress.percentage + '%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 章节设置 */}
        <Card className="p-3 mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <div className="text-sm font-medium mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            章节设置
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-blue-600 dark:text-blue-400">目标章节数</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={chapterSettings.targetChapterCount}
                onChange={(e) => setChapterSettings({ ...chapterSettings, targetChapterCount: parseInt(e.target.value) || 1 })}
                className="h-8 text-sm"
              />
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                当前：{validChapterCount} / 目标：{chapterSettings.targetChapterCount} 章
              </div>
            </div>
            <div>
              <Label className="text-xs text-blue-600 dark:text-blue-400">每章字数要求</Label>
              <Input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={chapterSettings.targetWordCountPerChapter}
                onChange={(e) => setChapterSettings({ ...chapterSettings, targetWordCountPerChapter: parseInt(e.target.value) || 1000 })}
                className="h-8 text-sm"
              />
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                AI生成时会按照此字数生成章节内容
              </div>
            </div>
          </div>
        </Card>

        {/* 写作反馈与调整 */}
        <Card className="p-3 mb-4 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
          <div className="text-sm font-medium mb-2 text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            写作反馈与调整
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-purple-600 dark:text-purple-400">对当前内容哪里不满意的原因</Label>
              <Textarea
                value={feedbackSettings.dissatisfactionReason}
                onChange={(e) => setFeedbackSettings({ ...feedbackSettings, dissatisfactionReason: e.target.value })}
                placeholder="例如：情节过于平淡、角色性格不够鲜明、对话不够生动、节奏太慢等"
                className="min-h-[80px] resize-none text-sm"
              />
              <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                AI生成时会根据这些反馈进行调整
              </div>
            </div>
            <div>
              <Label className="text-xs text-purple-600 dark:text-purple-400">理想的内容描述</Label>
              <Textarea
                value={feedbackSettings.idealContent}
                onChange={(e) => setFeedbackSettings({ ...feedbackSettings, idealContent: e.target.value })}
                placeholder="例如：希望增加更多打斗场面、希望角色更冷静果断、希望剧情更紧凑有悬念等"
                className="min-h-[80px] resize-none text-sm"
              />
              <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                AI生成时会参考这些期望来创作内容
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleDirectEdit}
              disabled={aiLoading}
              className="w-full mt-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              立即更改当前内容
            </Button>
          </div>
        </Card>

        {/* 文章目的需求与更改指令 */}
        <Card className="p-3 mb-4 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <div className="text-sm font-medium mb-2 text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            文章目的需求与更改指令
          </div>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">文章目的</Label>
              <Textarea
                value={articleRequirements.purpose}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, purpose: e.target.value })}
                placeholder="例如：介绍世界观、推进剧情、展示角色性格、埋下伏笔等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">风格调整</Label>
              <Input
                value={articleRequirements.styleChange}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, styleChange: e.target.value })}
                placeholder="例如：更简洁、更华丽、更幽默、更严肃等"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">内容增删</Label>
              <Textarea
                value={articleRequirements.contentChange}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, contentChange: e.target.value })}
                placeholder="例如：增加打斗场面、减少对话、增加环境描写、删除冗余段落等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">角色调整</Label>
              <Textarea
                value={articleRequirements.characterAdjust}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, characterAdjust: e.target.value })}
                placeholder="例如：让主角更冷静果断、让反派更狡猾、增加配角戏份等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">剧情走向</Label>
              <Textarea
                value={articleRequirements.plotDirection}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, plotDirection: e.target.value })}
                placeholder="例如：增加悬念、加快节奏、铺垫伏笔、制造反转等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">对话优化</Label>
              <Textarea
                value={articleRequirements.dialogueOptimization}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, dialogueOptimization: e.target.value })}
                placeholder="例如：让对话更有张力、体现角色性格、增加潜台词、减少说教等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-amber-600 dark:text-amber-400">描写优化</Label>
              <Textarea
                value={articleRequirements.descriptionEnhance}
                onChange={(e) => setArticleRequirements({ ...articleRequirements, descriptionEnhance: e.target.value })}
                placeholder="例如：增强环境描写、增加感官细节、优化战斗描写、强化心理描写等"
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleDirectEdit}
              disabled={aiLoading}
              className="w-full mt-2"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              立即更改当前内容
            </Button>
          </div>
        </Card>

        {/* 分卷和章节列表 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">分卷与章节</Label>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowVolumeManager(!showVolumeManager)}>
                <BookMarked className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={addChapter} disabled={buttonLoading['add-chapter']}>
                {buttonLoading['add-chapter'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 分卷管理面板 */}
          {showVolumeManager && (
            <Card className="p-3 mb-2 bg-muted/30">
              <div className="space-y-2">
                <Input
                  value={newVolumeTitle}
                  onChange={(e) => setNewVolumeTitle(e.target.value)}
                  placeholder="新分卷标题"
                  className="h-8"
                />
                <Input
                  value={newVolumeDescription}
                  onChange={(e) => setNewVolumeDescription(e.target.value)}
                  placeholder="分卷描述（可选）"
                  className="h-8"
                />
                <Button size="sm" onClick={addVolume} disabled={!newVolumeTitle || buttonLoading['add-volume']} className="w-full">
                  {buttonLoading['add-volume'] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {buttonLoading['add-volume'] ? '添加中...' : '添加分卷'}
                </Button>
                <div className="space-y-1 mt-2">
                  {volumes.map((volume) => (
                    <div key={volume.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex-1">
                        <div className="text-xs font-medium">{volume.title}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeVolume(volume.id)}
                        disabled={volumes.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 按卷显示章节 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {volumes.map((volume) => {
              const volumeChapters = chapters
                .filter(c => c.volumeId === volume.id)
                .sort((a, b) => a.order - b.order)
                .slice(0, chaptersLimit);

              return (
                <div key={volume.id}>
                  <div
                    className="text-xs font-medium text-primary mb-1 cursor-pointer hover:underline"
                    onClick={() => selectVolume(volume.id)}
                  >
                    {volume.title} ({volumeChapters.length}章)
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-muted">
                    {volumeChapters.map((chapter) => {
                      const wordPercent = chapter.wordCount / chapterSettings.targetWordCountPerChapter;
                      const wordColor = wordPercent >= 1 ? 'text-green-600' : wordPercent >= 0.7 ? 'text-yellow-600' : 'text-red-600';
                      return (
                        <div key={chapter.id} className="flex items-center gap-1 group">
                          <Button
                            variant={currentChapter?.id === chapter.id ? 'default' : 'ghost'}
                            size="sm"
                            className="flex-1 justify-start h-7 px-2 min-w-0"
                            onClick={() => selectChapter(chapter.id)}
                          >
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-xs truncate">{chapter.title}</div>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <span className={`text-[10px] ${wordColor}`}>
                                {chapter.wordCount}字
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                /{chapterSettings.targetWordCountPerChapter}
                              </span>
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteChapter(chapter.id)}
                            title="删除章节"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {chapters.length > chaptersLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChaptersLimit(prev => Math.min(prev + 50, chapters.length))}
                className="w-full mt-2 text-xs"
              >
                显示更多章节 ({chapters.length - chaptersLimit}/{chapters.length})
              </Button>
            )}
          </div>
        </div>

        </div>
      </div>

      {/* 主编辑区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 - 只在有章节时显示 */}
        {chapters.length > 0 && (
          <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <Input
                value={currentChapter?.title}
                onChange={(e) => {
                  if (currentChapter) {
                    setCurrentChapter({ ...currentChapter, title: e.target.value });
                  }
                }}
                className="w-64"
              />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">字数: {currentChapter?.wordCount}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCheckPlot} disabled={checkingPlot || validChapterCount === 0}>
                {checkingPlot ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {checkingPlot ? '检查中...' : '剧情检查'}
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                预览
              </Button>
              <Button size="sm" onClick={saveChapter}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>


          </div>

          {/* AI工具栏 */}
          <div className="flex items-center gap-2 mb-3">
            <Select value={selectedAiTool} onValueChange={setSelectedAiTool}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="continue">AI续写</SelectItem>
                <SelectItem value="expand">AI扩写</SelectItem>
                <SelectItem value="polish">AI润色</SelectItem>
                <SelectItem value="auto-write">🚀 自动写作</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                selectedAiTool === 'continue'
                  ? '输入续写提示（可选）'
                  : selectedAiTool === 'expand'
                  ? '输入扩写要求（可选）'
                  : selectedAiTool === 'polish'
                  ? '选择润色风格：简洁明快/细腻优美/悬疑紧凑/幽默风趣'
                  : '输入本章大纲，AI将自动撰写本章内容'
              }
              className="flex-1 h-8"
            />
            <Button size="sm" onClick={selectedAiTool === 'auto-write' ? handleAutoWrite : handleAiAction} disabled={aiLoading}>
              {aiLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {aiLoading ? '生成中...' : '生成'}
            </Button>
          </div>

          {/* 自动写作提示 */}
          {selectedAiTool === 'auto-write' && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="text-xs text-muted-foreground">
                💡 自动写作将根据大纲、人物设定和世界观自动生成完整章节内容。
                输入章节大纲后点击"生成"即可开始。
              </div>
            </Card>
          )}
        </div>
        )}

        {/* 编辑器 + AI结果 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isInitialLoading ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full py-20">
              <Loader2 className="h-16 w-16 text-muted-foreground mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">正在加载...</h3>
              <p className="text-sm text-muted-foreground text-center">
                正在恢复你的写作进度
              </p>
            </div>
          ) : chapters.length === 0 ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center h-full py-20">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">还没有章节</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                开始创作你的小说吧！你可以选择以下方式：
              </p>
              <div className="space-y-3 w-full max-w-md">
                <Button onClick={() => setActiveTab('tools')} className="w-full">
                  <Wand2 className="h-4 w-4 mr-2" />
                  批量生成章节
                </Button>
                <Button onClick={() => setActiveTab('tools')} variant="outline" className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  先生成大纲
                </Button>
                <Button onClick={handleAddChapter} variant="ghost" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  手动添加章节
                </Button>
              </div>
            </div>
          ) : (
            <React.Fragment>
              <div className="max-w-4xl mx-auto space-y-4">
                <Textarea
                  key={currentChapter?.id || 'empty'}
                  value={currentChapter?.content || ''}
                  onChange={(e) => updateChapterContent(e.target.value)}
                  placeholder="开始写作..."
                  className="min-h-[500px] resize-none font-mono text-sm leading-relaxed"
                />

            {/* AI生成结果 */}
            {aiResult && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    AI生成结果
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAiResult('')}>
                      重新生成
                    </Button>
                    <Button size="sm" onClick={applyAiResult}>
                      应用到正文
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={aiResult}
                  onChange={(e) => setAiResult(e.target.value)}
                  className="min-h-[200px] resize-none text-sm leading-relaxed"
                />
              </Card>
            )}

            {/* 问题修复结果 */}
            {fixingResult && (
              <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300">
                    <Wand2 className="h-4 w-4" />
                    问题修复结果
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setFixingResult('')}>
                      放弃修复
                    </Button>
                    <Button size="sm" onClick={applyFixResult}>
                      应用修复
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mb-2">
                  💡 修复后的内容，确认无误后点击"应用修复"替换原章节内容
                </div>
                <Textarea
                  value={fixingResult}
                  onChange={(e) => setFixingResult(e.target.value)}
                  className="min-h-[200px] resize-none text-sm leading-relaxed"
                />
              </Card>
            )}

            {/* 批量修复结果 */}
            {batchFixResult && (
              <Card className="p-4 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <Wand2 className="h-4 w-4" />
                    批量修复结果（{selectedIssues.size}个问题）
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setBatchFixResult(''); setSelectedIssues(new Set()); }}>
                      放弃修复
                    </Button>
                    <Button size="sm" onClick={applyBatchFixResult}>
                      应用修复
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mb-2">
                  💡 已一次性修复 {selectedIssues.size} 个问题，确认无误后点击"应用修复"替换原章节内容
                </div>
                <Textarea
                  value={batchFixResult}
                  onChange={(e) => setBatchFixResult(e.target.value)}
                  className="min-h-[300px] resize-none text-sm leading-relaxed"
                />
              </Card>
            )}

            {/* 自动校核进度 */}
            {autoVerifying && (
              <Card className="p-4 bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                  <div className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                    自动校核中...
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-cyan-600 dark:text-cyan-400">
                    {verifyProgress.status}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(verifyProgress.iteration / verifyProgress.maxIterations) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    进度：{verifyProgress.iteration}/{verifyProgress.maxIterations}
                  </div>
                </div>
              </Card>
            )}

            {/* 校核结果报告 */}
            {verifyResult && (
              <Card className="p-4 bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-teal-600" />
                  <div className="text-sm font-medium text-teal-700 dark:text-teal-300">
                    自动校核报告
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">校核状态</span>
                      <Badge className={verifyResult.success ? "bg-green-500" : "bg-yellow-500"}>
                        {verifyResult.success ? "校核通过" : "达到最大迭代"}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      {verifyResult.summary}
                    </div>
                  </div>

                  {verifyResult.iterationHistory && verifyResult.iterationHistory.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-xs font-medium mb-2">校核历史</div>
                      <div className="space-y-2">
                        {verifyResult.iterationHistory.map((history: any, index: number) => (
                          <div key={index} className="text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                第 {history.iteration} 轮
                              </Badge>
                              <span className={
                                history.status === 'passed' ? 'text-green-600' :
                                history.status === 'found_issues' ? 'text-yellow-600' :
                                'text-blue-600'
                              }>
                                {history.status === 'passed' ? '✓ 通过' :
                                 history.status === 'found_issues' ? `⚠ 发现 ${history.issues?.length || 0} 个问题` :
                                 '○ 其他'}
                              </span>
                            </div>
                            {history.issues && history.issues.length > 0 && (
                              <div className="mt-1 ml-4 text-muted-foreground">
                                {history.issues.map((issue: any, i: number) => (
                                  <div key={i} className="truncate">
                                    • {issue.description}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {verifyResult.remainingIssues && verifyResult.remainingIssues.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                      <div className="text-xs font-medium mb-2 text-yellow-700 dark:text-yellow-300">
                        剩余问题（需手动处理）
                      </div>
                      <div className="space-y-2">
                        {verifyResult.remainingIssues.map((issue: any, index: number) => (
                          <div key={index} className="text-xs">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                              <div>
                                <div className="font-medium">{issue.description}</div>
                                {issue.suggestion && (
                                  <div className="text-muted-foreground mt-1">
                                    💡 {issue.suggestion}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 剧情检查结果 */}
            {showPlotCheck && (
              <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <CheckCircle className="h-4 w-4" />
                    剧情检查报告
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowPlotCheck(false)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {checkingPlot && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-muted-foreground">正在分析剧情合理性...</span>
                  </div>
                )}

                {plotCheckResult && !checkingPlot && (
                  <div className="space-y-4">
                    {/* 检查范围说明 */}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        已检查 {chapters.filter(c => c.content && c.content.trim().length > 0).length} 个章节的内容（共 {chapters.length} 个章节）
                      </div>
                    </div>

                    {/* 综合评分 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">综合评分</span>
                        <span className={
                          'text-2xl font-bold ' +
                          (plotCheckResult.overallScore >= 90 ? 'text-green-600' :
                          plotCheckResult.overallScore >= 70 ? 'text-blue-600' :
                          plotCheckResult.overallScore >= 50 ? 'text-yellow-600' :
                          'text-red-600')
                        }>
                          {plotCheckResult.overallScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={
                            'h-2 rounded-full ' +
                            (plotCheckResult.overallScore >= 90 ? 'bg-green-500' :
                            plotCheckResult.overallScore >= 70 ? 'bg-blue-500' :
                            plotCheckResult.overallScore >= 50 ? 'bg-yellow-500' :
                            'bg-red-500')
                          }
                          style={{ width: plotCheckResult.overallScore + '%' }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">{plotCheckResult.summary}</p>
                    </div>

                    {/* 亮点 */}
                    {plotCheckResult.highlights && plotCheckResult.highlights.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-green-700 dark:text-green-300">
                          <Sparkles className="h-4 w-4" />
                          亮点分析
                        </h4>
                        <div className="space-y-2">
                          {plotCheckResult.highlights.map((highlight: any, index: number) => (
                            <div key={index} className="text-sm">
                              <Badge variant="outline" className="mr-2 text-[10px]">
                                {highlight.category}
                              </Badge>
                              {highlight.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 问题列表 */}
                    {plotCheckResult.issues && plotCheckResult.issues.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            发现 {plotCheckResult.issues.length} 个问题
                          </h4>
                          {selectedIssues.size > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBatchFixIssues}
                              disabled={batchFixing}
                              className="h-7 px-3 text-xs"
                            >
                              {batchFixing ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  修复中...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="h-3 w-3 mr-2" />
                                  批量修复 ({selectedIssues.size})
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {plotCheckResult.issues.map((issue: any, index: number) => {
                            const issueId = issue.id || String(index);
                            const isSelected = selectedIssues.has(issueId);
                            return (
                            <div
                              key={index}
                              className={
                                'p-4 rounded-lg border ' +
                                (isSelected ? 'ring-2 ring-primary ' : '') +
                                (issue.type === 'error'
                                  ? 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                                  : issue.type === 'warning'
                                  ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                                  : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800')
                              }
                            >
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleIssueSelection(issueId)}
                                  className="mt-1"
                                />
                                <div className={
                                  'mt-0.5 ' +
                                  (issue.type === 'error' ? 'text-red-600' :
                                  issue.type === 'warning' ? 'text-yellow-600' :
                                  'text-blue-600')
                                }>
                                  {issue.type === 'error' && <AlertTriangle className="h-4 w-4" />}
                                  {issue.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                                  {issue.type === 'suggestion' && <BookOpen className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-[10px]">
                                        {issue.category}
                                      </Badge>
                                      {issue.location && (
                                        <span className="text-xs text-muted-foreground">
                                          {issue.location}
                                        </span>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleFixIssue(issue, issue.chapterId)}
                                      disabled={fixingIssue}
                                      className="h-7 px-2 text-xs"
                                    >
                                      {fixingIssue && fixingIssueId === issue.id ? (
                                        <>
                                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                          修复中...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="h-3 w-3 mr-1" />
                                          一键更改
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="text-sm">{issue.description}</div>
                                  {issue.reason && (
                                    <div className="text-xs text-muted-foreground">
                                      原因：{issue.reason}
                                    </div>
                                  )}
                                  {issue.suggestion && (
                                    <div className="bg-white dark:bg-gray-800 rounded p-2">
                                      <div className="text-xs font-medium mb-1">💡 修改建议</div>
                                      <div className="text-sm">{issue.suggestion}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-green-600">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                        <div className="text-sm font-medium">未发现明显问题！</div>
                        <div className="text-xs text-muted-foreground mt-1">剧情逻辑严密，继续保持！</div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
              </div>
            </React.Fragment>
          )}
        </div>

        {/* 问题提示栏 */}
        {issues.length > 0 && (
          <div className="border-t bg-card p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">发现 {issues.length} 个问题</span>
                </div>
                {selectedIssues.size > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchFixIssues}
                    disabled={batchFixing}
                    className="h-7 px-3 text-xs"
                  >
                    {batchFixing ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        修复中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3 w-3 mr-2" />
                        批量修复 ({selectedIssues.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {/* issues.map temporarily disabled */}
                <div className="text-center text-sm text-muted-foreground py-4">
                  问题列表暂时禁用
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 右侧面板 */}
      <div className="w-96 border-l bg-card p-4 overflow-y-auto">
        {/* 标签导航 */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          <Button
            size="sm"
            variant={activeTab === 'characters' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('characters')}
            className="h-9"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'world' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('world')}
            className="h-9"
          >
            <BookMarked className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'tools' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tools')}
            className="h-9"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'tasks' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('tasks')}
            className="h-9"
          >
            <ListTodo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'analysis' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analysis')}
            className="h-9"
          >
            <BookMarked className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'analysisResult' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analysisResult')}
            className="h-9"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('import')}
            className="h-9"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* 高效模式开关 */}
        <Card className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  高效模式
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-400">
                  {performanceMode ? '已开启（优化检测频率）' : '已关闭（正常模式）'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant={performanceMode ? 'default' : 'outline'}
              onClick={() => setPerformanceMode(!performanceMode)}
              className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white border-0"
            >
              {performanceMode ? '已开启' : '开启'}
            </Button>
          </div>
          {performanceMode ? (
            <div className="mt-2 text-[10px] text-purple-600 dark:text-purple-400 space-y-1">
              <div className="font-medium">✨ 高效模式已启用，将优化以下方面：</div>
              <div className="pl-2">
                <div>• <strong>问题检测</strong>：跳过次要问题（逻辑转折、代词重复、场景转换、生僻字），专注核心质量检查</div>
                <div>• <strong>人物追踪</strong>：优化追踪频率，减少重复计算</div>
                <div>• <strong>数据保存</strong>：保存间隔从3秒延长至5秒，减少写入次数</div>
                <div>• <strong>核心保护</strong>：保留所有重要检查（华美空洞、流水账、狗血剧情、感情线、成长线、人设矛盾等）</div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-[10px] text-purple-600 dark:text-purple-400">
              <div className="font-medium">💡 高效模式介绍</div>
              <div className="pl-2">
                <div>当章节数超过100或人物数超过50时，系统会自动开启高效模式</div>
                <div>高效模式可以优化性能，同时确保核心质量检查不受影响</div>
              </div>
            </div>
          )}
        </Card>

        {/* 条件渲染，避免Tabs组件的性能问题 */}
        {activeTab === 'characters' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-3">添加人物</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr,auto] gap-2">
                  <div>
                    <Label className="text-xs">姓名</Label>
                    <Input
                      value={newCharacter.name}
                      onChange={(e) =>
                        setNewCharacter({ ...newCharacter, name: e.target.value })
                      }
                      placeholder="姓名"
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateName}
                      disabled={generatingName || !newCharacter.name}
                      className="h-8 px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                      title="根据人物属性生成更好听的名字"
                    >
                      {generatingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-1" />
                          改人名
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">年龄</Label>
                  <Input
                    value={newCharacter.age}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, age: e.target.value })
                    }
                    placeholder="年龄"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">角色定位</Label>
                  <Input
                    value={newCharacter.role}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, role: e.target.value })
                    }
                    placeholder="主角/配角/反派"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">性格特点</Label>
                  <Input
                    value={newCharacter.personality}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, personality: e.target.value })
                    }
                    placeholder="性格"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">外貌特征</Label>
                  <Input
                    value={newCharacter.appearance}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, appearance: e.target.value })
                    }
                    placeholder="外貌"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">能力特长</Label>
                  <Input
                    value={newCharacter.abilities}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, abilities: e.target.value })
                    }
                    placeholder="能力"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">背景故事</Label>
                  <Input
                    value={newCharacter.background}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, background: e.target.value })
                    }
                    placeholder="背景"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">目标与动机</Label>
                  <Input
                    value={newCharacter.goals}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, goals: e.target.value })
                    }
                    placeholder="目标"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">弱点</Label>
                  <Input
                    value={newCharacter.weaknesses}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, weaknesses: e.target.value })
                    }
                    placeholder="弱点"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">出现原因</Label>
                  <Input
                    value={newCharacter.appearanceReason || ''}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, appearanceReason: e.target.value })
                    }
                    placeholder="如：主角遇到困难时出现、反派派来的人等"
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">消失原因</Label>
                  <Input
                    value={newCharacter.disappearanceReason || ''}
                    onChange={(e) =>
                      setNewCharacter({ ...newCharacter, disappearanceReason: e.target.value })
                    }
                    placeholder="如：任务完成离开、死亡、转入暗处等"
                    className="h-8"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={addCharacter}
                  disabled={!newCharacter.name || buttonLoading['add-character']}
                  className="w-full"
                >
                  {buttonLoading['add-character'] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {buttonLoading['add-character'] ? '添加中...' : '添加人物'}
                </Button>

                {/* 批量生成角色提示 */}
                {generatedCharacters.length > 1 && (
                  <div className="mt-3 pt-3 border-t bg-muted/50 rounded p-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        已生成 {generatedCharacters.length} 个角色
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={prevGeneratedCharacter}
                          disabled={currentCharacterIndex === 0}
                          className="h-6 px-2 text-[10px]"
                        >
                          上一个
                        </Button>
                        <span className="px-2 py-1 text-muted-foreground">
                          {currentCharacterIndex + 1}/{generatedCharacters.length}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={nextGeneratedCharacter}
                          disabled={currentCharacterIndex === generatedCharacters.length - 1}
                          className="h-6 px-2 text-[10px]"
                        >
                          下一个
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">人物列表 ({characters.length})</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBatchRenameCharacters}
                  disabled={batchRenaming || characters.length === 0}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                  title="为所有人物生成新名字并更新章节引用"
                >
                  {batchRenaming ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      改名中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-3 w-3 mr-1" />
                      批量改人名
                    </>
                  )}
                </Button>
              </div>

              {/* 批量改人名进度 */}
              {batchRenaming && (
                <Card className="p-3 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-700 dark:text-purple-300">
                        {renameProgress.message}
                      </span>
                      <span className="text-purple-600 dark:text-purple-400">
                        {renameProgress.current} / {renameProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(renameProgress.current / renameProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {characters.slice(0, charactersLimit).map((character) => (
                <div key={character.id} className="flex items-start justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{character.name}</span>
                      {character.role && (
                        <Badge variant="secondary" className="text-[10px]">
                          {character.role}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                        {character.status === 'active' ? '活跃中' :
                         character.status === 'inactive' ? '不活跃' :
                         character.status === 'deceased' ? '已死亡' : '未知'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {character.age && <span>{character.age}</span>}
                      {character.personality && character.age && <span className="mx-1">·</span>}
                      {character.personality && <span>{character.personality}</span>}
                    </div>
                    {/* 人物追踪信息 */}
                    {character.chapterAppearances.length > 0 && (
                      <div className="text-xs mt-1 space-y-0.5">
                        <div className="text-blue-600 dark:text-blue-400">
                          📍 出现：{character.firstAppearanceChapterTitle} ({character.chapterAppearances.length}次)
                        </div>
                        {character.appearanceReason && (
                          <div className="text-purple-600 dark:text-purple-400">
                            💬 出现原因：{character.appearanceReason}
                          </div>
                        )}
                        {character.status !== 'active' && (
                          <div className="text-orange-600 dark:text-orange-400">
                            🔚 消失：{character.lastAppearanceChapterTitle}
                          </div>
                        )}
                        {character.disappearanceReason && (
                          <div className="text-red-600 dark:text-red-400">
                            💬 消失原因：{character.disappearanceReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharacter(character.id)}
                    className="h-6 w-6 p-0 ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {characters.length > charactersLimit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCharactersLimit(prev => Math.min(prev + 20, characters.length))}
                  className="w-full mt-2 text-xs"
                >
                  显示更多 ({characters.length - charactersLimit}/{characters.length})
                </Button>
              )}
            </div>

            {/* 人物时间线视图 */}
            {characters.some(c => c.chapterAppearances.length > 0) && (
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookMarked className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  人物时间线
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {chapters.map((chapter) => {
                    const chapterCharacters = characters.filter(c =>
                      c.chapterAppearances.includes(chapter.id)
                    );

                    if (chapterCharacters.length === 0) return null;

                    return (
                      <div key={chapter.id} className="flex gap-2">
                        <div className="flex flex-col items-center min-w-[80px]">
                          <div className="text-xs font-medium text-center mb-1">
                            {chapter.title}
                          </div>
                          <div className="w-px bg-border flex-1" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex flex-wrap gap-2">
                            {chapterCharacters.map(character => {
                              const isFirstAppearance = character.firstAppearanceChapter === chapter.id;
                              const isLastAppearance = character.lastAppearanceChapter === chapter.id;

                              return (
                                <Badge
                                  key={character.id}
                                  variant="outline"
                                  className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                                >
                                  {character.name}
                                  {isFirstAppearance && <span className="ml-1">⭐</span>}
                                  {isLastAppearance && <span className="ml-1">🔚</span>}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
                  <div>⭐ 首次出现 | 🔚 最后出现 | 蓝色 活跃中</div>
                  <div>💡 每个人物的出现和消失都应该有明确的剧情原因</div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'world' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">故事大纲</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateFromOutline}
                  disabled={aiLoading || !outline.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3 mr-1" />
                  )}
                  基于大纲重新生成
                </Button>
              </div>
              <Textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="写下你的故事大纲...（修改后可点击上方按钮重新生成章节）"
                className="min-h-[200px] resize-none text-sm"
              />
              {aiLoading && aiResult && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 rounded">
                  <p className="text-xs text-blue-700 dark:text-blue-300">{aiResult}</p>
                </div>
              )}
            </Card>

            {/* 大纲反馈与调整 */}
            <Card className="p-4 bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800">
              <div className="text-sm font-medium mb-3 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                大纲反馈与调整
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-indigo-600 dark:text-indigo-400">对当前大纲哪里不满意的原因</Label>
                  <Textarea
                    value={outlineFeedbackSettings.dissatisfactionReason}
                    onChange={(e) => setOutlineFeedbackSettings({ ...outlineFeedbackSettings, dissatisfactionReason: e.target.value })}
                    placeholder="例如：节奏太慢、情节不够紧凑、人物动机不明确、高潮不够精彩、伏笔埋得不够等"
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                    告诉AI当前大纲存在的问题，它会根据这些问题进行调整
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-indigo-600 dark:text-indigo-400">理想的大纲描述</Label>
                  <Textarea
                    value={outlineFeedbackSettings.idealOutline}
                    onChange={(e) => setOutlineFeedbackSettings({ ...outlineFeedbackSettings, idealOutline: e.target.value })}
                    placeholder="例如：希望节奏更快、增加更多悬念、让高潮部分更激烈、增加更多伏笔、人物成长更明显等"
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                    描述你希望的理想大纲是什么样的，AI会朝着这个方向调整
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleAdjustOutline}
                  disabled={aiLoading}
                  className="w-full"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  调整大纲
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-3">世界观设定</h3>
              <div className="space-y-3">
                <div>
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="格式：名称,类型,描述"
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    onClick={addWorldSetting}
                    disabled={buttonLoading['add-world-setting']}
                    className="w-full mt-2"
                  >
                    {buttonLoading['add-world-setting'] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {buttonLoading['add-world-setting'] ? '添加中...' : '添加设定'}
                  </Button>
                </div>

                <div className="space-y-2">
                  {worldSettings.map((setting) => (
                    <div key={setting.id} className="flex items-start justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium truncate">{setting.name}</span>
                          {setting.type && (
                            <Badge variant="secondary" className="text-[10px]">
                              {setting.type}
                            </Badge>
                          )}
                        </div>
                        {setting.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {setting.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setWorldSettings(worldSettings.filter(s => s.id !== setting.id))
                        }
                        className="h-6 w-6 p-0 ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 基于世界观重新生成大纲 */}
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <h3 className="font-medium mb-3 text-blue-700 dark:text-blue-300">智能大纲调整</h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                基于当前世界观设定和角色信息，重新生成或优化故事大纲
              </p>
              <Button
                size="sm"
                onClick={handleRegenerateOutlineFromWorld}
                disabled={aiLoading || (worldSettings.length === 0 && characters.length === 0)}
                className="w-full"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    基于世界观重新生成大纲
                  </>
                )}
              </Button>
              {aiLoading && aiResult && (
                <div className="mt-3 p-2 bg-white dark:bg-gray-800 rounded text-xs text-blue-600 dark:text-blue-400">
                  {aiResult}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            {/* 一键批量生成章节 */}
            <Card className="p-4 border-2 border-primary/20">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                一键批量生成章节
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs mb-1 block">生成章节数</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={batchGenerateChapterCount}
                      onChange={(e) => setBatchGenerateChapterCount(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="1-100"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">当前总章节数</Label>
                    <Input
                      value={validChapterCount}
                      disabled
                      className="h-9 bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1 block">每章字数要求</Label>
                  <Input
                    type="number"
                    min="100"
                    max="10000"
                    step="100"
                    value={chapterSettings.targetWordCountPerChapter}
                    onChange={(e) => setChapterSettings({
                      ...chapterSettings,
                      targetWordCountPerChapter: Math.max(100, parseInt(e.target.value) || 3000)
                    })}
                    className="h-9"
                  />
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                    当前设置：每章约 {chapterSettings.targetWordCountPerChapter} 字
                  </div>
                </div>

                {/* 小说总览 */}
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300">
                      📚 小说总览
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshStats}
                      disabled={refreshingStats}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                      title="刷新统计信息"
                    >
                      {refreshingStats ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Database className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">当前章节数</div>
                      <div className="font-medium">{validChapterCount} 章</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">卷数</div>
                      <div className="font-medium">{volumes.length} 卷</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">总字数</div>
                      <div className="font-medium">{chapters.reduce((sum, c) => sum + c.wordCount, 0).toLocaleString()} 字</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 text-[10px] text-blue-600 dark:text-blue-400">
                    预计生成后：{validChapterCount + batchGenerateChapterCount} 章（约 {((validChapterCount + batchGenerateChapterCount) * chapterSettings.targetWordCountPerChapter / 10000).toFixed(1)} 万字）
                  </div>
                  {refreshingStats && (
                    <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 text-[10px] text-blue-600 dark:text-blue-400 animate-pulse">
                      正在刷新统计信息...
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded">
                  ⚡ 生成后将创建 {batchGenerateChapterCount} 个新章节，每章约 {chapterSettings.targetWordCountPerChapter} 字
                </div>

                {/* 清除所有章节按钮 */}
                {chapters.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAllChapters}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清除所有章节（从IndexedDB彻底删除）
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleBatchGenerateChapters}
                  disabled={batchChapterGenerating || !outline}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {batchChapterGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {batchChapterGenerating ? '生成中...' : '⚡ 一键批量生成N章'}
                </Button>
              </div>

              {/* 批量生成进度 */}
              {batchChapterGenerating && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{batchGenerateProgress.stepName}</span>
                    <span className="font-medium">{batchGenerateProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: batchGenerateProgress.percentage + '%' }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{batchGenerateProgress.message}</p>

                  {/* 重写进度显示 */}
                  {batchRewriteProgress && batchRewriteProgress.isRewriting && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 rounded p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          AI校核中
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-white dark:bg-purple-950/50 rounded p-1.5">
                          <div className="text-muted-foreground mb-0.5">校核次数</div>
                          <div className="font-medium text-purple-700 dark:text-purple-300">
                            第 {batchRewriteProgress.currentAttempt} / {batchRewriteProgress.maxAttempts} 次
                          </div>
                        </div>
                        <div className="bg-white dark:bg-purple-950/50 rounded p-1.5">
                          <div className="text-muted-foreground mb-0.5">当前评分</div>
                          <div className="font-medium text-purple-700 dark:text-purple-300">
                            {batchRewriteProgress.currentScore > 0 ? `${batchRewriteProgress.currentScore.toFixed(1)} 分` : '检测中...'}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-purple-950/50 rounded p-1.5">
                          <div className="text-muted-foreground mb-0.5">当前扣分</div>
                          <div className={`font-medium ${batchRewriteProgress.currentPenalty < 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {batchRewriteProgress.currentPenalty > 0 ? `${batchRewriteProgress.currentPenalty.toFixed(1)} 分` : '检测中...'}
                          </div>
                        </div>
                        <div className="bg-white dark:bg-purple-950/50 rounded p-1.5">
                          <div className="text-muted-foreground mb-0.5">目标标准</div>
                          <div className="font-medium text-blue-600 dark:text-blue-400">
                            评分{'>'}80分 / 扣分{'<'}80分
                          </div>
                        </div>
                      </div>
                      {batchRewriteProgress.currentScore > 0 && (
                        <div className="mt-2 text-[10px] text-muted-foreground text-center">
                          {batchRewriteProgress.currentScore >= 80 && batchRewriteProgress.currentPenalty < 80
                            ? '✅ 质量已达标，正在完成最后处理...'
                            : '⚠️ 质量未达标，继续校核中...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 批量生成结果 */}
              {batchGenerateResult && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-primary">
                      {batchGenerateResult.qualityFailed ? '质量不达标' : '生成结果'}
                    </Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBatchGenerateResult(null)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* 质量不达标时的醒目提示 */}
                  {batchGenerateResult.qualityFailed && (
                    <div className="bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800 p-3 rounded mb-2">
                      <div className="flex items-start gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium text-red-700 dark:text-red-300 text-sm mb-1">
                            ⚠️ 质量检测未达标，内容未呈现
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                            {batchGenerateResult.qualityCheck && (
                              <>
                                <div>• 平均评分：{batchGenerateResult.qualityCheck.averageScore?.toFixed(1)}分（要求{'>'}80分）</div>
                                <div>• 平均扣分：{Math.abs(batchGenerateResult.qualityCheck.averagePenalty || 0).toFixed(1)}分（要求{'<'}80分）</div>
                              </>
                            )}
                            {batchGenerateResult.qualityCheck?.failReason && batchGenerateResult.qualityCheck.failReason.length > 0 && (
                              <div className="mt-1">
                                <div className="font-medium">失败原因：</div>
                                {batchGenerateResult.qualityCheck.failReason.map((reason: string, idx: number) => (
                                  <div key={idx}>• {reason}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 醒目的一键修改按钮 */}
                      <Button
                        size="sm"
                        onClick={handleOneClickFix}
                        disabled={batchChapterGenerating}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium"
                      >
                        {batchChapterGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            正在修复...
                          </>
                        ) : (
                          <>
                            <Wrench className="h-4 w-4 mr-2" />
                            一键修改（修复质量）
                          </>
                        )}
                      </Button>

                      <div className="text-[10px] text-muted-foreground mt-2 text-center">
                        点击按钮将自动修复所有不达标的章节，提升质量至标准以上
                      </div>

                      <div className="mt-2 bg-blue-50 dark:bg-blue-950 p-2 rounded">
                        <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>AI将自动反复校核，直到质量达标</span>
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                          系统会自动重写不达标的章节，直到评分{'>'}91分且扣分{'<'}50分
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/50 p-2 rounded text-xs space-y-1">
                    {!batchGenerateResult.qualityFailed && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>生成完成！</span>
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      • 已生成 {batchGenerateResult.chapterCount} 章内容<br/>
                      • 每章约 {chapterSettings.targetWordCountPerChapter} 字<br/>
                      • 预计总字数: {(batchGenerateResult.chapterCount * chapterSettings.targetWordCountPerChapter).toLocaleString()} 字<br/>
                      • 当前总章节数: {validChapterCount}
                    </div>

                    {/* 质量评分检查 */}
                    {batchGenerateResult.qualityCheck && (
                      <div className="pt-2 border-t mt-2">
                        {batchGenerateResult.qualityCheck.meetsThreshold ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span className="font-medium">质量检测合格</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-3 w-3" />
                            <span className="font-medium">质量检测不合格</span>
                          </div>
                        )}
                        <div className="text-muted-foreground text-[10px] mt-1">
                          • 平均评分：{batchGenerateResult.qualityCheck.averageScore?.toFixed(1)}分<br/>
                          • 平均扣分：{Math.abs(batchGenerateResult.qualityCheck.averagePenalty || 0).toFixed(1)}分<br/>
                          • 质量要求：评分{'>'}80分，扣分{'<'}80分
                        </div>
                      </div>
                    )}

                    {/* 字数检查结果 */}
                    {(() => {
                      // 检查字数不足的章节
                      const chaptersBelowTarget = chapters.filter((c: any) =>
                        c.wordCount && c.wordCount < chapterSettings.targetWordCountPerChapter
                      );

                      return chaptersBelowTarget.length > 0 && (
                        <div className="pt-2 border-t mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-medium">
                              {chaptersBelowTarget.length} 章字数未达标（{chapterSettings.targetWordCountPerChapter}字）
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[10px]">
                            部分章节生成后尝试补充但仍未达到目标字数，建议手动扩展或重新生成
                          </div>
                          {chaptersBelowTarget.slice(0, 3).map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>{c.title}</span>
                              <span className="text-orange-600 font-medium">
                                {c.wordCount}字 (缺{chapterSettings.targetWordCountPerChapter - c.wordCount}字)
                              </span>
                            </div>
                          ))}
                          {chaptersBelowTarget.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">
                              ... 还有 {chaptersBelowTarget.length - 3} 章
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 自动修复结果 */}
                    {batchGenerateResult.autoFix && batchGenerateResult.autoFix.success > 0 && (
                      <div className="pt-2 border-t mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Wrench className="h-3 w-3" />
                          <span className="font-medium">自动修复了 {batchGenerateResult.autoFix.success} 章</span>
                        </div>
                        {batchGenerateResult.autoFix.failed > 0 && (
                          <div className="text-muted-foreground text-[10px]">
                            • 修复失败: {batchGenerateResult.autoFix.failed} 章
                          </div>
                        )}
                        {batchGenerateResult.autoFix.fixedChapters && batchGenerateResult.autoFix.fixedChapters.length > 0 && (
                          <div className="text-muted-foreground text-[10px]">
                            修复章节：{batchGenerateResult.autoFix.fixedChapters.slice(0, 3).join('、')}
                            {batchGenerateResult.autoFix.fixedChapters.length > 3 && ` 等${batchGenerateResult.autoFix.fixedChapters.length}章`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 惩罚检测结果 */}
                    {/* 惩罚检测结果和问题检测结果不显示给用户，内部检测使用 */}
                    <div className="pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('[调试] 当前章节列表:', chapters);
                          alert(`当前章节总数: ${chapters.length}\n最近5章:\n${chapters.slice(-5).map(c => `${c.title}: ${c.wordCount}字`).join('\n')}`);
                        }}
                        className="w-full text-[10px]"
                      >
                        查看章节列表详情
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-medium mb-4">创作辅助工具</h3>
              <div className="space-y-4">
                <div className="pb-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">生成大纲</Label>
                    <Badge variant="secondary" className="text-[10px]">
                      目标章节数：{chapterSettings.targetChapterCount}
                    </Badge>
                  </div>
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="格式：类型,主题,主角"
                    className="h-8 mb-2"
                  />
                  <div className="text-[10px] text-muted-foreground mb-2">
                    💡 大纲生成会根据"章节设置"和"写作反馈"进行调整
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleToolGenerate('outline')}
                    disabled={aiLoading}
                    className="w-full"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    生成大纲
                  </Button>
                </div>

                <div className="pb-3 border-b">
                  <Label className="text-xs mb-2 block">生成角色</Label>
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="格式：角色定位,性格,背景"
                    className="h-8 mb-2"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleToolGenerate('character')}
                    disabled={aiLoading}
                    className="w-full"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    生成角色
                  </Button>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">优化对白</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="输入需要优化的对白"
                    className="min-h-[80px] resize-none text-sm mb-2"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleToolGenerate('dialogue')}
                    disabled={aiLoading}
                    className="w-full"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    优化对白
                  </Button>
                </div>
              </div>
            </Card>

            {aiResult && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-primary">
                    生成结果
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setAiResult('')}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Textarea
                  value={aiResult}
                  onChange={(e) => setAiResult(e.target.value)}
                  className="min-h-[150px] resize-none text-sm leading-relaxed"
                />
              </Card>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* 任务队列 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">生成任务队列</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchTasks}
                  disabled={refreshingTasks}
                >
                  {refreshingTasks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">暂无任务</p>
                  <p className="text-xs mt-1">使用"一键自动生成"创建新任务</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {tasks.map((task) => (
                    <Card key={task.id} className="p-3 border-2">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{task.name}</h4>
                            <Badge variant="outline" className={
                              'text-[10px] ' +
                              (task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              task.status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              task.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                              task.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              'bg-gray-50 text-gray-700 border-gray-200')
                            }>
                              {task.status === 'pending' && '等待中'}
                              {task.status === 'processing' && '进行中'}
                              {task.status === 'completed' && '已完成'}
                              {task.status === 'failed' && '失败'}
                              {task.status === 'paused' && '已暂停'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {task.progress.message}
                          </p>
                        </div>
                        {task.status === 'processing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        )}
                      </div>

                      {/* 进度条 */}
                      {task.status !== 'failed' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>
                              {task.progress.currentChapter && task.progress.totalChapters
                                ? '第' + task.progress.currentChapter + '/' + task.progress.totalChapters + '章'
                                : '准备中...'
                              }
                            </span>
                            <span>{task.progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: task.progress.percentage + '%' }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2">
                        {task.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePauseTask(task.id)}
                            className="h-7 px-2 text-[10px]"
                          >
                            暂停
                          </Button>
                        )}
                        {task.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResumeTask(task.id)}
                            className="h-7 px-2 text-[10px]"
                          >
                            恢复
                          </Button>
                        )}
                        {task.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleApplyTaskResult(task.id)}
                            className="h-7 px-2 text-[10px]"
                          >
                            应用结果
                          </Button>
                        )}
                        {(task.status === 'completed' || task.status === 'failed' || task.status === 'paused') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task.id)}
                            className="h-7 px-2 text-[10px] text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      {/* 错误信息 */}
                      {task.status === 'failed' && task.error && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-700 dark:text-red-300">{task.error}</p>
                        </div>
                      )}

                      {/* 任务详情 */}
                      {task.status === 'completed' && task.result && (
                        <div className="mt-3 pt-3 border-t space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">章节总数</span>
                            <span className="font-medium">{task.result.chapters?.length || 0}章</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">角色数量</span>
                            <span className="font-medium">{task.result.characters?.length || 0}个</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">世界观</span>
                            <span className="font-medium">{task.result.worldSettings?.length || 0}条</span>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* 使用说明 */}
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">使用说明</h4>
              <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                <div>• 点击"一键自动生成"创建后台生成任务</div>
                <div>• 任务在后台执行，支持长时间运行（1000章+）</div>
                <div>• 每章自动生成3000+字完整内容</div>
                <div>• 支持暂停/恢复，断点续传</div>
                <div>• 生成完成后点击"应用结果"导入到编辑器</div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950">
              <div className="text-sm font-medium mb-3 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                拆书分析
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                上传参考小说文件（支持1000章长篇小说），AI会提取世界观、人物、剧情等创作元素，
                并进行创意改写，避免直接抄袭。分析完成后会自动校核是否有遗漏点。
              </div>

              {/* 显示已保存数据的按钮 */}
              {analysisResult ? (
                <Button
                  onClick={() => {
                    const savedData = localStorage.getItem('novel-editor-data');
                    if (savedData) {
                      const data = JSON.parse(savedData);
                      console.log('已保存的拆书分析数据:', data.analysisResult);
                      alert(`已找到 ${data.uploadedFileName || '未命名'} 的分析结果！\n\n请查看浏览器控制台（F12）获取完整数据。\n\n点击确定后，数据将自动恢复到页面。`);
                      setAnalysisResult(data.analysisResult);
                      setUploadedFileName(data.uploadedFileName || '');
                      setPartialResults(data.partialResults || []);
                    } else {
                      alert('未找到已保存的数据');
                    }
                  }}
                  variant="outline"
                  className="w-full mb-3 text-xs border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  发现已保存的分析结果，点击恢复
                </Button>
              ) : (
                /* 数据丢失提示和检查工具 */
                <Card className="p-3 mb-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="text-xs text-red-700 dark:text-red-300">
                    <div className="font-medium mb-2">⚠️ 未检测到已保存的拆书分析数据</div>
                    <Button
                      onClick={() => {
                        const savedData = localStorage.getItem('novel-editor-data');
                        const result = savedData ? JSON.parse(savedData) : null;

                        if (result) {
                          const hasAnalysis = !!result.analysisResult;
                          const hasFileName = !!result.uploadedFileName;
                          const hasPartial = result.partialResults?.length > 0;

                          let message = 'localStorage 数据检查结果：\n\n';
                          message += `📁 文件名: ${hasFileName ? result.uploadedFileName : '无'}\n`;
                          message += `📊 分析结果: ${hasAnalysis ? '存在' : '不存在'}\n`;
                          message += `📝 部分结果: ${hasPartial ? result.partialResults.length + '条' : '无'}\n`;
                          message += `💾 数据大小: ${savedData?.length || 0} 字节\n\n`;

                          if (hasAnalysis) {
                            message += '✅ 数据完好，点击"恢复"按钮加载\n';
                          } else {
                            message += '❌ 分析结果数据已丢失\n\n';
                            message += '可能原因：\n';
                            message += '1. 浏览器缓存被清空\n';
                            message += '2. 使用了隐私/无痕模式\n';
                            message += '3. 存储空间已满\n\n';
                            message += '建议：重新上传文件进行分析';
                          }

                          alert(message);
                          console.log('完整数据:', result);

                          if (hasAnalysis) {
                            if (confirm('是否要立即恢复数据？')) {
                              setAnalysisResult(result.analysisResult);
                              setUploadedFileName(result.uploadedFileName || '');
                              setPartialResults(result.partialResults || []);
                            }
                          }
                        } else {
                          alert('❌ localStorage 中没有任何数据\n\n请重新上传文件进行分析');
                        }
                      }}
                      variant="outline"
                      className="w-full text-xs border-red-400 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      检查并尝试恢复数据
                    </Button>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {/* 文件上传区域 */}
                <div>
                  <Label className="text-xs text-amber-600 dark:text-amber-400">上传小说文件</Label>
                  <div className="mt-2">
                    {/* 没有上传文件时显示上传区域 */}
                    {!uploadedFileName && !analysisResult ? (
                      <div className="border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-lg p-6 text-center">
                        <Input
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          disabled={uploadingFile || analyzingBook}
                          className="hidden"
                          id="file-upload"
                        />
                        <Label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <BookMarked className="h-10 w-10 text-amber-600 dark:text-amber-400 mb-2" />
                          <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {uploadingFile ? '读取中...' : '点击上传小说文件'}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            支持 .txt 格式，最大 50MB
                          </div>
                        </Label>
                      </div>
                    ) : (
                      /* 有上传文件时显示文件信息和操作选项 */
                      <div className="space-y-2">
                        {/* 当前文件信息 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {uploadingFile ? (
                                <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                              ) : (
                                <BookMarked className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {uploadedFileName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {uploadingFile ? (
                                    <span className="text-blue-600 dark:text-blue-400">正在读取文件...</span>
                                  ) : bookContentToAnalyze.length > 0 ? (
                                    `${bookContentToAnalyze.length.toLocaleString()} 字符`
                                  ) : analysisResult ? (
                                    '文件内容未保存，但分析结果已保存'
                                  ) : partialResults.length > 0 ? (
                                    '文件内容未保存，但有部分分析结果'
                                  ) : (
                                    '读取完成，准备分析'
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={clearFile}
                              disabled={analyzingBook || uploadingFile}
                              className="h-7 w-7 p-0"
                              title="删除文件"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* 分析中断时，显示重新上传选项 */}
                        {partialResults.length > 0 && !analysisResult && !analyzingBook && (
                          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium mb-1">分析已中断</div>
                                <div className="mb-2">已完成 {partialResults.length} 部分的分析</div>
                                <div className="flex gap-2">
                                  {bookContentToAnalyze.trim() ? (
                                    <span className="text-green-600 dark:text-green-400">✓ 文件内容存在，可继续分析</span>
                                  ) : (
                                    <>
                                      <span className="text-orange-600 dark:text-orange-400">⚠️ 文件内容已清空，无法继续分析</span>
                                      <div className="mt-2">
                                        <Input
                                          type="file"
                                          accept=".txt"
                                          onChange={handleFileUpload}
                                          disabled={uploadingFile}
                                          className="hidden"
                                          id="file-reupload"
                                        />
                                        <Label
                                          htmlFor="file-reupload"
                                          className="cursor-pointer inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white px-2 py-1 rounded text-xs"
                                        >
                                          <BookMarked className="h-3 w-3" />
                                          重新上传同一文件以继续分析
                                        </Label>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 或者手动输入 */}
                {!uploadedFileName && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">或者</span>
                    </div>
                  </div>
                )}

                {!uploadedFileName && (
                  <div>
                    <Label className="text-xs text-amber-600 dark:text-amber-400">直接粘贴内容</Label>
                    <Textarea
                      value={bookContentToAnalyze}
                      onChange={(e) => setBookContentToAnalyze(e.target.value)}
                      placeholder="粘贴参考小说的完整内容..."
                      className="min-h-[150px] resize-none text-sm mt-2"
                    />
                  </div>
                )}

                {/* 智能分析按钮 - 自动判断首次分析或继续分析 */}
                <Button
                  size="sm"
                  onClick={() => {
                    // 如果有未完成的分析（有部分结果且无完整结果）且文件内容存在，则继续分析
                    const shouldContinue: boolean = partialResults.length > 0 && !analysisResult && bookContentToAnalyze.trim().length > 0;
                    handleAnalyzeBook(shouldContinue);
                  }}
                  disabled={
                    analyzingBook ||
                    uploadingFile ||
                    (!bookContentToAnalyze.trim() && !analysisResult) ||
                    // 如果有部分结果但文件内容为空，禁用按钮（提示用户重新上传）
                    (partialResults.length > 0 && !analysisResult && !bookContentToAnalyze.trim())
                  }
                  className="w-full"
                  variant={
                    // 如果有未完成的分析且文件内容存在，使用绿色主题突出显示
                    partialResults.length > 0 && !analysisResult && !analyzingBook && !uploadingFile && bookContentToAnalyze.trim()
                      ? 'default'
                      : 'default'
                  }
                  style={
                    // 如果有未完成的分析且文件内容存在，使用绿色样式
                    partialResults.length > 0 && !analysisResult && !analyzingBook && !uploadingFile && bookContentToAnalyze.trim()
                      ? { backgroundColor: '#22c55e', color: 'white' }
                      : undefined
                  }
                >
                  {analyzingBook ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : uploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      正在读取文件...
                    </>
                  ) : partialResults.length > 0 && !analysisResult && !bookContentToAnalyze.trim() ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      请重新上传文件以继续分析
                    </>
                  ) : partialResults.length > 0 && !analysisResult && bookContentToAnalyze.trim() ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      继续分析（已完成 {partialResults.length} 部分）
                    </>
                  ) : analysisResult ? (
                    bookContentToAnalyze.trim() ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        重新分析（含校核）
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        重新分析（需先上传文件）
                      </>
                    )
                  ) : bookContentToAnalyze.trim() ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      开始分析（含校核）
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 opacity-50" />
                      请先上传文件或粘贴内容
                    </>
                  )}
                </Button>

                {/* 文件正在读取时的进度提示 */}
                {uploadingFile && uploadedFileName && (
                  <div className="bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        <div className="font-medium mb-1">正在读取文件...</div>
                        <div>文件名：{uploadedFileName}</div>
                        <div className="text-blue-600 dark:text-blue-400 mt-1">
                          大文件读取可能需要几秒钟，请稍候
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 分析按钮被禁用时的原因提示 */}
                {!analyzingBook && !uploadingFile && !bookContentToAnalyze.trim() && !analysisResult && (
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 rounded-lg p-3 mt-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-700 dark:text-amber-300">
                        <div className="font-medium mb-1">无法开始分析</div>
                        <div>请先上传小说文件（.txt格式）或直接粘贴小说内容</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 分析结果已保存时的提示 */}
                {analysisResult && !bookContentToAnalyze.trim() && !analyzingBook && (
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    💡 提示：查看右侧的实时分析结果，或重新上传文件进行新的分析
                  </div>
                )}
              </div>
            </Card>

            {/* 独立的删除管理卡片 */}
            {(uploadedFileName || bookContentToAnalyze.trim() || analysisResult) && (
              <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">
                    管理已上传内容
                  </div>
                </div>
                <div className="space-y-3">
                  {/* 当前状态显示 */}
                  <div className="text-sm text-red-600 dark:text-red-400 space-y-1 bg-white dark:bg-gray-800 rounded p-3">
                    <div className="font-medium mb-2">当前状态：</div>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {uploadedFileName && <li>文件：{uploadedFileName}</li>}
                      {bookContentToAnalyze.trim() && <li>内容：{bookContentToAnalyze.length.toLocaleString()} 字符</li>}
                      {analysisResult && <li>分析结果：已保存</li>}
                      {!uploadedFileName && !bookContentToAnalyze.trim() && !analysisResult && <li>无内容</li>}
                    </ul>
                  </div>
                  {/* 删除按钮组 */}
                  <div className="flex flex-col gap-2">
                    {bookContentToAnalyze.trim() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearFileContent}
                        disabled={analyzingBook || uploadingFile}
                        className="w-full h-9 text-sm border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        清除文件内容
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearAll}
                      disabled={analyzingBook || uploadingFile}
                      className="w-full h-9 text-sm border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      清除所有
                    </Button>
                    {analysisResult && (
                      <div className="text-xs text-center text-red-600 dark:text-red-400 mt-1">
                        提示：可在"分析结果"标签中查看和放弃分析结果
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* 分析进度 */}
            {analyzingBook && analyzeProgress.step && (
              <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {analyzeProgress.step}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: analyzeProgress.percentage + '%' }}
                    />
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {analyzeProgress.message}
                  </div>
                </div>
              </Card>
            )}

            {/* 分析完成提示 */}
            {analysisResult && !analyzingBook && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-4 border-blue-400 dark:from-blue-950 dark:to-cyan-950 dark:border-blue-600 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-bold text-lg text-blue-700 dark:text-blue-300 mb-2">
                      ✨ 分析完成！
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                      分析结果已自动保存。点击下方按钮在"更改导入"标签中修改世界观、人物、剧情等内容，然后导入到大纲。
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-950 p-2 rounded">
                      ⚠️ 重要：必须先修改分析结果才能用于创作，禁止直接抄袭！
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // 初始化导入数据
                    setImportData({
                      worldview: formatWorldview(analysisResult.worldview),
                      characters: analysisResult.characters || [],
                      plotStructure: formatDisplayText(analysisResult.plotStructure),
                      writingStyle: formatDisplayText(analysisResult.writingStyle),
                      coreTheme: formatDisplayText(analysisResult.coreTheme),
                      suggestions: formatDisplayText(analysisResult.suggestions),
                    });
                    // 切换到"更改导入"标签
                    setActiveTab('import');
                  }}
                  className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold shadow-lg"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  🔥 立即修改并导入到大纲
                </Button>
                <div className="text-xs text-center text-blue-600 dark:text-blue-400 mt-2">
                  ↑ 点击上方蓝色大按钮，在"更改导入"标签中修改内容
                </div>
              </Card>
            )}

            {/* 使用说明 */}
            {!analysisResult && (
              <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                <h4 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">使用说明</h4>
                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <div>• 选择一本你喜欢的同类小说作为参考</div>
                  <div>• 支持超大文件上传（1000章+，300万字，最大50MB）</div>
                  <div>• 大文件自动分块处理，智能合并分析结果</div>
                  <div>• AI会提取世界观、人物、剧情等关键元素</div>
                  <div>• 分析完成后会自动校核是否有遗漏点</div>
                  <div>• 分析完成后，点击蓝色大按钮切换到"更改导入"标签</div>
                  <div className="font-bold mt-2 text-amber-600 dark:text-amber-400">⚠️ 重要流程：</div>
                  <div>1. 分析完成后，点击蓝色大按钮切换到"更改导入"标签</div>
                  <div>2. 在"更改导入"标签中修改世界观设定，确保与原书不雷同</div>
                  <div>3. 修改角色名称、背景、能力，避免抄袭</div>
                  <div>4. 调整剧情结构，创造独特的故事</div>
                  <div>5. 点击"确认导入到大纲"，完成创作准备</div>
                  <div>• 分析结果会自动保存，刷新或重新打开页面后可继续查看</div>
                  <div className="font-bold mt-2 text-red-600 dark:text-red-400">⚠️ 注意：这是参考学习，禁止直接抄袭原作！必须修改后才能用于创作！</div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analysisResult' && (
          <div className="space-y-4">
            {/* 分析完成后的重要提示（放在最前面） */}
            {analysisResult && partialResults.length === 0 && !analyzingBook && (
              <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-4 border-orange-400 dark:from-orange-950 dark:to-yellow-950 dark:border-orange-600">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-orange-700 dark:text-orange-300 mb-2">
                      ⚠️ 第一步：必须修改分析结果
                    </h4>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                      分析结果仅供参考学习，不能直接用于创作。你需要修改以下内容：
                    </p>
                    <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1 mb-4 list-disc list-inside">
                      <li>修改世界观设定，确保与原书不雷同</li>
                      <li>修改角色名称、背景、能力，避免抄袭</li>
                      <li>调整剧情结构，创造独特的故事</li>
                      <li>调整核心主题，体现你的创作理念</li>
                    </ul>
                    <Button
                      onClick={() => {
                        // 初始化导入数据
                        setImportData({
                          worldview: formatWorldview(analysisResult.worldview),
                          characters: analysisResult.characters || [],
                          plotStructure: formatDisplayText(analysisResult.plotStructure),
                          writingStyle: formatDisplayText(analysisResult.writingStyle),
                          coreTheme: formatDisplayText(analysisResult.coreTheme),
                          suggestions: formatDisplayText(analysisResult.suggestions),
                        });
                        // 切换到"更改导入"标签
                        setActiveTab('import');
                      }}
                      className="w-full h-14 text-base bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold shadow-lg"
                    >
                      <Edit className="h-5 w-5 mr-2" />
                      ✏️ 点击这里打开修改面板
                    </Button>
                    <div className="text-xs text-center text-orange-600 dark:text-orange-400 mt-2 font-medium">
                      ↑ 点击橙色大按钮，在"更改导入"标签中修改内容
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* 结果展示区 */}
            {(partialResults.length > 0 || analysisResult) && (
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {analyzingBook ? '实时分析结果' : '分析结果'}
                  </div>
                  <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300">
                    {partialResults.length > 0 ? `${partialResults.length} 部分` : '完整'}
                  </Badge>
                </div>

                {/* 实时部分结果列表 */}
                {partialResults.length > 0 && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {partialResults.map((result, index) => (
                      <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            第 {result.partIndex + 1}/{result.totalParts} 部分
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </div>
                        </div>

                        {/* Worldview */}
                        {result.data.worldview && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">世界观</h5>
                            <p className="text-xs text-muted-foreground line-clamp-3">{formatWorldview(result.data.worldview)}</p>
                          </div>
                        )}

                        {/* Characters */}
                        {result.data.characters && result.data.characters.length > 0 && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">人物</h5>
                            <div className="space-y-1">
                              {result.data.characters.map((char: any, charIndex: number) => (
                                <div key={charIndex} className="text-xs border-l-2 border-purple-300 pl-2">
                                  <span className="font-medium">{formatDisplayText(char.name)}</span>
                                  {char.role && <span className="text-muted-foreground ml-1">· {formatDisplayText(char.role)}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Plot */}
                        {result.data.plotStructure && (
                          <div className="mb-2">
                            <h5 className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">剧情</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2">{formatDisplayText(result.data.plotStructure)}</p>
                          </div>
                        )}

                        {/* Writing Style */}
                        {result.data.writingStyle && (
                          <div>
                            <h5 className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">写作风格</h5>
                            <p className="text-xs text-muted-foreground line-clamp-2">{formatDisplayText(result.data.writingStyle)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 完整结果（分析完成后显示） */}
                {analysisResult && partialResults.length === 0 && (
                  <div className="space-y-3">
                    {/* Worldview */}
                    {analysisResult.worldview && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                          <BookMarked className="h-3 w-3" />
                          世界观（改写）
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {formatWorldview(analysisResult.worldview)}
                        </p>
                      </div>
                    )}

                    {/* Characters */}
                    {analysisResult.characters && analysisResult.characters.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          人物（改写）
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.characters.map((char: any, index: number) => (
                            <div key={index} className="border-l-2 border-purple-300 pl-2">
                              <div className="text-sm font-medium">{formatDisplayText(char.name)}</div>
                              {char.role && (
                                <div className="text-xs text-muted-foreground">
                                  定位：{formatDisplayText(char.role)}
                                </div>
                              )}
                              {char.personality && (
                                <div className="text-xs text-muted-foreground">
                                  性格：{formatDisplayText(char.personality)}
                                </div>
                              )}
                              {char.background && (
                                <div className="text-xs text-muted-foreground">
                                  背景：{formatDisplayText(char.background)}
                                </div>
                              )}
                              {char.ability && (
                                <div className="text-xs text-muted-foreground">
                                  能力：{formatDisplayText(char.ability)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Plot Structure */}
                    {analysisResult.plotStructure && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-orange-700 dark:text-orange-300 flex items-center gap-2">
                          <ListTodo className="h-3 w-3" />
                          剧情结构（改写）
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {formatDisplayText(analysisResult.plotStructure)}
                        </p>
                      </div>
                    )}

                    {/* Writing Style */}
                    {analysisResult.writingStyle && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-green-700 dark:text-green-300 flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          写作风格
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDisplayText(analysisResult.writingStyle)}
                        </p>
                      </div>
                    )}

                    {/* Core Theme */}
                    {analysisResult.coreTheme && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          核心主题
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDisplayText(analysisResult.coreTheme)}
                        </p>
                      </div>
                    )}

                    {/* Suggestions */}
                    {analysisResult.suggestions && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-teal-700 dark:text-teal-300 flex items-center gap-2">
                          <Wand2 className="h-3 w-3" />
                          创作建议
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {formatDisplayText(analysisResult.suggestions)}
                        </p>
                      </div>
                    )}

                    {/* Verification */}
                    {analysisResult.verification && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <h4 className="text-xs font-medium mb-2 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          遗漏点校核
                        </h4>
                        <div className="space-y-2">
                          {/* Missing Elements */}
                          {analysisResult.verification.missingElements && analysisResult.verification.missingElements.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-950 rounded p-2">
                              <div className="text-xs font-medium mb-1 text-red-700 dark:text-red-300">
                                发现遗漏点
                              </div>
                              <ul className="space-y-1">
                                {analysisResult.verification.missingElements.map((item: any, index: number) => (
                                  <li key={index} className="text-xs text-red-600 dark:text-red-400">
                                    <span className="font-medium">{formatDisplayText(item.category)}：</span>
                                    {formatDisplayText(item.description)}
                                    {item.importance && (
                                      <span className="ml-1">（{formatDisplayText(item.importance)}重要）</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Supplement Suggestions */}
                          {analysisResult.verification.supplement && (
                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                              <div className="text-xs font-medium mb-1 text-blue-700 dark:text-blue-300">
                                补充建议
                              </div>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {formatDisplayText(analysisResult.verification.supplement)}
                              </p>
                            </div>
                          )}

                          {/* Verification Passed */}
                          {!analysisResult.verification.hasMissingElements && (
                            <div className="text-center py-2">
                              <div className="text-sm text-green-600 dark:text-green-400">
                                未发现遗漏点，可以使用
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAnalysisResult(null)}
                        className="flex-1 h-8 text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                      >
                        放弃
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyAnalysisResult}
                        className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        直接应用（不修改）
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 空状态提示 */}
            {partialResults.length === 0 && !analysisResult && (
              <Card className="p-6 bg-gray-50 dark:bg-gray-900 border-dashed border-2 border-gray-300 dark:border-gray-700">
                <div className="text-center">
                  <Sparkles className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    等待分析
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    请先在"拆书分析"标签中上传文件或粘贴内容并开始分析，分析结果将实时显示在这里
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4">
            {!analysisResult ? (
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-4 border-purple-300 dark:border-purple-700">
                <div className="text-center">
                  <Edit className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mb-2">
                    更改导入
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                    请先在"拆书分析"标签中分析一本书，然后在这里修改分析结果并导入到大纲
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
                      使用流程：
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                      <div>1️⃣ 在"拆书分析"标签中上传小说文件并开始分析</div>
                      <div>2️⃣ 等待分析完成，查看分析结果</div>
                      <div>3️⃣ 点击蓝色大按钮切换到"更改导入"标签</div>
                      <div>4️⃣ 点击紫色"一键智能改写"按钮，AI自动生成原创内容</div>
                      <div>5️⃣ 手动调整改写后的内容，确保符合创作需求</div>
                      <div>6️⃣ 点击"确认导入到大纲"，填充到各个模块</div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-4 border-purple-500 dark:from-purple-950 dark:to-pink-950 dark:border-purple-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Edit className="h-6 w-6" />
                    ✏️ 修改分析结果（第二步）
                  </div>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => setActiveTab('analysisResult')}
                    className="h-10 w-10 p-0 text-xl"
                  >
                    ×
                  </Button>
                </div>

                {/* 手动填充按钮 */}
                {(!importData.worldview && (!importData.characters || importData.characters.length === 0)) && (
                  <Card className="p-4 mb-6 bg-blue-50 border-2 border-blue-400 dark:bg-blue-950 dark:border-blue-700">
                    <div className="text-center">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        还没有数据？点击下方按钮从分析结果填充
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (analysisResult) {
                            try {
                              setImportData({
                                worldview: typeof analysisResult.worldview === 'string' ? analysisResult.worldview : '',
                                characters: Array.isArray(analysisResult.characters) ? analysisResult.characters : [],
                                plotStructure: typeof analysisResult.plotStructure === 'string' ? analysisResult.plotStructure : '',
                                writingStyle: typeof analysisResult.writingStyle === 'string' ? analysisResult.writingStyle : '',
                                coreTheme: typeof analysisResult.coreTheme === 'string' ? analysisResult.coreTheme : '',
                                suggestions: typeof analysisResult.suggestions === 'string' ? analysisResult.suggestions : '',
                              });
                              alert('✅ 数据填充成功！现在可以编辑和改写这些内容了。');
                            } catch (error) {
                              console.error('[手动填充] 填充数据时出错:', error);
                              alert('❌ 数据填充失败，请检查分析结果是否正确。');
                            }
                          } else {
                            alert('❌ 没有可用的分析结果，请先完成拆书分析。');
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        从分析结果填充数据
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 改写要求与改进模块 */}
                <Card className="p-4 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 dark:from-amber-950 dark:to-orange-950 dark:border-amber-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                      🎯 改写要求与改进
                    </div>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                    在改写前填写以下信息，让AI更准确地改写内容，生成更符合您期望的原创内容
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-amber-700 dark:text-amber-300">不满意的原因</Label>
                      <Textarea
                        value={rewriteFeedbackSettings.dissatisfactionReason}
                        onChange={(e) => setRewriteFeedbackSettings({ ...rewriteFeedbackSettings, dissatisfactionReason: e.target.value })}
                        placeholder="例如：原作世界观过于庞大复杂，希望简化为更易于理解的设定"
                        className="min-h-[60px] mt-1 text-xs border-amber-200 dark:border-amber-800"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-amber-700 dark:text-amber-300">理想的改写方向</Label>
                      <Textarea
                        value={rewriteFeedbackSettings.idealRewrite}
                        onChange={(e) => setRewriteFeedbackSettings({ ...rewriteFeedbackSettings, idealRewrite: e.target.value })}
                        placeholder="例如：希望世界观更偏向东方玄幻，加入修仙元素，背景设置在古代仙侠世界"
                        className="min-h-[60px] mt-1 text-xs border-amber-200 dark:border-amber-800"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-amber-700 dark:text-amber-300">具体需要修改的内容</Label>
                      <Textarea
                        value={rewriteFeedbackSettings.specificChanges}
                        onChange={(e) => setRewriteFeedbackSettings({ ...rewriteFeedbackSettings, specificChanges: e.target.value })}
                        placeholder="例如：将科技元素改为魔法元素，删除所有机器设定，增加门派、灵气、修炼体系等概念"
                        className="min-h-[60px] mt-1 text-xs border-amber-200 dark:border-amber-800"
                      />
                    </div>
                  </div>
                </Card>

                {/* AI智能改写按钮区域 */}
                <Card className="p-4 mb-6 bg-gradient-to-r from-violet-500 to-purple-600 border-2 border-violet-400 dark:from-violet-700 dark:to-purple-800 dark:border-violet-600">
                  <div className="text-center">
                    <div className="text-sm font-medium text-white mb-3">
                      ✨ AI智能改写 - 分步生成原创内容
                    </div>
                    <div className="text-xs text-white/80 mb-4">
                      点击下方按钮分别改写不同部分，确保每部分都完整处理，避免token超限
                    </div>

                    {/* 5个改写按钮 */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      <Button
                        onClick={handleRewriteWorldview}
                        disabled={rewriting.worldview}
                        className="h-12 text-xs bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-md flex flex-col items-center justify-center py-2"
                      >
                        {rewriting.worldview ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mb-1" />
                            <span className="scale-90">改写中...</span>
                          </>
                        ) : (
                          <>
                            <BookMarked className="h-4 w-4 mb-1" />
                            <span className="scale-90">世界观</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleRewriteCharacters}
                        disabled={rewriting.characters}
                        className="h-12 text-xs bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-md flex flex-col items-center justify-center py-2"
                      >
                        {rewriting.characters ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mb-1" />
                            <span className="scale-90">改写中...</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mb-1" />
                            <span className="scale-90">人物</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleRewritePlot}
                        disabled={rewriting.plot}
                        className="h-12 text-xs bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-md flex flex-col items-center justify-center py-2"
                      >
                        {rewriting.plot ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mb-1" />
                            <span className="scale-90">改写中...</span>
                          </>
                        ) : (
                          <>
                            <BookMarked className="h-4 w-4 mb-1" />
                            <span className="scale-90">剧情</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleRewriteStyle}
                        disabled={rewriting.style}
                        className="h-12 text-xs bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-md flex flex-col items-center justify-center py-2"
                      >
                        {rewriting.style ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mb-1" />
                            <span className="scale-90">改写中...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mb-1" />
                            <span className="scale-90">风格</span>
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleRewriteTheme}
                        disabled={rewriting.theme}
                        className="h-12 text-xs bg-white hover:bg-gray-100 text-purple-700 font-bold shadow-md flex flex-col items-center justify-center py-2"
                      >
                        {rewriting.theme ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mb-1" />
                            <span className="scale-90">改写中...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mb-1" />
                            <span className="scale-90">主题</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 进度显示 */}
                    {Object.keys(rewriteProgress).map(key => (
                      rewriteProgress[key] && (
                        <div key={key} className="mt-2 text-xs text-white/90 bg-white/10 rounded p-2">
                          {rewriteProgress[key]}
                        </div>
                      )
                    ))}
                  </div>
                </Card>

                {/* 一键更改内容导入按钮 */}
                <Card className="p-6 mb-6 bg-gradient-to-r from-emerald-500 to-teal-600 border-4 border-emerald-400 dark:from-emerald-700 dark:to-teal-800 dark:border-emerald-600 shadow-2xl">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white mb-3 flex items-center justify-center gap-2">
                      <Sparkles className="h-6 w-6" />
                      🎯 一键更改内容导入
                    </div>
                    <div className="text-sm text-white/90 mb-4">
                      将改写后的世界观、人物、剧情等内容一键导入到创作模块
                    </div>
                    <Button
                      onClick={() => {
                        // 检查是否完成了改写
                        const completedParts = [];
                        const incompleteParts = [];

                        if (rewriteCompleted.worldview) completedParts.push('世界观');
                        else incompleteParts.push('世界观');

                        if (rewriteCompleted.characters) completedParts.push('人物');
                        else incompleteParts.push('人物');

                        if (rewriteCompleted.plot) completedParts.push('剧情');
                        else incompleteParts.push('剧情');

                        if (rewriteCompleted.style) completedParts.push('风格');
                        else incompleteParts.push('风格');

                        if (rewriteCompleted.theme) completedParts.push('主题');
                        else incompleteParts.push('主题');

                        // 如果有未改写的部分，给出警告
                        if (incompleteParts.length > 0) {
                          const message = `⚠️ 重要警告：必须先完成AI改写才能导入！\n\n`;
                          const partsList = incompleteParts.map(p => `• ${p}`).join('\n');
                          const warning = `${message}以下部分尚未改写：\n${partsList}\n\n`;
                          const explanation = `为什么必须改写？\n`;
                          const reasons = [
                            `• 直接导入原作内容属于抄袭行为`,
                            `• 改写能创造独特的原创内容`,
                            `• 避免版权纠纷和雷同问题`
                          ].join('\n');
                          const suggestion = `\n\n请点击上方改写按钮完成所有部分后再导入。`;

                          alert(warning + explanation + reasons + suggestion);
                          return;
                        }

                        const confirmed = confirm(
                          `确定要一键导入所有改写后的内容吗？\n\n已改写的部分：\n${completedParts.map(p => `✓ ${p}`).join('\n')}\n\n这将：\n1. 填充世界观设定到"世界观管理"\n2. 添加所有角色到"人物管理"\n3. 生成完整的故事大纲\n4. 自动切换到"大纲与AI"标签\n\n⚠️ 导入后可继续编辑和调整！`
                        );

                        if (!confirmed) return;

                        // 1. 应用世界观
                        if (importData.worldview) {
                          const worldviewLines = importData.worldview.split('\n').filter((line: string) => line.trim());
                          worldviewLines.forEach((line: string) => {
                            if (line.includes('：') || line.includes(':')) {
                              const parts = line.split(/[：:]/);
                              if (parts.length >= 2) {
                                setWorldSettings(prev => [...prev, {
                                  id: Date.now().toString() + Math.random(),
                                  name: parts[0].trim(),
                                  type: '世界观',
                                  description: parts.slice(1).join('').trim(),
                                }]);
                              }
                            }
                          });
                        }

                        // 2. 应用人物
                        if (importData.characters && importData.characters.length > 0) {
                          const newCharacters: Character[] = importData.characters
                            .filter((char: any) => char.name && char.name.trim())
                            .map((char: any) => ({
                              id: Date.now().toString() + Math.random(),
                              name: char.name || '未命名角色',
                              age: '',
                              role: char.role || '',
                              personality: char.personality || '',
                              background: char.background || '',
                              appearance: '',
                              abilities: char.ability || '',
                              goals: char.goals || '',
                              weaknesses: '',
                              relationships: '',
                              appearanceReason: '',
                              disappearanceReason: '',
                              status: 'active' as const,
                              chapterAppearances: [],
                            }));

                          setCharacters(prev => [...prev, ...newCharacters]);
                        }

                        // 3. 生成大纲
                        let outlineText = '# 故事大纲\n\n';
                        if (importData.coreTheme) {
                          outlineText += `## 核心主题\n${importData.coreTheme}\n\n`;
                        }
                        if (importData.worldview) {
                          outlineText += `## 世界观设定\n${importData.worldview}\n\n`;
                        }
                        if (importData.characters && importData.characters.length > 0) {
                          outlineText += `## 主要角色\n\n`;
                          importData.characters.forEach((char: any) => {
                            outlineText += `### ${char.name}\n`;
                            if (char.role) outlineText += `- 定位：${char.role}\n`;
                            if (char.personality) outlineText += `- 性格：${char.personality}\n`;
                            if (char.background) outlineText += `- 背景：${char.background}\n`;
                            if (char.ability) outlineText += `- 能力：${char.ability}\n`;
                            if (char.goals) outlineText += `- 目标：${char.goals}\n`;
                            outlineText += '\n';
                          });
                        }
                        if (importData.plotStructure) {
                          outlineText += `## 剧情结构\n${importData.plotStructure}\n\n`;
                        }
                        if (importData.writingStyle) {
                          outlineText += `## 写作风格\n${importData.writingStyle}\n\n`;
                        }
                        if (importData.suggestions) {
                          outlineText += `## 创作建议\n${importData.suggestions}\n\n`;
                        }

                        setOutline(outlineText);

                        // 切换到大纲标签
                        setActiveTab('tools');

                        // 显示成功提示
                        alert('✅ 导入成功！\n\n已填充：\n• 世界观设定\n• 人物设定\n• 故事大纲\n\n请查看"大纲与AI"标签，并可根据需要进一步调整。');
                      }}
                      className="w-full h-16 text-lg bg-white hover:bg-gray-100 text-emerald-700 font-extrabold shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <Check className="h-6 w-6 mr-2" />
                      立即导入到创作模块
                    </Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  {/* 世界观编辑 */}
                  <div>
                    <Label className="text-xs text-blue-600 dark:text-blue-400">世界观设定（可修改以避免雷同）</Label>
                    <Textarea
                      value={importData.worldview}
                      onChange={(e) => setImportData({ ...importData, worldview: e.target.value })}
                      placeholder="修改世界观设定，确保与原书不雷同..."
                      className="min-h-[100px] mt-2 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleRewriteWorldview();
                      }}
                      disabled={rewriting.worldview}
                      className="mt-2 w-full h-8 text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    >
                      <BookMarked className="h-3 w-3 mr-1" />
                      {rewriting.worldview ? '改写中...' : '重新生成世界观'}
                    </Button>
                  </div>

                  {/* 人物编辑 */}
                  <div>
                    <Label className="text-xs text-purple-600 dark:text-purple-400">人物设定（可修改角色名称、背景等）</Label>
                    <div className="space-y-2 mt-2">
                      {importData.characters.map((char: any, index: number) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-800">
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">角色名称</Label>
                              <Input
                                value={formatDisplayText(char.name)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].name = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">角色定位</Label>
                              <Input
                                value={formatDisplayText(char.role)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].role = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">性格特点</Label>
                              <Textarea
                                value={formatDisplayText(char.personality)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].personality = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm min-h-[60px]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">背景故事</Label>
                              <Textarea
                                value={formatDisplayText(char.background)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].background = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm min-h-[60px]"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">能力设定</Label>
                              <Input
                                value={formatDisplayText(char.ability)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].ability = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">目标动机</Label>
                              <Textarea
                                value={formatDisplayText(char.goals)}
                                onChange={(e) => {
                                  const newCharacters = [...importData.characters];
                                  newCharacters[index].goals = e.target.value;
                                  setImportData({ ...importData, characters: newCharacters });
                                }}
                                className="text-sm min-h-[60px]"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const newCharacters = importData.characters.filter((_: any, i: number) => i !== index);
                                setImportData({ ...importData, characters: newCharacters });
                              }}
                              className="h-7 text-xs w-full"
                            >
                              删除此角色
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setImportData({
                          ...importData,
                          characters: [
                            ...importData.characters,
                            { name: '', role: '', personality: '', background: '', ability: '', goals: '' }
                          ]
                        });
                      }}
                      className="mt-2 w-full h-8 text-xs border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      添加新角色
                    </Button>
                  </div>

                  {/* 剧情结构编辑 */}
                  <div>
                    <Label className="text-xs text-green-600 dark:text-green-400">剧情结构（可修改情节要点）</Label>
                    <Textarea
                      value={importData.plotStructure}
                      onChange={(e) => setImportData({ ...importData, plotStructure: e.target.value })}
                      placeholder="修改剧情结构，确保故事独特性..."
                      className="min-h-[100px] mt-2 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleRewritePlot();
                      }}
                      disabled={rewriting.plot}
                      className="mt-2 w-full h-8 text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                    >
                      <BookMarked className="h-3 w-3 mr-1" />
                      {rewriting.plot ? '改写中...' : '重新生成剧情'}
                    </Button>
                  </div>

                  {/* 写作风格编辑 */}
                  <div>
                    <Label className="text-xs text-teal-600 dark:text-teal-400">写作风格（可调整叙述节奏、语言特色）</Label>
                    <Textarea
                      value={importData.writingStyle}
                      onChange={(e) => setImportData({ ...importData, writingStyle: e.target.value })}
                      placeholder="调整写作风格..."
                      className="min-h-[60px] mt-2 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleRewriteStyle();
                      }}
                      disabled={rewriting.style}
                      className="mt-2 w-full h-8 text-xs border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {rewriting.style ? '改写中...' : '重新生成风格'}
                    </Button>
                  </div>

                  {/* 核心主题编辑 */}
                  <div>
                    <Label className="text-xs text-amber-600 dark:text-amber-400">核心主题（可调整核心价值观）</Label>
                    <Textarea
                      value={importData.coreTheme}
                      onChange={(e) => setImportData({ ...importData, coreTheme: e.target.value })}
                      placeholder="调整核心主题..."
                      className="min-h-[60px] mt-2 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleRewriteTheme();
                      }}
                      disabled={rewriting.theme}
                      className="mt-2 w-full h-8 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      {rewriting.theme ? '改写中...' : '重新生成主题'}
                    </Button>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-3 pt-4 border-t-2 border-purple-200 dark:border-purple-800">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('analysisResult')}
                      className="flex-1 h-12 text-sm border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={() => {
                        // 检查是否完成了改写
                        const completedParts = [];
                        const incompleteParts = [];

                        if (rewriteCompleted.worldview) completedParts.push('世界观');
                        else incompleteParts.push('世界观');

                        if (rewriteCompleted.characters) completedParts.push('人物');
                        else incompleteParts.push('人物');

                        if (rewriteCompleted.plot) completedParts.push('剧情');
                        else incompleteParts.push('剧情');

                        if (rewriteCompleted.style) completedParts.push('风格');
                        else incompleteParts.push('风格');

                        if (rewriteCompleted.theme) completedParts.push('主题');
                        else incompleteParts.push('主题');

                        // 如果有未改写的部分，给出警告
                        if (incompleteParts.length > 0) {
                          const message = `⚠️ 重要警告：必须先完成AI改写才能导入！\n\n`;
                          const partsList = incompleteParts.map(p => `• ${p}`).join('\n');
                          const warning = `${message}以下部分尚未改写：\n${partsList}\n\n`;
                          const explanation = `为什么必须改写？\n`;
                          const reasons = [
                            `• 直接导入原作内容属于抄袭行为`,
                            `• 改写能创造独特的原创内容`,
                            `• 避免版权纠纷和雷同问题`
                          ].join('\n');
                          const suggestion = `\n\n请点击上方改写按钮完成所有部分后再导入。`;

                          alert(warning + explanation + reasons + suggestion);
                          return;
                        }

                        const confirmed = confirm(
                          `确定要导入所有改写后的内容吗？\n\n已改写的部分：\n${completedParts.map(p => `✓ ${p}`).join('\n')}\n\n这将：\n1. 填充世界观设定\n2. 添加角色设定\n3. 生成故事大纲\n\n注意：原有人物和世界观可能会被合并，大纲将被替换。`
                        );

                        if (!confirmed) return;

                        // 1. 应用世界观
                        if (importData.worldview) {
                          const worldviewLines = importData.worldview.split('\n').filter((line: string) => line.trim());
                          worldviewLines.forEach((line: string) => {
                            if (line.includes('：') || line.includes(':')) {
                              const parts = line.split(/[：:]/);
                              if (parts.length >= 2) {
                                setWorldSettings(prev => [...prev, {
                                  id: Date.now().toString() + Math.random(),
                                  name: parts[0].trim(),
                                  type: '世界观',
                                  description: parts.slice(1).join('').trim(),
                                }]);
                              }
                            }
                          });
                        }

                        // 2. 应用人物
                        if (importData.characters && importData.characters.length > 0) {
                          const newCharacters: Character[] = importData.characters
                            .filter((char: any) => char.name && char.name.trim())
                            .map((char: any) => ({
                              id: Date.now().toString() + Math.random(),
                              name: char.name || '未命名角色',
                              age: '',
                              role: char.role || '',
                              personality: char.personality || '',
                              background: char.background || '',
                              appearance: '',
                              abilities: char.ability || '',
                              goals: char.goals || '',
                              weaknesses: '',
                              relationships: '',
                              appearanceReason: '',
                              disappearanceReason: '',
                              status: 'active' as const,
                              chapterAppearances: [],
                            }));

                          setCharacters(prev => [...prev, ...newCharacters]);
                        }

                        // 3. 生成大纲
                        let outlineText = '# 故事大纲\n\n';
                        if (importData.coreTheme) {
                          outlineText += `## 核心主题\n${importData.coreTheme}\n\n`;
                        }
                        if (importData.worldview) {
                          outlineText += `## 世界观设定\n${importData.worldview}\n\n`;
                        }
                        if (importData.characters && importData.characters.length > 0) {
                          outlineText += `## 主要角色\n\n`;
                          importData.characters.forEach((char: any) => {
                            outlineText += `### ${char.name}\n`;
                            if (char.role) outlineText += `- 定位：${char.role}\n`;
                            if (char.personality) outlineText += `- 性格：${char.personality}\n`;
                            if (char.background) outlineText += `- 背景：${char.background}\n`;
                            if (char.ability) outlineText += `- 能力：${char.ability}\n`;
                            if (char.goals) outlineText += `- 目标：${char.goals}\n`;
                            outlineText += '\n';
                          });
                        }
                        if (importData.plotStructure) {
                          outlineText += `## 剧情结构\n${importData.plotStructure}\n\n`;
                        }
                        if (importData.writingStyle) {
                          outlineText += `## 写作风格\n${importData.writingStyle}\n\n`;
                        }
                        if (importData.suggestions) {
                          outlineText += `## 创作建议\n${importData.suggestions}\n\n`;
                        }

                        setOutline(outlineText);

                        // 切换到大纲标签
                        setActiveTab('tools');

                        // 显示成功提示
                        alert('✅ 导入成功！\n\n已填充：\n• 世界观设定\n• 人物设定\n• 故事大纲\n\n请查看"大纲与AI"标签，并可根据需要进一步调整。');

                        // 重置改写完成状态
                        setRewriteCompleted({
                          worldview: false,
                          characters: false,
                          plot: false,
                          style: false,
                          theme: false,
                        });
                      }}
                      className="flex-1 h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      ✅ 确认导入到大纲
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* 激活弹窗 */}
      {/* 全屏强制验证界面 */}
    </div>
  );
}
