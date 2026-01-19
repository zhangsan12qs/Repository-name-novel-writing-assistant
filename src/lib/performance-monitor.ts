/**
 * 性能监控工具
 * 用于监控应用性能，找出性能瓶颈
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // 最多保留100条记录

  // 记录性能指标
  record(name: string, startTime: number, endTime?: number): number {
    const duration = endTime ? endTime - startTime : performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // 限制记录数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 警告：如果执行时间超过阈值
    if (duration > 100) {
      console.warn(`[性能警告] ${name} 耗时 ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // 获取所有指标
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // 获取指定名称的指标
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  // 获取平均耗时
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  // 获取最大耗时
  getMaxDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    return Math.max(...metrics.map(m => m.duration));
  }

  // 获取最近N条记录
  getRecentMetrics(count: number = 10): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }

  // 清空所有指标
  clear(): void {
    this.metrics = [];
  }

  // 打印性能报告
  printReport(): void {
    console.log('═══════════════════════════════════════');
    console.log('性能监控报告');
    console.log('═══════════════════════════════════════');

    // 按名称分组统计
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    Object.entries(grouped).forEach(([name, metrics]) => {
      const avg = this.getAverageDuration(name);
      const max = this.getMaxDuration(name);
      const count = metrics.length;

      console.log(`\n${name}:`);
      console.log(`  执行次数: ${count}`);
      console.log(`  平均耗时: ${avg.toFixed(2)}ms`);
      console.log(`  最大耗时: ${max.toFixed(2)}ms`);

      if (avg > 50) {
        console.log(`  ⚠️ 警告: 平均耗时超过50ms，需要优化`);
      }
    });

    console.log('═══════════════════════════════════════');
  }
}

// 导出单例
export const perfMonitor = new PerformanceMonitor();

// 便捷函数：包装异步函数以监控性能
export async function withPerformanceMonitoring<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    perfMonitor.record(name, startTime);
    return result;
  } catch (error) {
    perfMonitor.record(name, startTime);
    throw error;
  }
}

// 便捷函数：包装同步函数以监控性能
export function withPerformanceMonitoringSync<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  try {
    const result = fn();
    perfMonitor.record(name, startTime);
    return result;
  } catch (error) {
    perfMonitor.record(name, startTime);
    throw error;
  }
}
