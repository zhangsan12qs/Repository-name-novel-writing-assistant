'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Video,
  Wand2,
  Play,
  Download,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Film,
  BookOpen,
  Users,
  Settings,
  Zap,
  Shield,
  Clock,
  History,
  Target,
  Lightbulb,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

type TemplateKey = '全部功能' | '核心功能' | '特色功能' | '高级功能';

export default function VideoIntroPage() {
  const [template, setTemplate] = useState<TemplateKey>('全部功能');
  const [customPrompt, setCustomPrompt] = useState('');
  const [duration, setDuration] = useState('5');
  const [ratio, setRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [generating, setGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [templates, setTemplates] = useState<Record<string, string[]>>({});
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'features'>('generate');

  // 功能列表
  const features = [
    {
      icon: BookOpen,
      title: '智能大纲生成',
      description: 'AI自动生成完整故事大纲，包含世界观、人物设定和剧情框架',
      color: 'blue',
    },
    {
      icon: Wand2,
      title: '批量章节生成',
      description: '一键生成多章节内容，自动质量检测，支持1000章超长篇',
      color: 'purple',
    },
    {
      icon: Users,
      title: '人物管理系统',
      description: '追踪人物出现时间线，可视化关系网络，批量改人名',
      color: 'green',
    },
    {
      icon: Shield,
      title: '剧情质量检测',
      description: '实时检测写作问题，自动修复，确保内容质量',
      color: 'orange',
    },
    {
      icon: History,
      title: '版本历史',
      description: '自动保存章节版本，随时恢复，防止内容丢失',
      color: 'pink',
    },
    {
      icon: Settings,
      title: '专注模式',
      description: '无干扰写作环境，提升创作效率',
      color: 'slate',
    },
    {
      icon: Clock,
      title: '任务队列',
      description: '支持长时间后台任务，断点续传，进度实时更新',
      color: 'cyan',
    },
    {
      icon: Target,
      title: '拆书分析',
      description: '上传参考小说，提取创作元素，智能改写避免抄袭',
      color: 'amber',
    },
  ];

  // 加载模板
  useEffect(() => {
    fetch('/api/ai/generate-intro-video')
      .then(res => res.json())
      .then(data => {
        if (data.templatesDetail) {
          setTemplates(data.templatesDetail);
        }
      })
      .catch(err => console.error('加载模板失败:', err));
  }, []);

  // 生成视频
  const handleGenerate = async () => {
    setError('');
    setGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-intro-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template,
          customPrompt,
          duration: parseInt(duration),
          ratio,
          resolution,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '生成失败');
      }

      setGeneratedVideoUrl(data.videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
      console.error('[视频生成] 错误:', err);
    } finally {
      setGenerating(false);
    }
  };

  // 下载视频
  const handleDownload = async () => {
    if (!generatedVideoUrl) return;

    try {
      const response = await fetch(generatedVideoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novel-writer-intro-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[下载视频] 错误:', err);
      alert('下载失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg mb-4">
            <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI视频生成</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            小说写作平台功能介绍
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            使用AI生成视频，展示您的小说写作平台的所有功能和特色
          </p>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white dark:bg-gray-800 shadow-lg">
              <TabsTrigger value="generate" className="gap-2">
                <Wand2 className="h-4 w-4" />
                生成视频
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                预设模板
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Sparkles className="h-4 w-4" />
                功能介绍
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 生成视频标签页 */}
          <TabsContent value="generate" className="space-y-6">
            <Card className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
              <div className="space-y-6">
                {/* 视频预览区域 */}
                {generatedVideoUrl ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={generatedVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownload} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        下载视频
                      </Button>
                      <Button variant="outline" onClick={() => setGeneratedVideoUrl('')}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重新生成
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Video className="h-16 w-16 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                      <p className="text-gray-600 dark:text-gray-400">生成后的视频将在这里显示</p>
                    </div>
                  </div>
                )}

                {/* 生成设置 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>选择模板</Label>
                    <Select value={template} onValueChange={(v) => setTemplate(v as TemplateKey)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(templates).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>视频时长（秒）</Label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="4"
                      max="12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>视频比例</Label>
                    <Select value={ratio} onValueChange={setRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9（横屏）</SelectItem>
                        <SelectItem value="9:16">9:16（竖屏）</SelectItem>
                        <SelectItem value="1:1">1:1（方形）</SelectItem>
                        <SelectItem value="4:3">4:3</SelectItem>
                        <SelectItem value="3:4">3:4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>分辨率</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p</SelectItem>
                        <SelectItem value="720p">720p</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 自定义描述 */}
                <div className="space-y-2">
                  <Label>自定义描述（可选）</Label>
                  <Input
                    placeholder="输入自定义的视频描述..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">生成失败</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  </div>
                )}

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      生成介绍视频
                    </>
                  )}
                </Button>

                {/* 提示信息 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <p>• 视频生成需要一定时间，请耐心等待</p>
                      <p>• 建议时长为5-8秒，效果最佳</p>
                      <p>• 生成后的视频可以下载保存</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 预设模板标签页 */}
          <TabsContent value="templates" className="space-y-4">
            {Object.entries(templates).map(([key, prompts]) => (
              <Card key={key} className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600">
                    {key}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {prompts.length} 个场景
                  </span>
                </div>
                <ul className="space-y-2">
                  {prompts.map((prompt, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplate(key as TemplateKey);
                    setActiveTab('generate');
                  }}
                  className="mt-4"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  使用此模板
                </Button>
              </Card>
            ))}
          </TabsContent>

          {/* 功能介绍标签页 */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900`}>
                      <feature.icon className={`h-6 w-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-2">开始使用</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    切换到"生成视频"标签页，选择模板即可生成介绍视频
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab('generate')}
                  size="lg"
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  开始生成
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
