'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload, RefreshCw, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function RecoverPage() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, any>>({});
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 读取所有localStorage数据
  const loadLocalStorage = () => {
    const data: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          data[key] = value ? JSON.parse(value) : null;
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    setLocalStorageData(data);
    setMessage({ type: 'success', text: `成功读取 ${Object.keys(data).length} 条localStorage数据` });
  };

  useEffect(() => {
    loadLocalStorage();
  }, []);

  // 选择某个key查看详细内容
  const handleSelectKey = (key: string) => {
    setSelectedKey(key);
    const content = JSON.stringify(localStorageData[key], null, 2);
    setJsonContent(content);
  };

  // 导出选中的数据
  const handleExport = () => {
    if (!selectedKey || !localStorageData[selectedKey]) {
      setMessage({ type: 'error', text: '请先选择要导出的数据' });
      return;
    }

    const dataStr = JSON.stringify(localStorageData[selectedKey], null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedKey}-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: '数据已导出' });
  };

  // 导入数据恢复
  const handleImport = () => {
    if (!selectedKey || !jsonContent) {
      setMessage({ type: 'error', text: '请先选择要恢复的数据项' });
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);
      localStorage.setItem(selectedKey, JSON.stringify(parsed));
      setMessage({ type: 'success', text: `数据已恢复到 ${selectedKey}` });
      loadLocalStorage();
    } catch (e) {
      setMessage({ type: 'error', text: 'JSON格式错误，无法导入' });
    }
  };

  // 导出全部数据
  const handleExportAll = () => {
    const dataStr = JSON.stringify(localStorageData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `full-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: '全部数据已导出' });
  };

  // 清空某个key
  const handleClearKey = (key: string) => {
    if (confirm(`确定要清空 ${key} 的数据吗？此操作不可撤销。`)) {
      localStorage.removeItem(key);
      loadLocalStorage();
      if (selectedKey === key) {
        setSelectedKey('');
        setJsonContent('');
      }
      setMessage({ type: 'success', text: `${key} 已清空` });
    }
  };

  // 检查是否有文章数据
  const hasArticleData = () => {
    return 'novelData' in localStorageData || 'chapters' in localStorageData || 'currentChapter' in localStorageData;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <FileText className="w-10 h-10" />
            数据恢复中心
          </h1>
          <p className="text-slate-300">
            检查和恢复你的文章数据
          </p>
        </div>

        {/* 提示信息 */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500 bg-red-500/10' : 
                          message.type === 'success' ? 'border-green-500 bg-green-500/10' :
                          'border-blue-500 bg-blue-500/10'}>
            {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
            {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* 数据状态检测 */}
        {!hasArticleData() && (
          <Alert className="border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              警告：未检测到文章数据。如果你之前写的内容丢失了，可能的原因：
              <ul className="list-disc ml-5 mt-2">
                <li>浏览器隐私模式导致localStorage被清除</li>
                <li>清除了浏览器缓存</li>
                <li>使用了不同的浏览器或设备</li>
              </ul>
              建议你点击"导出全部数据"查看是否有可用的备份数据。
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：数据列表 */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  localStorage数据
                </h2>
                <Button
                  onClick={loadLocalStorage}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新
                </Button>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {Object.keys(localStorageData).length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    暂无数据
                  </div>
                ) : (
                  Object.keys(localStorageData).map((key) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedKey === key
                          ? 'bg-purple-600/20 border border-purple-500'
                          : 'bg-slate-700/30 border border-slate-600 hover:border-slate-500'
                      }`}
                      onClick={() => handleSelectKey(key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate">
                          {key}
                        </span>
                        <span className="text-xs text-slate-400">
                          {typeof localStorageData[key] === 'object' && localStorageData[key] !== null
                            ? `${Object.keys(localStorageData[key]).length} 项`
                            : '文本'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">批量操作</h3>
              <div className="space-y-2">
                <Button
                  onClick={handleExportAll}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出全部数据
                </Button>
              </div>
            </Card>
          </div>

          {/* 右侧：数据详情和编辑 */}
          <div className="lg:col-span-2 space-y-4">
            {selectedKey ? (
              <>
                <Card className="p-4 bg-slate-800/50 border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      {selectedKey}
                    </h2>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExport}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导出
                      </Button>
                      <Button
                        onClick={() => handleClearKey(selectedKey)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        清空
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                    className="min-h-[500px] bg-slate-900/50 border-slate-600 text-slate-200 font-mono text-sm"
                    placeholder="JSON数据内容..."
                  />

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleImport}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      恢复数据
                    </Button>
                  </div>
                </Card>

                {/* 数据预览 */}
                {typeof localStorageData[selectedKey] === 'object' && localStorageData[selectedKey] !== null && (
                  <Card className="p-4 bg-slate-800/50 border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3">数据预览</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(localStorageData[selectedKey], null, 2)}
                      </pre>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-8 bg-slate-800/50 border-slate-700">
                <div className="text-center text-slate-400 py-16">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>请从左侧选择一个数据项查看详情</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            返回写作界面
          </Button>
        </div>
      </div>
    </div>
  );
}
