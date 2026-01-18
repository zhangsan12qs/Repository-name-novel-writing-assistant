'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, FileText, Download, Upload } from 'lucide-react';

export default function BookAnalysisRecover() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [partialData, setPartialData] = useState<any>(null);
  const [importData, setImportData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // 检查拆书分析相关的数据
    checkData();
  }, []);

  const checkData = () => {
    const analysisResult = localStorage.getItem('analysisResult');
    const partialResults = localStorage.getItem('partialResults');
    const importData = localStorage.getItem('importData');

    console.log('Checking book analysis data...');
    console.log('analysisResult:', analysisResult);
    console.log('partialResults:', partialResults);
    console.log('importData:', importData);

    if (analysisResult) {
      try {
        setAnalysisData(JSON.parse(analysisResult));
        setMessage({ type: 'success', text: '找到拆书分析结果数据！' });
      } catch (e) {
        setMessage({ type: 'error', text: '拆书分析结果数据损坏' });
      }
    }

    if (partialResults) {
      try {
        setPartialData(JSON.parse(partialResults));
        if (!message) {
          setMessage({ type: 'success', text: '找到拆书分析部分结果数据！' });
        }
      } catch (e) {
        if (!message) {
          setMessage({ type: 'error', text: '拆书分析部分结果数据损坏' });
        }
      }
    }

    if (importData) {
      try {
        setImportData(JSON.parse(importData));
        if (!message) {
          setMessage({ type: 'success', text: '找到导入数据！' });
        }
      } catch (e) {
        if (!message) {
          setMessage({ type: 'error', text: '导入数据损坏' });
        }
      }
    }

    if (!analysisResult && !partialResults && !importData) {
      setMessage({ type: 'error', text: '未找到任何拆书分析数据！' });
    }
  };

  const exportData = (data: any, filename: string) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: `${filename} 已导出` });
  };

  const restoreData = () => {
    // 恢复数据到localStorage
    if (analysisData) {
      localStorage.setItem('analysisResult', JSON.stringify(analysisData));
    }
    if (partialData) {
      localStorage.setItem('partialResults', JSON.stringify(partialData));
    }
    if (importData) {
      localStorage.setItem('importData', JSON.stringify(importData));
    }
    setMessage({ type: 'success', text: '数据已恢复到localStorage，刷新页面后即可使用' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <FileText className="w-10 h-10 text-red-500" />
            拆书分析数据恢复
          </h1>
          <p className="text-slate-300">
            检查和恢复你的拆书分析内容
          </p>
        </div>

        {/* 消息提示 */}
        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500 bg-red-500/10' : 
                          message.type === 'success' ? 'border-green-500 bg-green-500/10' :
                          'border-blue-500 bg-blue-500/10'}>
            {message.type === 'error' && <AlertTriangle className="h-4 w-4" />}
            {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* 数据展示 */}
        {analysisData && (
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">analysisResult (拆书分析结果)</h2>
              <Button
                onClick={() => exportData(analysisData, 'analysisResult')}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-600/10"
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(analysisData, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {partialData && (
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">partialResults (部分结果)</h2>
              <Button
                onClick={() => exportData(partialData, 'partialResults')}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-600/10"
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(partialData, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {importData && (
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-white">importData (导入数据)</h2>
              <Button
                onClick={() => exportData(importData, 'importData')}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-400 hover:bg-green-600/10"
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(importData, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        {/* 操作按钮 */}
        {(analysisData || partialData || importData) && (
          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={restoreData}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              恢复数据并返回写作界面
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              返回写作界面
            </Button>
          </div>
        )}

        {/* 没有数据的情况 */}
        {!analysisData && !partialData && !importData && (
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-bold">未找到拆书分析数据！</p>
                <p>可能的原因：</p>
                <ul className="list-disc ml-5">
                  <li>清除了浏览器缓存或localStorage</li>
                  <li>使用了隐私/无痕模式</li>
                  <li>更换了浏览器或设备</li>
                </ul>
                <p className="mt-2">如果你有之前导出的备份文件，可以手动恢复。非常抱歉造成数据丢失！</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
