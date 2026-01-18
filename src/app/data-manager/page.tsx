'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  History,
  Download,
  Upload,
  RefreshCw,
  Save,
  Trash2,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  HardDrive
} from 'lucide-react';
import { dataProtector } from '@/lib/data-protector';

interface DataSnapshot {
  timestamp: number;
  size: number;
  hash: string;
}

export default function DataManager() {
  const [stats, setStats] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<DataSnapshot[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const dataStats = await dataProtector.getDataStats();
      const allSnapshots = await dataProtector.getSnapshots();

      setStats(dataStats);
      setSnapshots(allSnapshots);
      setMessage({ type: 'success', text: '数据加载成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '加载数据失败' });
    }
    setLoading(false);
  };

  const handleManualSave = async () => {
    try {
      // 从主存储获取当前数据
      const currentData = await dataProtector.safeLoad();
      if (currentData) {
        await dataProtector.safeSave(currentData, true);
        setMessage({ type: 'success', text: '数据已手动保存，并创建了新快照' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: '无法获取当前数据' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败' });
    }
  };

  const handleRestoreFromSnapshot = async (timestamp: number) => {
    if (confirm('确定要从此快照恢复吗？当前数据将被覆盖！')) {
      try {
        const restoredData = await dataProtector.restoreFromSnapshot(timestamp);
        if (restoredData) {
          await dataProtector.safeSave(restoredData, true);
          setMessage({ type: 'success', text: '已从快照恢复数据，请刷新页面查看' });
          await loadData();
        } else {
          setMessage({ type: 'error', text: '恢复失败' });
        }
      } catch (error) {
        setMessage({ type: 'error', text: '恢复失败' });
      }
    }
  };

  const handleExportAll = async () => {
    try {
      const allData = await dataProtector.exportAllData();
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `novel-full-backup-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: '所有数据（包括快照）已导出' });
    } catch (error) {
      setMessage({ type: 'error', text: '导出失败' });
    }
  };

  const handleExportSnapshot = async (timestamp: number) => {
    try {
      const snapshotData = await dataProtector.restoreFromSnapshot(timestamp);
      if (snapshotData) {
        const blob = new Blob([JSON.stringify(snapshotData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `snapshot-${timestamp}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: '快照已导出' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '导出失败' });
    }
  };

  const handleCleanOldSnapshots = async () => {
    if (confirm('确定要清理旧快照吗？将只保留最新的5个快照。')) {
      try {
        await dataProtector.cleanOldSnapshots(5);
        setMessage({ type: 'success', text: '已清理旧快照' });
        await loadData();
      } catch (error) {
        setMessage({ type: 'error', text: '清理失败' });
      }
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Database className="w-10 h-10" />
              数据管理中心
            </h1>
            <p className="text-slate-300">
              查看和管理你的所有数据，确保永不丢失
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回写作
          </Button>
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

        {/* 数据统计 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3">
                <HardDrive className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.mainStorageSizeKB} KB</div>
                  <div className="text-sm text-slate-400">主存储大小</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3">
                <History className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.snapshotCount}</div>
                  <div className="text-sm text-slate-400">快照数量</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.lastSaved || '未知'}</div>
                  <div className="text-sm text-slate-400">最后保存</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3">
                <Save className="w-8 h-8 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-white">{stats.chapters} 章</div>
                  <div className="text-sm text-slate-400">章节数量</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 操作按钮 */}
        <Card className="p-4 bg-slate-800/50 border-slate-700">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleManualSave}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              手动保存（创建快照）
            </Button>
            <Button
              onClick={handleExportAll}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Download className="w-4 h-4 mr-2" />
              导出所有数据
            </Button>
            <Button
              onClick={handleCleanOldSnapshots}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清理旧快照
            </Button>
            <Button
              onClick={loadData}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </Card>

        {/* 快照列表 */}
        <Card className="p-4 bg-slate-800/50 border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            快照列表（最多保留10个）
          </h2>

          {snapshots.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              暂无快照，点击"手动保存"创建第一个快照
            </div>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot, index) => (
                <div
                  key={snapshot.timestamp}
                  className={`p-4 rounded-lg border ${
                    index === 0
                      ? 'bg-green-600/10 border-green-500'
                      : 'bg-slate-700/30 border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {index === 0 && (
                          <Badge className="bg-green-600">最新</Badge>
                        )}
                        <div className="text-white font-medium">
                          {formatDate(snapshot.timestamp)}
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 space-y-1">
                        <div>大小: {formatSize(snapshot.size)}</div>
                        <div>哈希: {snapshot.hash}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRestoreFromSnapshot(snapshot.timestamp)}
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-400 hover:bg-green-600/10"
                      >
                        恢复
                      </Button>
                      <Button
                        onClick={() => handleExportSnapshot(snapshot.timestamp)}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 数据内容概览 */}
        {stats && (
          <Card className="p-4 bg-slate-800/50 border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">数据内容概览</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <div className={`text-2xl font-bold ${stats.chapters > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {stats.chapters > 0 ? '✓' : '✗'}
                </div>
                <div className="text-sm text-slate-400">章节</div>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <div className={`text-2xl font-bold ${stats.characters > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                  {stats.characters > 0 ? '✓' : '✗'}
                </div>
                <div className="text-sm text-slate-400">人物 ({stats.characters})</div>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <div className={`text-2xl font-bold ${stats.hasAnalysisResult ? 'text-green-400' : 'text-slate-500'}`}>
                  {stats.hasAnalysisResult ? '✓' : '✗'}
                </div>
                <div className="text-sm text-slate-400">拆书分析结果</div>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                <div className={`text-2xl font-bold ${stats.hasImportData ? 'text-green-400' : 'text-slate-500'}`}>
                  {stats.hasImportData ? '✓' : '✗'}
                </div>
                <div className="text-sm text-slate-400">导入数据</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
