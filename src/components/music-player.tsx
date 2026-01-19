'use client';

import React, { useState, useRef, useEffect } from 'react';
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

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (repeatMode === 'all') {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode]);

  const handlePlayPause = () => {
    if (!currentTrack) {
      const firstTrack = PRESET_TRACKS[0];
      setCurrentTrack(firstTrack);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const currentIndex = PRESET_TRACKS.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % PRESET_TRACKS.length;
    setCurrentTrack(PRESET_TRACKS[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentTrack) return;
    const currentIndex = PRESET_TRACKS.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? PRESET_TRACKS.length - 1 : currentIndex - 1;
    setCurrentTrack(PRESET_TRACKS[prevIndex]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleRepeat = () => {
    const modes: RepeatMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
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
  };

  const groupedTracks = PRESET_TRACKS.reduce((acc, track) => {
    if (!acc[track.category]) {
      acc[track.category] = [];
    }
    acc[track.category].push(track);
    return acc;
  }, {} as Record<string, MusicTrack[]>);

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack?.url}
        autoPlay={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* 最小化状态 */}
      {!isExpanded && (
        <Card className="fixed bottom-4 right-4 p-3 shadow-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-200/20 cursor-pointer hover:from-purple-500/20 hover:to-pink-500/20 transition-all z-40">
          <div className="flex items-center gap-3" onClick={() => setIsExpanded(true)}>
            <Music className="w-5 h-5 text-purple-600" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800">
                {currentTrack?.name || '背景音乐'}
              </span>
              <span className="text-xs text-gray-600">
                {currentTrack?.artist || '点击播放'}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="ml-auto"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* 展开状态 */}
      {isExpanded && (
        <Card className="fixed bottom-4 right-4 w-80 shadow-2xl bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-md border-purple-200/30 z-40">
          <div className="p-4">
            {/* 标题栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">背景音乐</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>

            {/* 当前播放 */}
            {currentTrack && (
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <div className="text-sm font-medium text-gray-800 mb-1">
                  {currentTrack.name}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {currentTrack.artist} · {currentTrack.category}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 w-10">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    max={duration}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleRepeat}
                title={repeatMode === 'one' ? '单曲循环' : repeatMode === 'all' ? '列表循环' : '不循环'}
              >
                {getRepeatIcon()}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrevious}
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleNext}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleMute}
                title={isMuted ? '静音' : '取消静音'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* 音量控制 */}
            <div className="flex items-center gap-2 mb-4 px-4">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-8 text-right">
                {isMuted ? 0 : volume}%
              </span>
            </div>

            {/* 播放列表 */}
            <div className="space-y-2">
              {Object.entries(groupedTracks).map(([category, tracks]) => (
                <div key={category}>
                  <div className="text-xs font-semibold text-gray-500 mb-1 px-1">
                    {category}
                  </div>
                  {tracks.map(track => (
                    <button
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                        currentTrack?.id === track.id
                          ? 'bg-purple-100 text-purple-900'
                          : 'hover:bg-white/50 text-gray-700'
                      }`}
                    >
                      {isPlaying && currentTrack?.id === track.id ? (
                        <div className="flex gap-0.5 items-end h-4">
                          <div className="w-1 h-3 bg-purple-500 animate-pulse"></div>
                          <div className="w-1 h-4 bg-purple-500 animate-pulse delay-100"></div>
                          <div className="w-1 h-2 bg-purple-500 animate-pulse delay-200"></div>
                        </div>
                      ) : (
                        <Music className="w-4 h-4" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {track.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {track.artist}
                        </div>
                      </div>
                      {currentTrack?.id === track.id && isPlaying && (
                        <span className="text-xs text-purple-600">播放中</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
