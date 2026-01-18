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
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKeySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ApiKeySettings({ open, onOpenChange }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 加载已保存的 API Key
  useEffect(() => {
    if (open) {
      loadApiKey();
    }
  }, [open]);

  const loadApiKey = () => {
    const savedKey = localStorage.getItem('siliconflow_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setSaving(true);

    try {
      // 保存到 localStorage
      localStorage.setItem('siliconflow_api_key', apiKey.trim());
      setSaved(true);

      // 显示成功提示
      setTimeout(() => {
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error('保存 API Key 失败:', error);
      setSaving(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('siliconflow_api_key');
    setApiKey('');
    setSaved(false);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return key.substring(0, 4) + '****' + key.substring(key.length - 4);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            API 密钥设置
          </DialogTitle>
          <DialogDescription>
            配置硅基流动 API 密钥以使用 AI 写作功能
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 使用说明 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>如何获取 API 密钥：</strong>
              <br />
              1. 访问 <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer" className="text-primary underline">硅基流动官网</a>
              <br />
              2. 注册/登录账号
              <br />
              3. 进入"API 密钥"页面创建新密钥
              <br />
              4. 复制密钥并粘贴到下方
            </AlertDescription>
          </Alert>

          {/* API Key 输入框 */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">硅基流动 API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={saving}
                  className="pr-10"
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
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  已保存
                </Badge>
              )}
            </div>
          </div>

          {/* 状态提示 */}
          {saved && (
            <Card className="p-3 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                <CheckCircle className="h-4 w-4" />
                <span>API 密钥已配置：{maskApiKey(apiKey)}</span>
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
              清除 API 密钥
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
          <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
            {saving ? '保存中...' : '保存 API 密钥'}
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

// 检查是否已配置 API Key
export function hasApiKey(): boolean {
  return !!localStorage.getItem('siliconflow_api_key');
}
