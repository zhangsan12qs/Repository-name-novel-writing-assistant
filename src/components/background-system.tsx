'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ImageIcon,
  Upload,
  Sparkles,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Palette,
  Type,
  Layers,
} from 'lucide-react';

export interface BackgroundSettings {
  enabled: boolean;
  type: 'preset' | 'custom' | 'color';
  presetId: string;
  customUrl: string;
  customImage: string | null;
  color: string;
  opacity: number;
  blur: number;
}

export interface PresetWallpaper {
  id: string;
  name: string;
  category: string;
  url: string;
  thumbnail: string;
  description: string;
  textColor?: string;
}

// 预设壁纸库
const PRESET_WALLPAPERS: PresetWallpaper[] = [
  // 自然风景
  {
    id: 'nature-1',
    name: '晨曦森林',
    category: '自然风景',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
    description: '清晨阳光穿透森林',
    textColor: '#1a1a1a',
  },
  {
    id: 'nature-2',
    name: '雪山山脉',
    category: '自然风景',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
    description: '壮丽雪山风光',
    textColor: '#1a1a1a',
  },
  {
    id: 'nature-3',
    name: '宁静湖畔',
    category: '自然风景',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&q=80',
    description: '宁静的湖面倒影',
    textColor: '#1a1a1a',
  },
  // 星空宇宙
  {
    id: 'space-1',
    name: '璀璨星空',
    category: '星空宇宙',
    url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&q=80',
    description: '梦幻星空',
    textColor: '#ffffff',
  },
  {
    id: 'space-2',
    name: '银河系',
    category: '星空宇宙',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80',
    description: '浩瀚银河',
    textColor: '#ffffff',
  },
  {
    id: 'space-3',
    name: '日落余晖',
    category: '星空宇宙',
    url: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&q=80',
    description: '日落时分的云彩',
    textColor: '#1a1a1a',
  },
  // 抽象艺术
  {
    id: 'abstract-1',
    name: '流动的色彩',
    category: '抽象艺术',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80',
    description: '渐变色彩流动',
    textColor: '#1a1a1a',
  },
  {
    id: 'abstract-2',
    name: '几何纹理',
    category: '抽象艺术',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&q=80',
    description: '现代几何设计',
    textColor: '#ffffff',
  },
  {
    id: 'abstract-3',
    name: '光与影',
    category: '抽象艺术',
    url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=400&q=80',
    description: '光影交错',
    textColor: '#ffffff',
  },
  // 简约风格
  {
    id: 'minimal-1',
    name: '纯净白',
    category: '简约风格',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80',
    description: '简约白墙',
    textColor: '#1a1a1a',
  },
  {
    id: 'minimal-2',
    name: '柔和灰',
    category: '简约风格',
    url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&q=80',
    description: '灰色墙面',
    textColor: '#1a1a1a',
  },
  {
    id: 'minimal-3',
    name: '温暖米色',
    category: '简约风格',
    url: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721?w=400&q=80',
    description: '温暖米色背景',
    textColor: '#1a1a1a',
  },
  // 古典文学
  {
    id: 'classic-1',
    name: '纸质纹理',
    category: '古典文学',
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
    description: '经典纸质纹理',
    textColor: '#1a1a1a',
  },
  {
    id: 'classic-2',
    name: '复古书籍',
    category: '古典文学',
    url: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&q=80',
    description: '复古书页',
    textColor: '#1a1a1a',
  },
  {
    id: 'classic-3',
    name: '羊皮纸',
    category: '古典文学',
    url: 'https://images.unsplash.com/photo-1506543751628-798543251559?w=1920&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1506543751628-798543251559?w=400&q=80',
    description: '羊皮纸质感',
    textColor: '#1a1a1a',
  },
];

