import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Character } from '@/app/page';

interface CharacterItemProps {
  character: Character;
  onRemove: (id: string) => void;
}

// 使用 React.memo 优化，只在 props 变化时重新渲染
export const CharacterItem = memo<CharacterItemProps>(({ character, onRemove }) => {
  return (
    <div className="flex items-start justify-between p-3 bg-muted/50 rounded hover:bg-muted/70 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm">{character.name}</span>
          {character.role && (
            <Badge variant="secondary" className="text-[10px]">
              {character.role}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
            {character.status === 'active' ? '活跃中' :
             character.status === 'inactive' ? '不活跃' :
             character.status === 'deceased' ? '已死亡' : '未知'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-1">
          {character.age && <span>{character.age}</span>}
          {character.personality && character.age && <span className="mx-1">·</span>}
          {character.personality && <span>{character.personality}</span>}
        </div>
        {/* 人物追踪信息 */}
        {character.chapterAppearances.length > 0 && (
          <div className="text-xs mt-1 space-y-0.5">
            <div className="text-blue-600 dark:text-blue-400">
              📍 出现：{character.firstAppearanceChapterTitle} ({character.chapterAppearances.length}次)
            </div>
            {character.appearanceReason && (
              <div className="text-purple-600 dark:text-purple-400">
                💬 出现原因：{character.appearanceReason}
              </div>
            )}
            {character.status !== 'active' && (
              <div className="text-orange-600 dark:text-orange-400">
                🔚 消失：{character.lastAppearanceChapterTitle}
              </div>
            )}
            {character.disappearanceReason && (
              <div className="text-red-600 dark:text-red-400">
                💬 消失原因：{character.disappearanceReason}
              </div>
            )}
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(character.id)}
        className="h-6 w-6 p-0 ml-2 flex-shrink-0 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键字段变化时重新渲染
  return (
    prevProps.character.id === nextProps.character.id &&
    prevProps.character.name === nextProps.character.name &&
    prevProps.character.role === nextProps.character.role &&
    prevProps.character.status === nextProps.character.status &&
    prevProps.character.chapterAppearances.length === nextProps.character.chapterAppearances.length &&
    prevProps.character.firstAppearanceChapterTitle === nextProps.character.firstAppearanceChapterTitle &&
    prevProps.character.lastAppearanceChapterTitle === nextProps.character.lastAppearanceChapterTitle
  );
});

CharacterItem.displayName = 'CharacterItem';
