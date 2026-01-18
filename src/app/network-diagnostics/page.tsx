'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Network,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  AlertTriangle,
  Activity,
  Clock
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function NetworkDiagnostics() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([
    { name: '浏览器网络连接', status: 'pending', message: '等待测试...' },
    { name: '本地服务器连接', status: 'pending', message: '等待测试...' },
    { name: 'API路由健康检查', status: 'pending', message: '等待测试...' },
    { name: 'LLM服务连接', status: 'pending', message: '等待测试...' },
    { name: 'localStorage读写', status: 'pending', message: '等待测试...' },
  ]);

  const runDiagnostics = async () => {
    setTesting(true);
    setResults([
      { name: '浏览器网络连接', status: 'pending', message: '测试中...' },
      { name: '本地服务器连接', status: 'pending', message: '等待测试...' },
      { name: 'API路由健康检查', status: 'pending', message: '等待测试...' },
      { name: 'LLM服务连接', status: 'pending', message: '等待测试...' },
      { name: 'localStorage读写', status: 'pending', message: '等待测试...' },
    ]);

    const newResults = [...results];

    // 测试1：浏览器网络连接
    try {
      const start = performance.now();
      await fetch('https://www.baidu.com', { mode: 'no-cors' });
      const duration = performance.now() - start;

      newResults[0] = {
        name: '浏览器网络连接',
        status: 'success',
        message: `网络正常 (${duration.toFixed(0)}ms)`,
        duration,
      };
    } catch (error) {
      newResults[0] = {
        name: '浏览器网络连接',
        status: 'error',
        message: '网络不可用，请检查网络连接',
      };
    }
    setResults([...newResults]);

    // 测试2：本地服务器连接
    try {
      const start = performance.now();
      const response = await fetch('/', { method: 'HEAD' });
      const duration = performance.now() - start;

      if (response.ok) {
        newResults[1] = {
          name: '本地服务器连接',
          status: 'success',
          message: `服务器正常 (${duration.toFixed(0)}ms)`,
          duration,
        };
      } else {
        newResults[1] = {
          name: '本地服务器连接',
          status: 'error',
          message: `服务器返回错误: ${response.status}`,
        };
      }
    } catch (error) {
      newResults[1] = {
        name: '本地服务器连接',
        status: 'error',
        message: '无法连接到本地服务器',
      };
    }
    setResults([...newResults]);

    // 测试3：API路由健康检查
    try {
      const start = performance.now();
      const response = await fetch('/api/ai/direct-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      });
      const duration = performance.now() - start;

      if (response.ok) {
        newResults[2] = {
          name: 'API路由健康检查',
          status: 'success',
          message: `API路由正常 (${duration.toFixed(0)}ms)`,
          duration,
        };
      } else {
        const data = await response.json();
        newResults[2] = {
          name: 'API路由健康检查',
          status: 'error',
          message: `API错误: ${data.error || response.statusText}`,
        };
      }
    } catch (error) {
      newResults[2] = {
        name: 'API路由健康检查',
        status: 'error',
        message: `API调用失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
    setResults([...newResults]);

    // 测试4：LLM服务连接
    try {
      const start = performance.now();
      const response = await fetch('/api/ai/direct-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '你好' }),
      });
      const duration = performance.now() - start;

      if (response.ok) {
        newResults[3] = {
          name: 'LLM服务连接',
          status: 'success',
          message: `LLM服务正常 (${duration.toFixed(0)}ms)`,
          duration,
        };
      } else {
        const data = await response.json();
        newResults[3] = {
          name: 'LLM服务连接',
          status: 'error',
          message: `LLM错误: ${data.error || response.statusText}`,
        };
      }
    } catch (error) {
      newResults[3] = {
        name: 'LLM服务连接',
        status: 'error',
        message: `LLM调用失败: ${error instanceof Error ? error.message : '网络错误'}`,
      };
    }
    setResults([...newResults]);

    // 测试5：localStorage读写
    try {
      const start = performance.now();
      const testKey = 'diagnostics-test-' + Date.now();
      const testValue = 'test-value';

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      const duration = performance.now() - start;

      if (retrieved === testValue) {
        newResults[4] = {
          name: 'localStorage读写',
          status: 'success',
          message: `localStorage正常 (${duration.toFixed(0)}ms)`,
          duration,
        };
      } else {
        newResults[4] = {
          name: 'localStorage读写',
          status: 'error',
          message: 'localStorage读写不一致',
        };
      }
    } catch (error) {
      newResults[4] = {
        name: 'localStorage读写',
        status: 'error',
        message: `localStorage错误: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
    setResults([...newResults]);

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-slate-800/50 border-slate-700';
      case 'success':
        return 'bg-green-600/10 border-green-500';
      case 'error':
        return 'bg-red-600/10 border-red-500';
    }
  };

  const allPassed = results.every(r => r.status === 'success');
  const hasError = results.some(r => r.status === 'error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Network className="w-10 h-10" />
              网络诊断工具
            </h1>
            <p className="text-slate-300">
              快速诊断网络和服务连接问题
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>

        {/* 总体状态 */}
        {hasError && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-bold">检测到问题</div>
              <div>请查看下方详细信息，根据提示进行修复</div>
            </AlertDescription>
          </Alert>
        )}

        {allPassed && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-bold">所有测试通过</div>
              <div>您的网络和服务连接正常</div>
            </AlertDescription>
          </Alert>
        )}

        {/* 诊断结果 */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              诊断结果
            </h2>
            <Button
              onClick={runDiagnostics}
              disabled={testing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  开始诊断
                </>
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-white">
                        {result.name}
                      </div>
                      {result.duration && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {result.duration.toFixed(0)}ms
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-slate-300">
                      {result.message}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 解决方案 */}
        {hasError && (
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              常见解决方案
            </h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="font-semibold text-white mb-1">网络错误</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>检查网络连接是否正常</li>
                  <li>尝试刷新页面</li>
                  <li>检查是否使用了代理或VPN</li>
                  <li>尝试更换网络（如切换到手机热点）</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="font-semibold text-white mb-1">服务器错误</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>刷新页面重试</li>
                  <li>检查控制台是否有错误日志（F12）</li>
                  <li>等待几分钟后重试</li>
                  <li>如果问题持续，请联系技术支持</li>
                </ul>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="font-semibold text-white mb-1">LLM服务错误</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>LLM服务可能暂时不可用</li>
                  <li>等待几分钟后重试</li>
                  <li>减少请求内容长度</li>
                  <li>检查API配置是否正确</li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