// 预设颜色
const PRESET_COLORS = [
  { name: '纯白', value: '#ffffff', textColor: '#1a1a1a' },
  { name: '浅灰', value: '#f5f5f5', textColor: '#1a1a1a' },
  { name: '米色', value: '#faf5e6', textColor: '#1a1a1a' },
  { name: '浅蓝', value: '#e6f3ff', textColor: '#1a1a1a' },
  { name: '浅绿', value: '#e8f5e9', textColor: '#1a1a1a' },
  { name: '浅紫', value: '#f3e5f5', textColor: '#1a1a1a' },
  { name: '深灰', value: '#2d2d2d', textColor: '#ffffff' },
  { name: '深蓝', value: '#1a237e', textColor: '#ffffff' },
  { name: '深紫', value: '#4a148c', textColor: '#ffffff' },
];

// 使用 memo 优化壁纸卡片组件
const WallpaperCard = memo<{
  wallpaper: PresetWallpaper;
  isSelected: boolean;
  onSelect: (wallpaper: PresetWallpaper) => void;
}>(({ wallpaper, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(wallpaper)}
      className={`relative group rounded-lg overflow-hidden transition-all ${
        isSelected
          ? 'ring-2 ring-primary ring-offset-2 shadow-lg'
          : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1'
      }`}
    >
      <img
        src={wallpaper.thumbnail}
        alt={wallpaper.name}
        className="w-full h-24 object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="text-xs text-white font-medium truncate">
          {wallpaper.name}
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
});

WallpaperCard.displayName = 'WallpaperCard';

interface BackgroundSystemProps {
  settings: BackgroundSettings;
  onSettingsChange: (settings: BackgroundSettings) => void;
}

