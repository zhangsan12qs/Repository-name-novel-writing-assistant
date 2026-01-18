'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Database,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Trash2,
  ArrowLeft,
  HardDrive,
  Cpu,
  Timer,
  Settings,
  History,
  BookOpen,
  Lightbulb,
  Shield
} from 'lucide-react';
import { dataProtector } from '@/lib/data-protector';

interface PerformanceMetrics {
  // IndexedDB统计
  indexedDB: {
    totalSize: number;
    totalSizeKB: string;
    mainSize: number;
    mainSizeKB: string;
    chapterSize: number;
    chapterSizeKB: string;
    chapterCount: number;
    analysisSize: number;
    analysisSizeKB: string;
    snapshotsSize: number;
    snapshotsSizeKB: string;
    snapshotCount: number;
  };
  // localStorage统计（仅备份）
  localStorage: {
    backupSize: number;
    backupSizeKB: string;
    snapshotsSize: number;
    snapshotsSizeKB: string;
  };
  // 数据统计
  data: {
    lastSaved: string;
    chapters: number;
    characters: number;
    volumes: number;
    hasAnalysisResult: boolean;
    hasPartialResults: boolean;
    hasImportData: boolean;
  };
  // 使用率估算
  usage: {
    indexedDBUsed: string;
    localStorageUsed: string;
  };
  // 性能指标
  renderTime: number;
  memoryUsage: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const measurePerformance = useCallback(async () => {
    setLoading(true);

    try {
      // 等待IndexedDB初始化
      await dataProtector.init();

      // 测量渲染时间
      const start = performance.now();
      document.body.offsetHeight;
      const renderTime = performance.now() - start;

      // 从数据保护器获取统计信息
      const stats = await dataProtector.getDataStats();

      if (!stats) {
        throw new Error('无法获取存储统计信息');
      }

      const memoryUsage = stats.indexedDB?.totalSize || 0;

      const newMetrics: PerformanceMetrics = {
        indexedDB: stats.indexedDB || {
          totalSize: 0,
          totalSizeKB: '0',
          mainSize: 0,
          mainSizeKB: '0',
          chapterSize: 0,
          chapterSizeKB: '0',
          chapterCount: 0,
          analysisSize: 0,
          analysisSizeKB: '0',
          snapshotsSize: 0,
          snapshotsSizeKB: '0',
          snapshotCount: 0,
        },
        localStorage: stats.localStorage || {
          backupSize: 0,
          backupSizeKB: '0',
          snapshotsSize: 0,
          snapshotsSizeKB: '0',
        },
        data: stats.data || {
          lastSaved: '未知',
          chapters: 0,
          characters: 0,
          volumes: 0,
          hasAnalysisResult: false,
          hasPartialResults: false,
          hasImportData: false,
        },
        usage: stats.usage || {
          indexedDBUsed: '0',
          localStorageUsed: '0',
        },
        renderTime,
        memoryUsage,
      };

      setMetrics(newMetrics);
      generateRecommendations(newMetrics);
      setInitialized(true);
    } catch (error) {
      console.error('性能测量失败:', error);
      alert('性能测量失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateRecommendations = (m: PerformanceMetrics) => {
    const recs: string[] = [];

    // localStorage使用率
    const localPercent = parseFloat(m.usage.localStorageUsed);
    if (localPercent > 80) {
      recs.push('🚨 localStorage使用率超过80%，建议清理备份');
    } else if (localPercent > 60) {
      recs.push('⚠️ localStorage使用率较高，仅用作备份，无需担心');
    }

    // IndexedDB使用率
    const idbPercent = parseFloat(m.usage.indexedDBUsed);
    if (idbPercent > 50) {
      recs.push('⚠️ IndexedDB使用量较大（>50MB），建议定期清理旧快照');
    }

    // 章节数量
    if (m.data.chapters > 200) {
      recs.push('💡 章节数量超过200章，建议使用分卷管理');
    } else if (m.data.chapters > 100) {
      recs.push('💡 章节数量较多，考虑使用分卷管理');
    }

    // 章节数据大小
    const chapterMB = parseFloat(m.indexedDB.chapterSizeKB) / 1024;
    if (chapterMB > 50) {
      recs.push('💡 章节数据超过50MB，建议定期导出备份');
    }

    // 分析结果大小
    const analysisMB = parseFloat(m.indexedDB.analysisSizeKB) / 1024;
    if (analysisMB > 10) {
      recs.push('💡 拆书分析结果较大，分析完成后可考虑清理');
    }

    // 快照数量
    if (m.indexedDB.snapshotCount > 10) {
      recs.push('🧹 快照数量过多，建议清理旧快照');
    }

    // 渲染时间
    if (m.renderTime > 1000) {
      recs.push('🐌 渲染时间过长（>1s），存在性能问题');
    } else if (m.renderTime > 500) {
      recs.push('⚠️ 渲染时间较长，建议优化');
    }

    // 总字数估算
    const totalMB = parseFloat(m.indexedDB.totalSizeKB) / 1024;
    if (totalMB > 100) {
      recs.push('📚 数据量超过100MB，IndexedDB性能良好，无需担心');
    }

    // 存储状态提示
    if (localPercent < 30 && idbPercent < 30) {
      recs.push('✅ 存储状态良好，IndexedDB提供充足空间');
    }

    if (recs.length === 0) {
      recs.push('✅ 性能状态良好，无需优化');
    }

    setRecommendations(recs);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatTime = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString('zh-CN');
    } catch {
      return '未知';
    }
  };

  const handleOptimize = async () => {
    setLoading(true);

    try {
      // 清理旧快照（保留5个）
      await dataProtector.cleanOldSnapshots(5);

      await new Promise(resolve => setTimeout(resolve, 500));
      await measurePerformance();

      alert('优化完成！已清理旧快照。');
    } catch (error) {
      alert('优化失败：' + error);
    }

    setLoading(false);
  };

  const handleExportData = async () => {
    try {
      const data = await dataProtector.exportAllData();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `novel-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('数据导出成功！');
    } catch (error) {
      alert('导出失败：' + error);
    }
  };

  const handleClearAll = async () => {
    if (confirm('⚠️ 警告：这将清空所有数据！\n\n请确保你已经导出了备份。\n\n确定要继续吗？')) {
      try {
        await dataProtector.clearAll();
        alert('所有数据已清空。刷新页面将恢复到初始状态。');
        await measurePerformance();
      } catch (error) {
        alert('清空失败：' + error);
      }
    }
  };

  const getStatusColor = (value: number, threshold: number): string => {
    if (value > threshold) return 'text-red-500';
    if (value > threshold * 0.7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusProgressColor = (value: number, threshold: number): string => {
    if (value > threshold) return 'bg-red-500';
    if (value > threshold * 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  useEffect(() => {
    measurePerformance();
  }, [measurePerformance]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Activity className="w-10 h-10" />
              性能监控中心
            </h1>
            <p className="text-slate-300">
              实时监控应用性能，IndexedDB提供大数据支持
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={measurePerformance}
              variant="outline"
              disabled={loading}
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新监控
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回写作
            </Button>
          </div>
        </div>

        {/* IndexedDB存储状态 */}
        {metrics && initialized && (
          <Card className="p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-400" />
              <h2 className="text-lg font-bold text-white">IndexedDB 存储状态</h2>
              <Badge variant="outline" className="border-green-500 text-green-400">
                主存储
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 总存储量 */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">总存储量</div>
                <div className="text-2xl font-bold text-white">
                  {formatBytes(metrics.indexedDB.totalSize)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  使用率约 {metrics.usage.indexedDBUsed}%
                </div>
                <Progress
                  value={parseFloat(metrics.usage.indexedDBUsed)}
                  className="mt-2 h-2"
                />
              </div>

              {/* 章节数据 */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">章节数据</div>
                <div className="text-2xl font-bold text-white">
                  {formatBytes(metrics.indexedDB.chapterSize)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {metrics.indexedDB.chapterCount} 个章节
                </div>
              </div>

              {/* 快照数据 */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">快照数据</div>
                <div className="text-2xl font-bold text-white">
                  {formatBytes(metrics.indexedDB.snapshotsSize)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {metrics.indexedDB.snapshotCount} 个快照
                </div>
              </div>
            </div>

            {/* 详细数据 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/30 rounded p-2">
                <span className="text-slate-500">主数据：</span>
                <span className="text-white ml-1">{metrics.indexedDB.mainSizeKB} KB</span>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <span className="text-slate-500">分析结果：</span>
                <span className="text-white ml-1">{metrics.indexedDB.analysisSizeKB} KB</span>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <span className="text-slate-500">人物：</span>
                <span className="text-white ml-1">{metrics.data.characters} 个</span>
              </div>
              <div className="bg-slate-800/30 rounded p-2">
                <span className="text-slate-500">分卷：</span>
                <span className="text-white ml-1">{metrics.data.volumes} 个</span>
              </div>
            </div>
          </Card>
        )}

        {/* localStorage备份状态 */}
        {metrics && initialized && (
          <Card className="p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive className="w-6 h-6 text-slate-400" />
              <h2 className="text-lg font-bold text-white">localStorage 备份状态</h2>
              <Badge variant="outline" className="border-slate-500 text-slate-400">
                仅备份
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">备份数据</div>
                <div className="text-xl font-bold text-white">
                  {formatBytes(metrics.localStorage.backupSize)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  使用率 {metrics.usage.localStorageUsed}% / 100%
                </div>
                <Progress
                  value={parseFloat(metrics.usage.localStorageUsed)}
                  className="mt-2 h-2"
                />
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-2">快照备份</div>
                <div className="text-xl font-bold text-white">
                  {formatBytes(metrics.localStorage.snapshotsSize)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  localStorage快照（旧版本）
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 性能指标 */}
        {metrics && initialized && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 渲染时间 */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-8 h-8 text-green-500" />
                <div className="text-sm text-slate-400">渲染时间</div>
              </div>
              <div className={`text-3xl font-bold ${getStatusColor(metrics.renderTime, 500)}`}>
                {metrics.renderTime.toFixed(2)}ms
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {metrics.renderTime > 500 ? '建议优化' : '性能良好'}
              </div>
            </Card>

            {/* 最后保存时间 */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <Timer className="w-8 h-8 text-orange-500" />
                <div className="text-sm text-slate-400">最后保存</div>
              </div>
              <div className="text-lg font-bold text-white">
                {formatTime(metrics.data.lastSaved)}
              </div>
            </Card>

            {/* 数据统计 */}
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-8 h-8 text-purple-500" />
                <div className="text-sm text-slate-400">数据统计</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">章节：</span>
                  <span className="text-white">{metrics.data.chapters} 章</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">人物：</span>
                  <span className="text-white">{metrics.data.characters} 个</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">分析结果：</span>
                  <span className="text-white">{metrics.data.hasAnalysisResult ? '✓' : '✗'}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 优化建议 */}
        {recommendations.length > 0 && (
          <Card className="p-6 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-amber-400" />
              <h2 className="text-lg font-bold text-white">优化建议</h2>
            </div>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <span className="text-lg">{rec.charAt(0)}</span>
                  <span className="text-sm text-slate-300">{rec.slice(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 操作按钮 */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-slate-400" />
            <h2 className="text-lg font-bold text-white">数据管理</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleOptimize}
              variant="outline"
              disabled={loading}
              className="border-green-600 text-green-400 hover:bg-green-600/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              清理快照
            </Button>
            <Button
              onClick={handleExportData}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Download className="w-4 h-4 mr-2" />
              导出备份
            </Button>
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空数据
            </Button>
          </div>
        </Card>

        {/* 存储说明 */}
        <Alert className="bg-blue-900/30 border-blue-800">
          <Shield className="w-4 h-4 text-blue-400" />
          <AlertDescription className="text-blue-300">
            <strong>存储架构说明：</strong>应用使用IndexedDB作为主存储，支持大数据量（可达数百MB），
            章节内容和拆书分析结果单独存储，避免主数据过大。localStorage仅用作轻量级备份，
            不占用主要存储空间。
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
