'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, CheckCircle, BookOpen, Users, Globe, FileText, User, Zap, Heart, Swords, Map, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  onGenerateComplete: (data: any) => void;
}

// 可折叠区域组件
function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {expanded && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
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
    // 基础信息
    title: '',
    novelType: '玄幻',
    targetChapterCount: 100,
    targetWordCount: 3000,

    // 主角设定
    protagonistName: '',
    protagonistGender: '男',
    protagonistPersonality: '',
    protagonistBackground: '',
    protagonistAbility: '',
    protagonistGoal: '',

    // 世界观细节
    worldBackground: '',
    powerSystem: '',
    geographicalEnvironment: '',
    socialStructure: '',
    coreConflict: '',

    // 故事风格
    narrativeStyle: '第三人称',
    languageStyle: '简洁',
    pacePreference: '适中',

    // 主题与核心
    coreTheme: '',
    philosophicalThinking: '',
    emotionalTone: '热血',

    // 关键设定
    goldenFinger: '',
    keyItems: '',
    importantLocations: '',

    // 剧情结构
    storyMode: '探险成长',
    conflictType: '人魔对抗',
    climaxSetting: '',

    // 分卷规划
    needVolumes: true,
    volumeCount: 5,

    // 禁忌设定
    avoidElements: '',
    avoidClichés: false,

    // 其他要求
    customRequirements: '',
  });

  const [expandedSections, setExpandedSections] = useState({
    protagonist: true,
    world: true,
    style: false,
    theme: false,
    keySettings: false,
    plot: false,
    volume: false,
    taboos: false,
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* 基础信息 */}
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

              {/* 主角设定 */}
              <CollapsibleSection
                title="主角设定"
                icon={<User className="h-4 w-4" />}
                expanded={expandedSections.protagonist}
                onToggle={() => setExpandedSections({ ...expandedSections, protagonist: !expandedSections.protagonist })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="protagonistName">主角姓名</Label>
                    <Input
                      id="protagonistName"
                      value={formData.protagonistName}
                      onChange={(e) => setFormData({ ...formData, protagonistName: e.target.value })}
                      placeholder="输入主角姓名"
                    />
                  </div>

                  <div>
                    <Label htmlFor="protagonistGender">主角性别</Label>
                    <Select
                      value={formData.protagonistGender}
                      onValueChange={(value) => setFormData({ ...formData, protagonistGender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="protagonistPersonality">主角性格</Label>
                    <Textarea
                      id="protagonistPersonality"
                      value={formData.protagonistPersonality}
                      onChange={(e) => setFormData({ ...formData, protagonistPersonality: e.target.value })}
                      placeholder="如：冷静、果断、热血、善良、腹黑等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="protagonistBackground">主角背景</Label>
                    <Textarea
                      id="protagonistBackground"
                      value={formData.protagonistBackground}
                      onChange={(e) => setFormData({ ...formData, protagonistBackground: e.target.value })}
                      placeholder="主角的身世、成长环境、重要经历等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="protagonistAbility">主角能力</Label>
                    <Textarea
                      id="protagonistAbility"
                      value={formData.protagonistAbility}
 onChange={(e) => setFormData({ ...formData, protagonistAbility: e.target.value })}
                      placeholder="主角的核心能力、特长或技能..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="protagonistGoal">主角目标</Label>
                    <Textarea
                      id="protagonistGoal"
                      value={formData.protagonistGoal}
                      onChange={(e) => setFormData({ ...formData, protagonistGoal: e.target.value })}
                      placeholder="主角的主要目标和追求..."
                      rows={2}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* 世界观细节 */}
              <CollapsibleSection
                title="世界观细节"
                icon={<Globe className="h-4 w-4" />}
                expanded={expandedSections.world}
                onToggle={() => setExpandedSections({ ...expandedSections, world: !expandedSections.world })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="worldBackground">世界背景</Label>
                    <Textarea
                      id="worldBackground"
                      value={formData.worldBackground}
                      onChange={(e) => setFormData({ ...formData, worldBackground: e.target.value })}
                      placeholder="描述世界的起源、历史、现状等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="powerSystem">力量体系</Label>
                    <Textarea
                      id="powerSystem"
                      value={formData.powerSystem}
                      onChange={(e) => setFormData({ ...formData, powerSystem: e.target.value })}
                      placeholder="修炼体系、等级划分、能力类型等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="geographicalEnvironment">地理环境</Label>
                    <Textarea
                      id="geographicalEnvironment"
                      value={formData.geographicalEnvironment}
                      onChange={(e) => setFormData({ ...formData, geographicalEnvironment: e.target.value })}
                      placeholder="地图结构、重要地点、地理特征等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="socialStructure">社会结构</Label>
                    <Textarea
                      id="socialStructure"
                      value={formData.socialStructure}
                      onChange={(e) => setFormData({ ...formData, socialStructure: e.target.value })}
                      placeholder="势力分布、阶级体系、组织结构等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="coreConflict">核心冲突</Label>
                    <Textarea
                      id="coreConflict"
                      value={formData.coreConflict}
                      onChange={(e) => setFormData({ ...formData, coreConflict: e.target.value })}
                      placeholder="世界的主要矛盾和冲突来源..."
                      rows={2}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* 故事风格 */}
              <CollapsibleSection
                title="故事风格"
                icon={<BookOpen className="h-4 w-4" />}
                expanded={expandedSections.style}
                onToggle={() => setExpandedSections({ ...expandedSections, style: !expandedSections.style })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="narrativeStyle">叙事风格</Label>
                    <Select
                      value={formData.narrativeStyle}
                      onValueChange={(value) => setFormData({ ...formData, narrativeStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="第一人称">第一人称</SelectItem>
                        <SelectItem value="第三人称">第三人称</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="languageStyle">语言风格</Label>
                    <Select
                      value={formData.languageStyle}
                      onValueChange={(value) => setFormData({ ...formData, languageStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="简洁">简洁明快</SelectItem>
                        <SelectItem value="华丽">华丽优美</SelectItem>
                        <SelectItem value="幽默">幽默风趣</SelectItem>
                        <SelectItem value="严肃">严肃沉重</SelectItem>
                        <SelectItem value="冷峻">冷峻犀利</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pacePreference">节奏偏好</Label>
                    <Select
                      value={formData.pacePreference}
                      onValueChange={(value) => setFormData({ ...formData, pacePreference: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="快节奏">快节奏</SelectItem>
                        <SelectItem value="适中">适中</SelectItem>
                        <SelectItem value="慢节奏">慢节奏</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleSection>

              {/* 主题与核心 */}
              <CollapsibleSection
                title="主题与核心"
                icon={<Heart className="h-4 w-4" />}
                expanded={expandedSections.theme}
                onToggle={() => setExpandedSections({ ...expandedSections, theme: !expandedSections.theme })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="coreTheme">核心主题</Label>
                    <Textarea
                      id="coreTheme"
                      value={formData.coreTheme}
                      onChange={(e) => setFormData({ ...formData, coreTheme: e.target.value })}
                      placeholder="如：友情、正义、成长、救赎、自由等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="philosophicalThinking">哲学思考</Label>
                    <Textarea
                      id="philosophicalThinking"
                      value={formData.philosophicalThinking}
                      onChange={(e) => setFormData({ ...formData, philosophicalThinking: e.target.value })}
                      placeholder="你想传达的深层思考或价值观..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emotionalTone">情感基调</Label>
                    <Select
                      value={formData.emotionalTone}
                      onValueChange={(value) => setFormData({ ...formData, emotionalTone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="热血">热血</SelectItem>
                        <SelectItem value="温馨">温馨</SelectItem>
                        <SelectItem value="悲剧">悲剧</SelectItem>
                        <SelectItem value="悬疑">悬疑</SelectItem>
                        <SelectItem value="史诗">史诗</SelectItem>
                        <SelectItem value="轻松">轻松</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleSection>

              {/* 关键设定 */}
              <CollapsibleSection
                title="关键设定"
                icon={<Zap className="h-4 w-4" />}
                expanded={expandedSections.keySettings}
                onToggle={() => setExpandedSections({ ...expandedSections, keySettings: !expandedSections.keySettings })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="goldenFinger">金手指/特殊能力</Label>
                    <Textarea
                      id="goldenFinger"
                      value={formData.goldenFinger}
                      onChange={(e) => setFormData({ ...formData, goldenFinger: e.target.value })}
                      placeholder="主角的特殊能力、奇遇或系统（如有）..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="keyItems">关键物品</Label>
                    <Textarea
                      id="keyItems"
                      value={formData.keyItems}
                      onChange={(e) => setFormData({ ...formData, keyItems: e.target.value })}
                      placeholder="重要的武器、法宝、道具等..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="importantLocations">重要地点</Label>
                    <Textarea
                      id="importantLocations"
                      value={formData.importantLocations}
                      onChange={(e) => setFormData({ ...formData, importantLocations: e.target.value })}
                      placeholder="关键场景地点、地图上的重要位置..."
                      rows={2}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* 剧情结构 */}
              <CollapsibleSection
                title="剧情结构"
                icon={<Swords className="h-4 w-4" />}
                expanded={expandedSections.plot}
                onToggle={() => setExpandedSections({ ...expandedSections, plot: !expandedSections.plot })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="storyMode">故事模式</Label>
                    <Select
                      value={formData.storyMode}
                      onValueChange={(value) => setFormData({ ...formData, storyMode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="探险成长">探险成长</SelectItem>
                        <SelectItem value="复仇">复仇</SelectItem>
                        <SelectItem value="守护">守护</SelectItem>
                        <SelectItem value="争霸">争霸</SelectItem>
                        <SelectItem value="解谜">解谜</SelectItem>
                        <SelectItem value="生存">生存</SelectItem>
                        <SelectItem value="创造">创造</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="conflictType">冲突类型</Label>
                    <Select
                      value={formData.conflictType}
                      onValueChange={(value) => setFormData({ ...formData, conflictType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="人魔对抗">人魔对抗</SelectItem>
                        <SelectItem value="势力争霸">势力争霸</SelectItem>
                        <SelectItem value="内部矛盾">内部矛盾</SelectItem>
                        <SelectItem value="命运抗争">命运抗争</SelectItem>
                        <SelectItem value="资源争夺">资源争夺</SelectItem>
                        <SelectItem value="种族战争">种族战争</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="climaxSetting">高潮设定</Label>
                    <Textarea
                      id="climaxSetting"
                      value={formData.climaxSetting}
                      onChange={(e) => setFormData({ ...formData, climaxSetting: e.target.value })}
                      placeholder="预期的高潮情节或最终决战..."
                      rows={2}
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* 分卷规划 */}
              <CollapsibleSection
                title="分卷规划"
                icon={<Map className="h-4 w-4" />}
                expanded={expandedSections.volume}
                onToggle={() => setExpandedSections({ ...expandedSections, volume: !expandedSections.volume })}
              >
                <div className="space-y-3 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="needVolumes"
                      checked={formData.needVolumes}
                      onCheckedChange={(checked) => setFormData({ ...formData, needVolumes: checked as boolean })}
                    />
                    <Label htmlFor="needVolumes" className="cursor-pointer">
                      需要分卷
                    </Label>
                  </div>

                  {formData.needVolumes && (
                    <div>
                      <Label htmlFor="volumeCount">预期分卷数</Label>
                      <Input
                        id="volumeCount"
                        type="number"
                        min="2"
                        max="20"
                        value={formData.volumeCount}
                        onChange={(e) => setFormData({ ...formData, volumeCount: parseInt(e.target.value) || 5 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">每卷约 {Math.ceil(formData.targetChapterCount / (formData.volumeCount || 5))} 章</p>
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              {/* 禁忌设定 */}
              <CollapsibleSection
                title="禁忌设定"
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                expanded={expandedSections.taboos}
                onToggle={() => setExpandedSections({ ...expandedSections, taboos: !expandedSections.taboos })}
              >
                <div className="space-y-3 mt-3">
                  <div>
                    <Label htmlFor="avoidElements">不想包含的内容</Label>
                    <Textarea
                      id="avoidElements"
                      value={formData.avoidElements}
                      onChange={(e) => setFormData({ ...formData, avoidElements: e.target.value })}
                      placeholder="不想出现的元素、情节或设定..."
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="avoidClichés"
                      checked={formData.avoidClichés}
                      onCheckedChange={(checked) => setFormData({ ...formData, avoidClichés: checked as boolean })}
                    />
                    <Label htmlFor="avoidClichés" className="cursor-pointer">
                      避免常见套路（如：退婚、打脸、后宫等）
                    </Label>
                  </div>
                </div>
              </CollapsibleSection>

              {/* 其他要求 */}
              <div>
                <Label htmlFor="requirements">其他要求</Label>
                <Textarea
                  id="requirements"
                  value={formData.customRequirements}
                  onChange={(e) => setFormData({ ...formData, customRequirements: e.target.value })}
                  placeholder="其他特殊要求或偏好..."
                  rows={2}
                />
              </div>

              {/* 生成内容预览 */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 p-4">
                <p className="font-semibold mb-2 text-sm">生成内容预览：</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>✓ 详细的世界观设定（力量体系、地理环境、社会结构等）</li>
                  <li>✓ 主要人物设定（3-5个）</li>
                  <li>✓ 整体故事大纲</li>
                  <li>✓ {formData.targetChapterCount}章详细章节概要</li>
                  {formData.needVolumes && <li>✓ 分卷规划（{String(formData.volumeCount)}卷）</li>}
                  <li>✓ 总字数约 {(formData.targetChapterCount * formData.targetWordCount).toLocaleString()} 字</li>
                </ul>
              </Card>

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
