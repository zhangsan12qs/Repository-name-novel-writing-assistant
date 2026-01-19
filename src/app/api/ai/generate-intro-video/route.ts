import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationClient, Config } from 'coze-coding-dev-sdk';

// 预设的功能介绍模板
const INTRO_TEMPLATES: Record<string, string[]> = {
  '全部功能': [
    '一个现代化的小说写作辅助平台界面，左侧是创作流程导航，中间是编辑区域，右侧是功能面板',
    'AI自动生成大纲功能，展示故事框架、人物设定和世界观创建',
    '批量生成章节功能，自动生成完整的章节内容，支持质量检测',
    '人物设定管理系统，追踪人物出现时间线和关系网络',
    '剧情检查功能，实时检测写作问题并提供修复建议',
    '版本历史功能，自动保存章节版本，防止内容丢失',
    '专注模式，提供无干扰的写作环境',
    '任务队列系统，支持长时间后台任务和断点续传',
    '拆书分析功能，分析参考小说并提取创作元素',
    '自动更改导入功能，智能改写避免抄袭',
  ],
  '核心功能': [
    '小说写作编辑器界面，支持实时保存和智能写作辅助',
    'AI续写、扩写、润色功能，一键优化文章质量',
    '自动写作功能，根据大纲自动生成完整章节',
    '剧情质量检测，自动识别并修复常见写作问题',
  ],
  '特色功能': [
    '人物时间线追踪，可视化展示人物出场记录',
    '批量改人名功能，一键修改所有人物名称',
    '起名系统，根据角色属性生成符合风格的名字',
    '高效模式，智能优化性能，支持长篇创作',
  ],
  '高级功能': [
    '任务队列管理，支持批量生成和断点续传',
    '拆书分析工具，上传参考小说提取创作灵感',
    '智能改写导入，自动改写避免抄袭问题',
    '版本历史管理，自动保存20个历史版本',
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template = '全部功能', customPrompt = '', duration = 5, ratio = '16:9', resolution = '720p' } = body;

    // 获取视频内容
    let prompts: string[];
    if (customPrompt.trim()) {
      prompts = [customPrompt.trim()];
    } else {
      prompts = INTRO_TEMPLATES[template] || INTRO_TEMPLATES['全部功能'];
    }

    // 配置视频生成客户端
    const config = new Config();
    const client = new VideoGenerationClient(config);

    // 生成视频内容描述
    const content = prompts.map(prompt => ({
      type: 'text' as const,
      text: `Professional video showcase of a novel writing platform: ${prompt}. Cinematic camera movement, high quality production value, modern UI design.`,
    }));

    // 调用视频生成API
    const response = await client.videoGeneration(content, {
      model: 'doubao-seedance-1-5-pro-251215',
      duration,
      ratio,
      resolution,
      watermark: false,
      generateAudio: true,
    });

    if (!response.videoUrl) {
      throw new Error('视频生成失败，未返回视频URL');
    }

    return NextResponse.json({
      success: true,
      videoUrl: response.videoUrl,
      lastFrameUrl: response.lastFrameUrl,
      taskId: response.response?.id,
      status: response.response?.status,
    });

  } catch (error) {
    console.error('[视频生成] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '视频生成失败',
    }, { status: 500 });
  }
}

// 获取可用的模板列表
export async function GET() {
  return NextResponse.json({
    templates: Object.keys(INTRO_TEMPLATES),
    templatesDetail: INTRO_TEMPLATES,
  });
}
