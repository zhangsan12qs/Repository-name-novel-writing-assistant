'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Settings,
  Cpu,
  Shield,
  Info,
  Globe,
  Key,
  Star,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { GROQ_MODELS, type GroqMessage } from '@/lib/groq-client';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// AI 模式枚举
type AiMode = 'developer' | 'user';

// 用户模式支持的模型（硅基流动）
const USER_MODELS = [
  // 适合长篇的顶级模型
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen2.5-72B',
    description: '72B参数，32k上下文，顶级长篇能力',
    category: '长篇旗舰'
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek-V3',
    description: '最新旗舰，64k上下文，推理能力极强',
    category: '长篇旗舰'
  },
  {
    id: 'Yi/Yi-1.5-34B-Chat',
    name: 'Yi-1.5-34B',
    description: '64k上下文，优秀中文创作能力',
    category: '长篇推荐'
  },
  {
    id: 'Qwen/Qwen2.5-32B-Instruct',
    name: 'Qwen2.5-32B',
    description: '32k上下文，性能平衡，性价比高',
    category: '长篇推荐'
  },

  // 性价比模型
  {
    id: 'deepseek-ai/DeepSeek-V2.5',
    name: 'DeepSeek-V2.5',
    description: '32k上下文，成本更低',
    category: '性价比'
  },
  {
    id: 'Qwen/Qwen2.5-14B-Instruct',
    name: 'Qwen2.5-14B',
    description: '32k上下文，轻量级长篇',
    category: '性价比'
  },

  // 其他优秀模型
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen2.5-7B',
    description: '阿里通义千问，32k上下文，中文能力强',
    category: '中文优化'
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama-3.1-8B',
    description: 'Meta开源，128k上下文，多语言支持',
    category: '开源'
  },
  {
    id: 'google/gemma-2-27b-it',
    name: 'Gemma 2 27B',
    description: 'Google最新，8k上下文，轻量高效',
    category: '轻量'
  }
];

// 默认配置
const DEFAULT_USER_CONFIG = {
  apiKey: '',
  model: 'Qwen/Qwen2.5-72B-Instruct',  // 72B参数，32k上下文，适合长篇
  temperature: 0.8,
  maxTokens: 4000,  // 增加到4000，支持更长输出
  topP: 0.9
};

const DEFAULT_DEVELOPER_CONFIG = {
  model: 'llama-3.1-70b-versatile',  // 70B参数，128k上下文，适合长篇（1000章+）
  temperature: 0.75,  // 适中的随机性
  maxTokens: 8192,  // 增加到8192，利用大上下文
  topP: 1.0
};

