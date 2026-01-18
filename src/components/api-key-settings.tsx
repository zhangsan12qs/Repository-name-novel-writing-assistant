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
import { Checkbox } from '@/components/ui/checkbox';
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
  Info
} from 'lucide-react';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 支持的模型列表
const SUPPORTED_MODELS = [
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek-V3',
    description: 'DeepSeek 最新旗舰模型，性能卓越',
    category: '推荐'
  },
  {
    id: 'deepseek-ai/DeepSeek-V2.5',
    name: 'DeepSeek-V2.5',
    description: '性能均衡，成本更低',
    category: '性价比'
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen2.5-7B',
    description: '阿里通义千问，中文能力强',
    category: '中文优化'
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama-3.1-8B',
    description: 'Meta 开源模型，多语言支持',
    category: '开源'
  },
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen2.5-72B',
    description: '72B 参数，顶级性能',
    category: '高性能'
  }
];

// 默认配置
const DEFAULT_CONFIG = {
  apiKey: '',
  model: 'deepseek-ai/DeepSeek-V3',
  temperature: 0.8,
  maxTokens: 2000,
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
  const [validating, setValidating] = useState(false);
  const [valid, setValid] = useState(false);

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

  const handleSave = async () => {
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

  const handleClear = () => {
    localStorage.removeItem('siliconflow_api_key');
    localStorage.removeItem('siliconflow_model');
    localStorage.removeItem('siliconflow_temperature');
    localStorage.removeItem('siliconflow_maxTokens');
    localStorage.removeItem('siliconflow_topP');
    setApiKey('');
    setSaved(false);
    setSelectedModel(DEFAULT_CONFIG.model);
    setTemperature(DEFAULT_CONFIG.temperature);
    setMaxTokens(DEFAULT_CONFIG.maxTokens);
    setTopP(DEFAULT_CONFIG.topP);
    setValid(false);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            大模型配置
          </DialogTitle>
          <DialogDescription>
            配置 AI 模型和参数以启用智能写作功能
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 配置要求 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-2">
              <div className="font-semibold">配置要求：</div>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>需要硅基流动 API Key（访问 <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer" className="text-primary underline">siliconflow.cn</a> 获取）</li>
                <li>API Key 格式：sk- 开头的字符串</li>
                <li>建议使用付费账户以获得更高请求频率</li>
                <li>免费账户有请求频率限制，可能影响使用体验</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* API Key 配置 */}
          <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">API 密钥配置</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="font-medium">
                API 密钥 <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={saving}
                    className="pr-10 text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {saved && (
                  <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <CheckCircle className="h-3 w-3" />
                    已配置
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                必须以 sk- 开头，长度通常在 40-60 个字符
              </p>
            </div>
          </Card>

          {/* 模型选择 */}
          <Card className="p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">模型选择</h3>
            </div>
            <div className="space-y-2">
              <Label>选择模型 <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-1 gap-2">
                {SUPPORTED_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedModel === model.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedModel === model.id}
                          onChange={() => setSelectedModel(model.id)}
                          className="pointer-events-none"
                        />
                        <span className="font-medium">{model.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {model.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      {model.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 参数配置 */}
          <Card className="p-4 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">生成参数配置</h3>
            </div>
            <div className="space-y-4">
              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="font-medium">
                    Temperature (温度)
                  </Label>
                  <span className="text-sm text-muted-foreground">{temperature}</span>
                </div>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  控制生成的随机性：0 更确定性，2 更创造性
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxTokens" className="font-medium">
                    Max Tokens (最大字数)
                  </Label>
                  <span className="text-sm text-muted-foreground">{maxTokens}</span>
                </div>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  单次生成最大字数，建议 1000-4000
                </p>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="topP" className="font-medium">
                    Top P (核采样)
                  </Label>
                  <span className="text-sm text-muted-foreground">{topP}</span>
                </div>
                <Input
                  id="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  控制生成词汇范围：0.9 通常效果较好
                </p>
              </div>
            </div>
          </Card>

          {/* 状态提示 */}
          {saved && (
            <Card className="p-3 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <span>配置已保存：{maskApiKey(apiKey)} | {SUPPORTED_MODELS.find(m => m.id === selectedModel)?.name}</span>
              </div>
            </Card>
          )}

          {/* 清除按钮 */}
          {saved && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full text-destructive hover:text-destructive"
              disabled={saving}
            >
              清除所有配置
            </Button>
          )}

          {/* 安全提示 */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription className="text-xs">
              您的 API 密钥将保存在浏览器本地存储中，不会上传到任何服务器。
              请妥善保管，不要在公共场所泄露您的密钥。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 获取保存的 API Key 的辅助函数
export function getSavedApiKey(): string | null {
  return localStorage.getItem('siliconflow_api_key');
}

// 获取保存的模型配置
export function getSavedModel(): string {
  return localStorage.getItem('siliconflow_model') || 'deepseek-ai/DeepSeek-V3';
}

// 获取保存的参数配置
export function getSavedParams(): {
  temperature: number;
  maxTokens: number;
  topP: number;
} {
  return {
    temperature: parseFloat(localStorage.getItem('siliconflow_temperature') || '0.8'),
    maxTokens: parseInt(localStorage.getItem('siliconflow_maxTokens') || '2000'),
    topP: parseFloat(localStorage.getItem('siliconflow_topP') || '0.9'),
  };
}

// 检查是否已配置 API Key
export function hasApiKey(): boolean {
  return !!localStorage.getItem('siliconflow_api_key');
}
