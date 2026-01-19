import React, { useMemo, useRef, useEffect, useState } from 'react';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

// 简化版虚拟列表组件（不依赖外部库）
export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 计算可见范围
  const { startIndex, endIndex } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(height / itemHeight);
    const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const endIdx = Math.min(items.length - 1, Math.ceil((scrollTop + height) / itemHeight) + overscanCount);
    return { startIndex: startIdx, endIndex: endIdx };
  }, [scrollTop, height, itemHeight, items.length, overscanCount]);

  // 计算总高度
  const totalHeight = items.length * itemHeight;

  // 处理滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // 当 items 变化时，滚动到顶部
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  // 如果列表为空或项很少，使用普通渲染避免虚拟滚动开销
  if (items.length < 10) {
    return (
      <div className={className} style={{ height: items.length * itemHeight }}>
        {items.map((item, index) => renderItem(item, index, {}))}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      className={className}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.slice(startIndex, endIndex + 1).map((item, index) => {
          const actualIndex = startIndex + index;
          const top = actualIndex * itemHeight;
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex, {})}
            </div>
          );
        })}
      </div>
    </div>
  );
}