export default function BackgroundSystem({ settings, onSettingsChange }: BackgroundSystemProps) {
  const [open, setOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // 从 localStorage 加载设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('background_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          onSettingsChange(parsed);
        }
      } catch (error) {
        console.error('加载背景设置失败:', error);
      }
    }
  }, [onSettingsChange]);

  // 保存设置到 localStorage
  const saveSettings = useCallback((newSettings: BackgroundSettings) => {
    onSettingsChange(newSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('background_settings', JSON.stringify(newSettings));
      } catch (error) {
        console.error('保存背景设置失败:', error);
      }
    }
  }, [onSettingsChange]);

  const handleToggle = () => {
    saveSettings({ ...settings, enabled: !settings.enabled });
  };

  const handleSelectPreset = (wallpaper: PresetWallpaper) => {
    saveSettings({
      ...settings,
      type: 'preset',
      presetId: wallpaper.id,
    });
  };

  const handleUploadCustom = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      saveSettings({
        ...settings,
        type: 'custom',
        customImage: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectColor = (color: string, textColor: string) => {
    saveSettings({
      ...settings,
      type: 'color',
      color: color,
    });
  };

  const handleOpacityChange = (value: number[]) => {
    saveSettings({ ...settings, opacity: value[0] });
  };

  const handleBlurChange = (value: number[]) => {
    saveSettings({ ...settings, blur: value[0] });
  };

  const handleRemoveCustom = () => {
    saveSettings({
      ...settings,
      type: 'color',
      customImage: null,
      customUrl: '',
      color: '#ffffff',
    });
  };

  const handleReset = () => {
    const defaultSettings: BackgroundSettings = {
      enabled: false,
      type: 'color',
      presetId: '',
      customUrl: '',
      customImage: null,
      color: '#ffffff',
      opacity: 100,
      blur: 0,
    };
    saveSettings(defaultSettings);
  };

  // 按类别分组预设壁纸
  const groupedWallpapers = PRESET_WALLPAPERS.reduce((acc, wallpaper) => {
    if (!acc[wallpaper.category]) {
      acc[wallpaper.category] = [];
    }
    acc[wallpaper.category].push(wallpaper);
    return acc;
  }, {} as Record<string, PresetWallpaper[]>);

  // 获取当前壁纸信息
  const getCurrentWallpaper = (): PresetWallpaper | null => {
    if (settings.type === 'preset') {
      return PRESET_WALLPAPERS.find(w => w.id === settings.presetId) || null;
    }
    return null;
  };

  const currentWallpaper = getCurrentWallpaper();
  const hasBackground = settings.enabled && (settings.type !== 'color' || settings.color !== '#ffffff');

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => setOpen(true)}
          >
            {hasBackground ? (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                背景设置
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              </>
            ) : (
              <>
                <Palette className="w-4 h-4 mr-2" />
                设置背景
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              背景设置
            </DialogTitle>
            <DialogDescription>
              为写作界面添加个性化背景，让创作更加舒适
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="preset" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preset" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                预设壁纸
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                自定义
              </TabsTrigger>
              <TabsTrigger value="color" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                纯色背景
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                效果调节
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preset" className="space-y-4 mt-4">
              {Object.entries(groupedWallpapers).map(([category, wallpapers]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    {category}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {wallpapers.map(wallpaper => (
                      <WallpaperCard
                        key={wallpaper.id}
                        wallpaper={wallpaper}
                        isSelected={settings.type === 'preset' && settings.presetId === wallpaper.id}
                        onSelect={handleSelectPreset}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  点击上传或拖拽图片到此处
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadCustom}
                  className="hidden"
                  id="custom-wallpaper-upload"
                />
                <label htmlFor="custom-wallpaper-upload">
                  <Button asChild>
                    <span>选择图片</span>
                  </Button>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  支持 JPG、PNG 格式，最大 5MB
                </p>
              </div>

              {settings.customImage && (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={settings.customImage}
                      alt="自定义壁纸"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveCustom}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">当前自定义壁纸</span>
                    <span className="text-green-600 dark:text-green-400">已应用</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="color" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => handleSelectColor(color.value, color.textColor)}
                    className={`relative rounded-lg overflow-hidden transition-all ${
                      settings.type === 'color' && settings.color === color.value
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:ring-2 hover:ring-primary/50 hover:ring-offset-1'
                    }`}
                  >
                    <div
                      className="w-full h-24"
                      style={{ backgroundColor: color.value }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent">
                      <div className="text-xs text-white font-medium truncate">
                        {color.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-4">
              {/* 开关 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    <label className="text-sm font-medium">启用背景</label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    开启后将在写作界面显示背景
                  </p>
                </div>
                <Button
                  variant={settings.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggle}
                >
                  {settings.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {settings.enabled ? '已启用' : '已禁用'}
                </Button>
              </div>

              {/* 透明度 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <label className="text-sm font-medium">背景透明度</label>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.opacity}%
                  </span>
                </div>
                <Slider
                  value={[settings.opacity]}
                  onValueChange={handleOpacityChange}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  透明度越高，背景越明显；透明度越低，背景越淡
                </p>
              </div>

              {/* 模糊效果 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <label className="text-sm font-medium">模糊效果</label>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.blur}px
                  </span>
                </div>
                <Slider
                  value={[settings.blur]}
                  onValueChange={handleBlurChange}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  模糊效果可以减少背景对文字的干扰
                </p>
              </div>

              {/* 当前预览 */}
              {hasBackground && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">当前背景预览</h4>
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div
                      className="relative w-full h-32 bg-cover bg-center"
                      style={{
                        backgroundImage: settings.type === 'preset' && currentWallpaper
                          ? `url(${currentWallpaper.url})`
                          : settings.type === 'custom' && settings.customImage
                          ? `url(${settings.customImage})`
                          : 'none',
                        backgroundColor: settings.type === 'color' ? settings.color : 'transparent',
                        opacity: settings.opacity / 100,
                        filter: `blur(${settings.blur}px)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="px-3 py-1 bg-white/80 dark:bg-black/80 rounded text-sm font-medium">
                          预览效果
                        </span>
                      </div>
                    </div>
                  </div>
                  {settings.type === 'preset' && currentWallpaper && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {currentWallpaper.name} · {currentWallpaper.category}
                      </span>
                      <span className="text-green-600 dark:text-green-400">已应用</span>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setOpen(false)}>
                确定
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
