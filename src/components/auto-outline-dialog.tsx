'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Sparkles, Loader2, CheckCircle, BookOpen, Users, Globe, FileText } from 'lucide-react';

interface Props {
  onGenerateComplete: (data: any) => void;
}

export default function AutoOutlineDialog({ onGenerateComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({
    phase: '',
    percentage: 0,
    message: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    novelType: '玄幻',
    targetChapterCount: 100,
    targetWordCount: 3000,
    coreIdea: '',
    customRequirements: '',
  });

  const [generatedData, setGeneratedData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!formData.title) {
      alert('请输入小说标题');
      return;
    }

    setGenerating(true);
    setProgress({
      phase: '准备中',
      percentage: 0,
      message: '正在初始化...'
    });
    setGeneratedData(null);

    try {
      const response = await fetch('/api/ai/generate-full-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const buffer = '';

      if (!reader) {
        throw new Error('无法读取响应');
      }

      let worldData: any = null;
      let characterData: any[] = [];
      let storyData: any = null;
      let allChapters: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.substring(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5));

              if (data.phase || data.percentage) {
                // 进度更新
                setProgress({
                  phase: data.phase || '',
                  percentage: data.percentage || 0,
                  message: data.message || ''
                });
              }

              if (data.coreSetting) {
                // 世界观数据
                worldData = data;
              }

              if (Array.isArray(data) && data.length > 0 && data[0].name) {
                // 人物数据
                characterData = data;
              }

              if (data.beginning) {
                // 故事大纲
                storyData = data;
              }

              if (data.chapters) {
                // 章节概要（分批）
                allChapters = [...allChapters, ...data.chapters];
              }

              if (data.success) {
                // 完成信号
                console.log('[AutoOutline] 生成完成，共', allChapters.length, '章');
                const finalData = {
                  world: worldData,
                  characters: characterData,
                  story: storyData,
                  chapters: allChapters,
                  ...formData
                };

                setGeneratedData(finalData);
                onGenerateComplete(finalData);
                setGenerating(false);
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e: any) {
              console.error('解析错误:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('生成失败:', error);
      alert('生成失败：' + error.message);
      setGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedData) {
      onGenerateComplete(generatedData);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-2 border-purple-600 text-purple-600 hover:bg-purple-50"
          disabled={generating}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          自动生成大纲
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            自动生成完整大纲
          </DialogTitle>
          <DialogDescription>
            无需拆书，直接生成支持超长篇小说的完整大纲
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {generating ? (
            // 生成中界面
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">{progress.phase}</span>
                  <span className="text-2xl font-bold text-purple-600">{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress.message}
                </p>
              </Card>

              {generatedData && (
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">生成完成！</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      <span>{generatedData.chapters?.length || 0} 章</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span>{generatedData.characters?.length || 0} 个角色</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span>世界观已生成</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>故事大纲已生成</span>
                    </div>
                  </div>
                </Card>
              )}

              {generatedData && (
                <Button
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  应用到大纲
                </Button>
              )}
            </div>
          ) : (
            // 表单界面
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">小说标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入小说标题"
                />
              </div>

              <div>
                <Label htmlFor="novelType">小说类型 *</Label>
                <Select
                  value={formData.novelType}
                  onValueChange={(value) => setFormData({ ...formData, novelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chapterCount">目标章节数 *</Label>
                  <Input
                    id="chapterCount"
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.targetChapterCount}
                    onChange={(e) => setFormData({ ...formData, targetChapterCount: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">范围: 10-1000章</p>
                </div>

                <div>
                  <Label htmlFor="wordCount">每章字数 *</Label>
                  <Input
                    id="wordCount"
                    type="number"
                    min="1000"
                    max="10000"
                    value={formData.targetWordCount}
                    onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || 3000 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">范围: 1000-10000字</p>
                </div>
              </div>

              <div>
                <Label htmlFor="coreIdea">核心创意（可选）</Label>
                <Textarea
                  id="coreIdea"
                  value={formData.coreIdea}
                  onChange={(e) => setFormData({ ...formData, coreIdea: e.target.value })}
                  placeholder="描述你的核心创意、独特设定或故事起点..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="requirements">其他要求（可选）</Label>
                <Textarea
                  id="requirements"
                  value={formData.customRequirements}
                  onChange={(e) => setFormData({ ...formData, customRequirements: e.target.value })}
                  placeholder="其他特殊要求或偏好..."
                  rows={2}
                />
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 text-sm">
                <p className="font-semibold mb-2">生成内容包含：</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>✓ 详细的世界观设定</li>
                  <li>✓ 主要人物设定（3-5个）</li>
                  <li>✓ 整体故事大纲</li>
                  <li>✓ {formData.targetChapterCount}章详细章节概要</li>
                  <li>✓ 总字数约 {formData.targetChapterCount * formData.targetWordCount} 字</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                开始生成
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
