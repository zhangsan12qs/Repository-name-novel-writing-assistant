import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle, FileText } from 'lucide-react';
import type { Chapter } from '@/app/page';

interface ChapterItemProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: (chapter: Chapter) => void;
  onDelete: (id: string) => void;
}

// 使用 React.memo 优化，只在 props 变化时重新渲染
export const ChapterItem = memo<ChapterItemProps>(({ chapter, isActive, onSelect, onDelete }) => {
  const handleClick = () => onSelect(chapter);

  return (
    <div
      className={`
        flex items-center justify-between p-3 rounded cursor-pointer transition-all
        ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted/70'}
      `}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <FileText className="h-3 w-3 flex-shrink-0" />
          <span className="font-medium text-sm truncate">{chapter.title}</span>
          {isActive && <Edit className="h-3 w-3 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>{chapter.wordCount} 字</span>
          {chapter.status === 'completed' && (
            <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-2 w-2 mr-1" />
              已完成
            </Badge>
          )}
          {chapter.status === 'in_progress' && (
            <Badge variant="outline" className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">
              进行中
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(chapter.id);
        }}
        className={`
          h-6 w-6 p-0 ml-2 flex-shrink-0
          ${isActive ? 'hover:bg-primary-foreground/20' : 'hover:text-red-600 hover:bg-red-50'}
        `}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键字段变化时重新渲染
  return (
    prevProps.chapter.id === nextProps.chapter.id &&
    prevProps.chapter.title === nextProps.chapter.title &&
    prevProps.chapter.wordCount === nextProps.chapter.wordCount &&
    prevProps.chapter.status === nextProps.chapter.status &&
    prevProps.isActive === nextProps.isActive
  );
});

ChapterItem.displayName = 'ChapterItem';
