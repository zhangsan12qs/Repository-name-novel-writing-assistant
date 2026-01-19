'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Activity, Zap, AlertTriangle, XCircle } from 'lucide-react';
import { perfMonitor } from '@/lib/performance-monitor';

interface PerformancePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformancePanel({ isOpen, onClose }: PerformancePanelProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(perfMonitor.getAllMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClear = () => {
    perfMonitor.clear();
    setMetrics([]);
  };

  const handlePrintReport = () => {
    perfMonitor.printReport();
  };

  // 按名称分组统计
  const groupedMetrics = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            性能监控面板
          </DialogTitle>
          <DialogDescription>
            实时监控应用性能，找出性能瓶颈
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 控制按钮 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? '⏸ 暂停刷新' : '▶ 继续刷新'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              🗑 清空数据
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReport}
            >
              📊 打印报告
            </Button>
          </div>

          {/* 性能概览 */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {metrics.length}
                </div>
                <div className="text-xs text-muted-foreground">总记录数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Object.keys(groupedMetrics).length}
                </div>
                <div className="text-xs text-muted-foreground">监控项</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(Object.values(groupedMetrics) as any[][]).filter((items: any[]) =>
                    items.reduce((sum: number, item: any) => sum + item.duration, 0) / items.length < 50
                  ).length}
                </div>
                <div className="text-xs text-muted-foreground">正常项</div>
              </div>
            </div>
          </Card>

          {/* 详细指标 */}
          <div className="space-y-3">
            {(Object.entries(groupedMetrics) as [string, any[]][]).map(([name, items]: [string, any[]]) => {
              const avgDuration = items.reduce((sum: number, item: any) => sum + item.duration, 0) / items.length;
              const maxDuration = Math.max(...items.map((item: any) => item.duration));
              const count = items.length;
              const isSlow = avgDuration > 50;

              return (
                <Card
                  key={name}
                  className={`p-4 ${isSlow ? 'bg-red-50 dark:bg-red-950' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isSlow ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Zap className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-medium">{name}</span>
                    </div>
                    <Badge variant={isSlow ? 'destructive' : 'secondary'}>
                      {count}次
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">平均耗时：</span>
                      <span className={isSlow ? 'text-red-600 font-bold' : ''}>
                        {avgDuration.toFixed(2)}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">最大耗时：</span>
                      <span className={maxDuration > 100 ? 'text-red-600 font-bold' : ''}>
                        {maxDuration.toFixed(2)}ms
                      </span>
                    </div>
                  </div>
                  {isSlow && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      ⚠️ 平均耗时超过50ms，需要优化
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {Object.keys(groupedMetrics).length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无性能数据</p>
              <p className="text-xs">使用应用功能后，性能数据将自动显示</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
