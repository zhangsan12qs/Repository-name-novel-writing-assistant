import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  estimatedItemHeight?: number; // 动态高度预估
}

// 高性能虚拟列表组件（优化版）
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 3, // 减少overscan数量，避免渲染过多
  estimatedItemHeight = itemHeight,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);

  // 使用缓存避免重复计算
  const memoizedItems = useMemo(() => items, [JSON.stringify(items.map(i => JSON.stringify(i)).join('|'))]);

  // 计算可见范围（优化版）
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const totalH = memoizedItems.length * estimatedItemHeight;
    const visibleCount = Math.ceil(height / estimatedItemHeight);
    const startIdx = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscanCount);
    const endIdx = Math.min(
      memoizedItems.length - 1,
      Math.ceil((scrollTop + height) / estimatedItemHeight) + overscanCount
    );
    return { startIndex: startIdx, endIndex: endIdx, totalHeight: totalH };
  }, [scrollTop, height, estimatedItemHeight, memoizedItems.length, overscanCount]);

  // 节流滚动事件处理（优化性能）
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (!isScrollingRef.current) {
      setScrollTop(e.currentTarget.scrollTop);
      isScrollingRef.current = true;
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setScrollTop(e.currentTarget.scrollTop);
      isScrollingRef.current = false;
    }, 16); // 16ms ≈ 60fps
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 当 items 变化时，滚动到顶部
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [memoizedItems.length]);

  // 如果列表为空，显示空状态
  if (memoizedItems.length === 0) {
    return (
      <div className={className} style={{ height }}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          暂无数据
        </div>
      </div>
    );
  }

  // 如果项很少，使用普通渲染避免虚拟滚动开销
  if (memoizedItems.length < 10) {
    return (
      <div className={className} style={{ height: 'auto', minHeight: height }}>
        {memoizedItems.map((item, index) => renderItem(item, index, {}))}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto', overflowX: 'hidden', position: 'relative', willChange: 'transform' }}
      className={className}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          pointerEvents: 'none', // 优化点击性能
        }}
      >
        {memoizedItems.slice(startIndex, endIndex + 1).map((item, index) => {
          const actualIndex = startIndex + index;
          const top = actualIndex * estimatedItemHeight;
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: estimatedItemHeight,
                pointerEvents: 'auto', // 恢复子元素的交互
              }}
            >
              {renderItem(item, actualIndex, { height: '100%' })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
