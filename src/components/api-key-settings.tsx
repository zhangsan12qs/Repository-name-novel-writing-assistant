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
import { Slider } from '@/components/ui/slider';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Sparkles,
  Zap,
  Settings,
  Cpu,
  Key,
  Star,
  ExternalLink
} from 'lucide-react';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
const DEFAULT_CONFIG = {
  apiKey: '',
  model: 'Qwen/Qwen2.5-72B-Instruct',  // 72B参数，32k上下文，适合长篇
  temperature: 0.8,
  maxTokens: 4000,
  topP: 0.9
};

export default function ApiKeySettings({ open, onOpenChange }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CONFIG.model);
  const [temperature, setTemperature] = useState(DEFAULT_CONFIG.temperature);
  const [maxTokens, setMaxTokens] = useState(DEFAULT_CONFIG.maxTokens);
  const [topP, setTopP] = useState(DEFAULT_CONFIG.topP);

  // 加载已保存的配置
  useEffect(() => {
    if (open) {
      loadConfig();
    }
  }, [open]);

  const loadConfig = () => {
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
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }

    console.log('[AI配置] 开始保存用户配置', {
      apiKey: apiKey.substring(0, 10) + '...',
      selectedModel,
      temperature,
      maxTokens,
      topP
    });

    setSaving(true);

    try {
      // 检查 localStorage 是否可用
      if (typeof window === 'undefined') {
        throw new Error('window 对象未定义');
      }

      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage 未定义');
      }

      // 保存到 localStorage
      localStorage.setItem('siliconflow_api_key', apiKey.trim());
      localStorage.setItem('siliconflow_model', selectedModel);
      localStorage.setItem('siliconflow_temperature', temperature.toString());
      localStorage.setItem('siliconflow_maxTokens', maxTokens.toString());
      localStorage.setItem('siliconflow_topP', topP.toString());

      console.log('[AI配置] 用户配置已保存到 localStorage');
      setSaved(true);

      setTimeout(() => {
        setSaving(false);
        console.log('[AI配置] 保存状态已重置');
      }, 500);
    } catch (error) {
      console.error('[AI配置] 保存配置失败:', error);
      setSaving(false);
      alert('保存配置失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleClearConfig = () => {
    if (confirm('确定要清除配置吗？清除后需要重新配置 API Key 才能使用 AI 功能。')) {
      localStorage.removeItem('siliconflow_api_key');
      localStorage.removeItem('siliconflow_model');
      localStorage.removeItem('siliconflow_temperature');
      localStorage.removeItem('siliconflow_maxTokens');
      localStorage.removeItem('siliconflow_topP');
      setApiKey('');
      setSaved(false);
    }
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
            配置硅基流动 API Key，支持多种强大模型进行智能创作
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>📝 如何获取免费 API Key：</strong>
            <br/>
            1. 访问 <a href="https://siliconflow.cn/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">https://siliconflow.cn/</a>
            <br/>
            2. 注册/登录账号
            <br/>
            3. 进入「API Keys」页面
            <br/>
            4. 点击「Create API Key」生成密钥
            <br/>
            5. 复制 API Key 并粘贴到下方输入框
          </AlertDescription>
        </Alert>

        {/* API Key 输入 */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-base font-semibold mb-2 block">
              硅基流动 API Key
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {saved && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-2">
                <CheckCircle className="h-4 w-4" />
                <span>配置已保存</span>
              </div>
            )}
          </div>
        </div>

        {/* 模型选择 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold mb-3 block">选择模型</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {USER_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <Card
                  key={model.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    isSelected
                      ? model.category === '长篇旗舰'
                        ? 'border-purple-600 bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-400'
                        : 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {model.category === '长篇旗舰' && (
                        <Star className="h-4 w-4 text-purple-600 dark:text-purple-400 fill-purple-600" />
                      )}
                      <h4 className="font-semibold text-sm">{model.name}</h4>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        model.category === '长篇旗舰'
                          ? 'bg-purple-600 text-white dark:bg-purple-500'
                          : model.category === '长篇推荐'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : model.category === '性价比'
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {model.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{model.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 参数调节 */}
        <div className="space-y-4">
          <Label className="text-base font-semibold mb-3 block">参数调节</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className="text-xs text-gray-500 dark:text-gray-400">
                控制随机性，0为确定，2为随机
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                Max Tokens: {maxTokens}
              </Label>
              <Slider
                value={[maxTokens]}
                onValueChange={(v) => setMaxTokens(v[0])}
                min={100}
                max={8000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                最大生成字数
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">
                Top P: {topP.toFixed(2)}
              </Label>
              <Slider
                value={[topP]}
                onValueChange={(v) => setTopP(v[0])}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                核采样概率
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClearConfig}
            disabled={!saved}
          >
            清除配置
          </Button>
          <Button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