export default function ApiKeySettings({ open, onOpenChange }: ApiKeySettingsProps) {
  const [aiMode, setAiMode] = useState<AiMode>('developer');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_USER_CONFIG.model);
  const [temperature, setTemperature] = useState(DEFAULT_USER_CONFIG.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_USER_CONFIG.maxTokens);
  const [topP, setTopP] = useState(DEFAULT_USER_CONFIG.topP);

  // 开发者模式配置
  const [devModel, setDevModel] = useState(DEFAULT_DEVELOPER_CONFIG.model);
  const [devTemperature, setDevTemperature] = useState(DEFAULT_DEVELOPER_CONFIG.temperature);
  const [devMaxTokens, setDevMaxTokens] = useState(DEFAULT_DEVELOPER_CONFIG.maxTokens);
  const [devTopP, setDevTopP] = useState(DEFAULT_DEVELOPER_CONFIG.topP);

  // 加载已保存的配置
  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = () => {
    const savedMode = localStorage.getItem('ai_mode') as AiMode;
    if (savedMode) {
      setAiMode(savedMode);
    }

    // 加载用户模式配置
    const savedKey = localStorage.getItem('siliconflow_api_key');
    const savedModel = localStorage.getItem('siliconflow_model');
    const savedTemp = localStorage.getItem('siliconflow_temperature');
    const savedTokens = localStorage.getItem('siliconflow_maxTokens');
    const savedTopP = localStorage.getItem('siliconflow_topP');

    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
    }
    if (savedModel) setSelectedModel(savedModel);
    if (savedTemp) setTemperature(parseFloat(savedTemp));
    if (savedTokens) setMaxTokens(parseInt(savedTokens));
    if (savedTopP) setTopP(parseFloat(savedTopP));

    // 加载开发者模式配置
    const savedDevModel = localStorage.getItem('groq_model');
    const savedDevTemp = localStorage.getItem('groq_temperature');
    const savedDevTokens = localStorage.getItem('groq_maxTokens');
    const savedDevTopP = localStorage.getItem('groq_topP');

    if (savedDevModel) setDevModel(savedDevModel);
    if (savedDevTemp) setDevTemperature(parseFloat(savedDevTemp));
    if (savedDevTokens) setDevMaxTokens(parseInt(savedDevTokens));
    if (savedDevTopP) setDevTopP(parseFloat(savedDevTopP));
  };

  const handleSaveUserConfig = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setSaving(true);

    try {
      // 保存到 localStorage
      localStorage.setItem('siliconflow_api_key', apiKey.trim());
      localStorage.setItem('siliconflow_model', selectedModel);
      localStorage.setItem('siliconflow_temperature', temperature.toString());
      localStorage.setItem('siliconflow_maxTokens', maxTokens.toString());
      localStorage.setItem('siliconflow_topP', topP.toString());

      setSaved(true);

      setTimeout(() => {
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaving(false);
    }
  };

  const handleClearUserConfig = () => {
    localStorage.removeItem('siliconflow_api_key');
    localStorage.removeItem('siliconflow_model');
    localStorage.removeItem('siliconflow_temperature');
    localStorage.removeItem('siliconflow_maxTokens');
    localStorage.removeItem('siliconflow_topP');
    setApiKey('');
    setSaved(false);
  };

  const handleSaveDeveloperConfig = async () => {
    setSaving(true);

    try {
      localStorage.setItem('groq_model', devModel);
      localStorage.setItem('groq_temperature', devTemperature.toString());
      localStorage.setItem('groq_maxTokens', devMaxTokens.toString());
      localStorage.setItem('groq_topP', devTopP.toString());

      setTimeout(() => {
        setSaving(false);
        setSaved(true);
      }, 500);
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaving(false);
    }
  };

  const handleModeChange = (mode: AiMode) => {
    setAiMode(mode);
    localStorage.setItem('ai_mode', mode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6" />
            大模型配置
          </DialogTitle>
          <DialogDescription>
            选择 AI 模式并配置参数，立即开始智能创作
          </DialogDescription>
        </DialogHeader>

        {/* 模式选择 */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <Card
              className={`flex-1 p-6 cursor-pointer transition-all ${
                aiMode === 'developer'
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950'
                  : 'hover:ring-2 hover:ring-purple-300'
              }`}
              onClick={() => handleModeChange('developer')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">jm666直连配置</h3>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    已预配置
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                已预置高性能 AI（Llama 3.1 70B，128k上下文），无需 API Key，点开即用，支持 1000 章超长篇创作
              </p>
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>完全免费，无需 API Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>极速响应（比 GPT-4 快 10 倍）</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  <span>128k 上下文，适合 1000 章长篇</span>
                </div>
              </div>
            </Card>

            <Card
              className={`flex-1 p-6 cursor-pointer transition-all ${
                aiMode === 'user'
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'hover:ring-2 hover:ring-blue-300'
              }`}
              onClick={() => handleModeChange('user')}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Key className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">用户选择模式</h3>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    高级
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                使用自己的 API Key，支持更多模型（DeepSeek、Qwen 等），灵活自定义
              </p>
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>数据自主掌控</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span>支持多种付费模型</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span>更多参数配置选项</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 配置面板 */}
        <Tabs value={aiMode} onValueChange={(v) => handleModeChange(v as AiMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="developer">jm666直连配置</TabsTrigger>
            <TabsTrigger value="user">用户模式</TabsTrigger>
          </TabsList>

          {/* 开发者模式配置 */}
          <TabsContent value="developer" className="space-y-6 mt-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>✅ 已预配置，可直接使用</strong>：jm666直连配置已经为你准备好了高性能 AI，
                无需任何 API Key，点击"续写"、"扩写"等按钮即可开始创作。
                <br/>
                <strong>📚 当前配置：</strong>Llama 3.1 70B（128k上下文），适合 1000 章超长篇小说生成。
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">选择模型</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(GROQ_MODELS).map(([id, info]) => (
                    <Card
                      key={id}
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        devModel === id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                          : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                      }`}
                      onClick={() => setDevModel(id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{info.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            info.category === '推荐'
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                              : info.category === '高性能'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {info.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{info.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {info.speed}
                        </span>
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {info.context / 1000}k
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* 参数调节 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Temperature: {devTemperature.toFixed(1)}
                    </Label>
                    <Slider
                      value={[devTemperature]}
                      onValueChange={(v) => setDevTemperature(v[0])}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">控制随机性，越高越有创意</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Tokens: {devMaxTokens}</Label>
                    <Slider
                      value={[devMaxTokens]}
                      onValueChange={(v) => setDevMaxTokens(v[0])}
                      min={512}
                      max={8192}
                      step={512}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">最大生成字数</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Top P: {devTopP.toFixed(2)}</Label>
                    <Slider
                      value={[devTopP]}
                      onValueChange={(v) => setDevTopP(v[0])}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">核采样，控制多样性</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveDeveloperConfig}
                disabled={saving}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
              </Button>
            </div>
          </TabsContent>

          {/* 用户模式配置 */}
          <TabsContent value="user" className="space-y-6 mt-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>使用自己的 API Key</strong>：支持硅基流动（SiliconFlow）、DeepSeek 等服务。
                <a
                  href="https://siliconflow.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-blue-600 hover:underline"
                >
                  前往获取 API Key <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* API Key 输入 */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="请输入 API Key（格式：sk-...）"
                      className="pl-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {saved && (
                    <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  支持 SiliconFlow、DeepSeek 等兼容 OpenAI 格式的 API
                </p>
              </div>

              {/* 模型选择 */}
              <div>
                <Label className="text-base font-semibold mb-3 block">选择模型</Label>
                <Alert className="mb-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs">
                    <strong>长篇生成建议</strong>：选择"长篇旗舰"或"长篇推荐"类别的模型，它们具有更大的上下文窗口（32k-64k），能记住更多情节和人物，适合生成长篇小说。
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {USER_MODELS.map((model) => (
                    <Card
                      key={model.id}
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        selectedModel === model.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-800 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">{model.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            model.category === '长篇旗舰'
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                              : model.category === '长篇推荐'
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              : model.category === '高性能'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : model.category === '性价比'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {model.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{model.description}</p>
                      {model.category === '长篇旗舰' || model.category === '长篇推荐' ? (
                        <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                          <Sparkles className="h-3 w-3" />
                          适合长篇生成
                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </div>

              {/* 参数调节 */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Temperature: {temperature.toFixed(1)}
                    </Label>
                    <Slider
                      value={[temperature]}
                      onValueChange={(v) => setTemperature(v[0])}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">控制随机性，越高越有创意</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Max Tokens: {maxTokens}</Label>
                    <Slider
                      value={[maxTokens]}
                      onValueChange={(v) => setMaxTokens(v[0])}
                      min={512}
                      max={8000}
                      step={256}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">最大生成字数</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Top P: {topP.toFixed(2)}</Label>
                    <Slider
                      value={[topP]}
                      onValueChange={(v) => setTopP(v[0])}
                      min={0}
                      max={1}
                      step={0.05}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">核采样，控制多样性</p>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveUserConfig}
                  disabled={saving || !apiKey.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? '保存中...' : saved ? '✓ 已保存' : '保存配置'}
                </Button>
                {saved && (
                  <Button
                    onClick={handleClearUserConfig}
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    清除配置
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
