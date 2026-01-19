'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Repeat,
  SkipForward,
  SkipBack,
  Music,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  category: string;
  url: string;
  duration?: number;
};

// 预设背景音乐列表
const PRESET_TRACKS: MusicTrack[] = [
  // 轻音乐
  {
    id: '1',
    name: 'Morning Light',
    artist: 'Piano Music',
    category: '轻音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    name: 'Gentle Breeze',
    artist: 'Classical',
    category: '轻音乐',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  // 自然声音
  {
    id: '3',
    name: 'Rain Sounds',
    artist: 'Nature',
    category: '自然声音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: '4',
    name: 'Ocean Waves',
    artist: 'Nature',
    category: '自然声音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  // 钢琴曲
  {
    id: '5',
    name: 'Piano Dreams',
    artist: 'Piano',
    category: '钢琴曲',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: '6',
    name: 'Soft Piano',
    artist: 'Piano',
    category: '钢琴曲',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  // 环境音
  {
    id: '7',
    name: 'Coffee Shop',
    artist: 'Ambient',
    category: '环境音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    id: '8',
    name: 'Forest Birds',
    artist: 'Nature',
    category: '自然声音',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
];

type RepeatMode = 'none' | 'all' | 'one';

// 使用 memo 优化播放列表项组件
const TrackItem = memo<{
  track: MusicTrack;
  isPlaying: boolean;
  isCurrent: boolean;
  onSelect: (track: MusicTrack) => void;
}>(({ track, isPlaying, isCurrent, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(track)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group ${
        isCurrent
          ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border-2 border-purple-300 dark:border-purple-700 shadow-md'
          : 'hover:bg-white/80 dark:hover:bg-gray-800/80 border border-transparent hover:border-purple-200 dark:hover:border-purple-800'
      }`}
    >
      {isPlaying && isCurrent ? (
        <div className="flex gap-0.5 items-end h-5 flex-shrink-0">
          <div className="w-1.5 h-4 bg-gradient-to-t from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
          <div className="w-1.5 h-5 bg-gradient-to-t from-pink-600 to-purple-600 rounded-full animate-pulse delay-100"></div>
          <div className="w-1.5 h-3 bg-gradient-to-t from-purple-600 to-pink-600 rounded-full animate-pulse delay-200"></div>
        </div>
      ) : (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCurrent ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400'
        }`}>
          <Music className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-semibold truncate mb-0.5 ${
          isCurrent ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'
        }`}>
          {track.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {track.artist}
        </div>
      </div>
      {isCurrent && isPlaying && (
        <span className="badge-green flex-shrink-0 animate-pulse">播放中</span>
      )}
    </button>
  );
});

TrackItem.displayName = 'TrackItem';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeBeforeMuteRef = useRef(50);

  // 优化音量控制，使用 useCallback
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  }, []);

  // 优化静音切换
  const handleToggleMute = useCallback(() => {
    if (isMuted) {
      // 恢复音量
      const restoredVolume = volumeBeforeMuteRef.current;
      setVolume(restoredVolume);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = restoredVolume / 100;
      }
    } else {
      // 记录当前音量并静音
      volumeBeforeMuteRef.current = volume;
      setIsMuted(true);
      setVolume(0);
      if (audioRef.current) {
        audioRef.current.volume = 0;
      }
    }
  }, [isMuted, volume]);

  // 优化播放/暂停
  const handlePlayPause = useCallback(async () => {
    if (!currentTrack) {
      const firstTrack = PRESET_TRACKS[0];
      setCurrentTrack(firstTrack);
      setIsPlaying(true);
    } else {
      try {
        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else {
          setIsLoading(true);
          setError(null);
          await audioRef.current?.play();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error('播放失败:', err);
        setError(err instanceof Error ? err.message : '播放失败');
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentTrack, isPlaying]);

  // 优化选择曲目
  const handleSelectTrack = useCallback(async (track: MusicTrack) => {
    if (currentTrack?.id === track.id && isPlaying) {
      // 点击当前播放的曲目，暂停播放
      handlePlayPause();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setError(null);
    }
  }, [currentTrack, isPlaying, handlePlayPause]);

  // 优化上一首/下一首
  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    const currentIndex = PRESET_TRACKS.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % PRESET_TRACKS.length;
    setCurrentTrack(PRESET_TRACKS[nextIndex]);
  }, [currentTrack]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    const currentIndex = PRESET_TRACKS.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? PRESET_TRACKS.length - 1 : currentIndex - 1;
    setCurrentTrack(PRESET_TRACKS[prevIndex]);
  }, [currentTrack]);

  const handleToggleRepeat = useCallback(() => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  }, [repeatMode]);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // 音频事件处理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoaded = () => setIsLoading(false);
    const handleError = (e: Event) => {
      console.error('音频加载错误:', e);
      setError('音频加载失败');
      setIsLoading(false);
      setIsPlaying(false);
    };
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else if (repeatMode === 'all') {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadeddata', handleLoaded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadeddata', handleLoaded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, handleNext]);

  // 自动播放控制
  useEffect(() => {
    if (currentTrack && isPlaying && audioRef.current) {
      setIsLoading(true);
      setError(null);
      audioRef.current.play().catch((err) => {
        console.error('自动播放失败:', err);
        setError(err instanceof Error ? err.message : '播放失败');
        setIsPlaying(false);
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [currentTrack, isPlaying]);

  // 获取循环图标
  const getRepeatIcon = useCallback(() => {
    switch (repeatMode) {
      case 'one':
        return (
          <div className="relative">
            <Repeat className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>
          </div>
        );
      case 'all':
        return <Repeat className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4 text-gray-400" />;
    }
  }, [repeatMode]);

  // 分组曲目
  const groupedTracks = React.useMemo(() => {
    return PRESET_TRACKS.reduce((acc, track) => {
      if (!acc[track.category]) {
        acc[track.category] = [];
      }
      acc[track.category].push(track);
      return acc;
    }, {} as Record<string, MusicTrack[]>);
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        autoPlay={isPlaying}
        preload="metadata"
      />

      {/* 最小化状态 */}
      {!isExpanded && (
        <Card className="fixed bottom-6 right-6 p-3 shadow-2xl glass-strong border-2 border-purple-200/30 dark:border-purple-800/30 cursor-pointer hover:scale-105 hover:shadow-purple-500/20 transition-all duration-300 z-50 group animate-fade-in">
          <div className="flex items-center gap-3" onClick={() => setIsExpanded(true)}>
            <div className="relative flex-shrink-0">
              <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              {isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5 items-end h-4">
                    <div className="w-1 h-3 bg-purple-500 animate-pulse rounded-full"></div>
                    <div className="w-1 h-4 bg-pink-500 animate-pulse delay-100 rounded-full"></div>
                    <div className="w-1 h-2 bg-purple-500 animate-pulse delay-200 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {currentTrack?.name || '背景音乐'}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {currentTrack?.artist || '点击播放'}
              </span>
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="ml-auto flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="flex-shrink-0 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* 展开状态 */}
      {isExpanded && (
        <Card className="fixed bottom-6 right-6 w-96 shadow-2xl glass-strong border-2 border-purple-200/30 dark:border-purple-800/30 z-50 max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
          {/* 顶部装饰条 */}
          <div className="h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 animate-shimmer" />

          <div className="p-5 flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gradient-purple">背景音乐</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">享受创作时光</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
                className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 flex-shrink-0 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* 当前播放卡片 */}
            {currentTrack && (
              <div className="mb-5 p-4 bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl border border-purple-200/50 dark:border-purple-800/50 flex-shrink-0 hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {currentTrack.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentTrack.artist} · <span className="badge-purple inline-block ml-1">{currentTrack.category}</span>
                    </p>
                  </div>
                  {isPlaying && (
                    <div className="flex gap-0.5 items-end h-6 ml-2 flex-shrink-0">
                      <div className="w-1.5 h-4 bg-purple-500 animate-pulse rounded-full"></div>
                      <div className="w-1.5 h-6 bg-pink-500 animate-pulse delay-100 rounded-full"></div>
                      <div className="w-1.5 h-3 bg-purple-500 animate-pulse delay-200 rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleSeek}
                      max={duration}
                      step={0.1}
                      className="[&_[role=slider]]:h-2 [&_[role=slider]]:bg-purple-100 dark:[&_[role=slider]]:bg-purple-900"
                    />
                  </div>
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12 text-right flex-shrink-0">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-3 mb-5 flex-shrink-0">
              <Button
                size="sm"
                onClick={handleToggleRepeat}
                title={repeatMode === 'one' ? '单曲循环' : repeatMode === 'all' ? '列表循环' : '不循环'}
                variant="ghost"
                className={`rounded-full w-10 h-10 ${repeatMode !== 'none' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : ''}`}
              >
                {getRepeatIcon()}
              </Button>
              <Button
                size="lg"
                onClick={handlePrevious}
                variant="ghost"
                className="rounded-full w-11 h-11 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                onClick={handlePlayPause}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 flex-shrink-0 transition-all duration-200 hover:scale-110 active:scale-95"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                variant="ghost"
                className="rounded-full w-11 h-11 hover:bg-purple-100 dark:hover:bg-purple-900/30"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                onClick={handleToggleMute}
                title={isMuted ? '静音' : '取消静音'}
                variant="ghost"
                className={`rounded-full w-10 h-10 ${isMuted ? 'text-gray-400' : ''}`}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center gap-3 mb-5 px-2 py-3 bg-white/50 dark:bg-gray-800/50 rounded-xl flex-shrink-0">
              <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              <div className="flex-1">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:h-2 [&_[role=slider]]:bg-purple-100 dark:[&_[role=slider]]:bg-purple-900"
                />
              </div>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-10 text-right flex-shrink-0">
                {isMuted ? 0 : volume}%
              </span>
            </div>

            {/* 播放列表 */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {Object.entries(groupedTracks).map(([category, tracks]) => (
                <div key={category}>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 px-2 flex items-center gap-2 sticky top-0 bg-purple-50/90 dark:bg-purple-900/90 backdrop-blur-sm py-2 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                    {category}
                  </div>
                  <div className="space-y-1.5">
                    {tracks.map(track => (
                      <TrackItem
                        key={track.id}
                        track={track}
                        isPlaying={isPlaying}
                        isCurrent={currentTrack?.id === track.id}
                        onSelect={handleSelectTrack}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
