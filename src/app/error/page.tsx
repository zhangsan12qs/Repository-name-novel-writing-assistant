'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Network,
  Activity,
  Database,
  Bug
} from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // 安全访问 error 属性
  const errorName = error?.name || 'Unknown Error';
  const errorMessage = error?.message || 'An unknown error occurred';
  const errorDigest = error?.digest;
  const errorStack = error?.stack;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-slate-900 p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* 错误标题 */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-red-600/20 rounded-full">
              <AlertTriangle className="w-16 h-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white">
            哎呀，出错了
          </h1>
          <p className="text-slate-300 text-lg">
            应用遇到了一个错误，但别担心，你的数据是安全的
          </p>
        </div>

        {/* 错误信息 */}
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-bold">{errorName}</div>
            <div className="text-sm mt-1">{errorMessage}</div>
            {errorDigest && (
              <div className="text-xs text-slate-400 mt-2">
                错误ID: {errorDigest}
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* 快速解决方案 */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">快速解决方案</h2>
          <div className="space-y-3">
            <Button
              onClick={() => reset?.()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新加载页面
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => window.location.href = '/network-diagnostics'}
                variant="outline"
                className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10"
              >
                <Network className="w-4 h-4 mr-2" />
                网络诊断
              </Button>
              <Button
                onClick={() => window.location.href = '/performance-monitor'}
                variant="outline"
                className="border-orange-600 text-orange-400 hover:bg-orange-600/10"
              >
                <Activity className="w-4 h-4 mr-2" />
                性能监控
              </Button>
            </div>

            <Button
              onClick={() => window.location.href = '/data-manager'}
              variant="outline"
              className="w-full border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Database className="w-4 h-4 mr-2" />
              数据管理（检查备份）
            </Button>
          </div>
        </Card>

        {/* 错误详情 */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bug className="w-5 h-5" />
              错误详情
            </h2>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {showDetails ? '隐藏' : '显示'}详情
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">错误名称</div>
                <div className="text-white font-mono">{errorName}</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">错误消息</div>
                <div className="text-white font-mono">{errorMessage}</div>
              </div>
              {errorStack && (
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">堆栈跟踪</div>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                    {errorStack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 返回首页 */}
        <div className="text-center">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Home className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="text-center text-sm text-slate-400">
          <p>如果问题持续，请尝试：</p>
          <ul className="mt-2 space-y-1">
            <li>1. 刷新页面重试</li>
            <li>2. 使用网络诊断工具检查连接</li>
            <li>3. 检查数据管理页面，确保数据已备份</li>
            <li>4. 清除浏览器缓存后重试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
