'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Video, Play, Pause, Loader2, Download, Trash2, Volume2, AlertTriangle } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function TestVideoRecognition() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('请上传视频文件');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('视频大小不能超过500MB');
      return;
    }

    setVideoFile(file);
    setError('');
    
    // 创建预览URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setRecognizedText('');
    setRecognitionProgress(0);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setError('');
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl('');
    }
    setRecognizedText('');
    setRecognitionProgress(0);
    setIsPlaying(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRecognize = async () => {
    if (!videoFile) return;

    setIsRecognizing(true);
    setError('');
    setRecognitionProgress(0);

    try {
      setRecognitionProgress(5);

      // 初始化FFmpeg
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

      setRecognitionProgress(10);
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setRecognitionProgress(20);

      // 将视频文件写入FFmpeg
      const videoData = await fetchFile(videoFile);
      await ffmpeg.writeFile('input.mp4', videoData);

      setRecognitionProgress(30);

      // 提取音频并转换为MP3
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vn', // 不处理视频流
        '-acodec', 'libmp3lame',
        '-ar', '16000', // 16kHz采样率
        '-ac', '1', // 单声道
        '-b:a', '64k', // 64kbps
        'output.mp3'
      ]);

      setRecognitionProgress(50);

      // 读取提取的音频
      const audioData = await ffmpeg.readFile('output.mp3');
      const audioBlob = new Blob([audioData as any], { type: 'audio/mp3' });

      setRecognitionProgress(60);

      // 发送到后端进行语音识别
      const formData = new FormData();
      formData.append('audio', audioBlob, 'extracted-audio.mp3');

      const response = await fetch('/api/audio-recognize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '识别失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                setRecognitionProgress(Math.max(60, Math.min(100, 60 + Math.floor(data.progress * 0.4))));
              } else if (data.type === 'result') {
                fullText = data.text;
                setRecognizedText(data.text);
              } else if (data.type === 'complete') {
                setIsRecognizing(false);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }
    } catch (err) {
      console.error('识别失败:', err);
      setError(err instanceof Error ? err.message : '识别失败');
      setIsRecognizing(false);
    }
  };

  const handleDownloadText = () => {
    if (!recognizedText) return;

    const blob = new Blob([recognizedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recognition_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            视频语音识别测试
          </h1>
          <p className="text-muted-foreground">
            测试视频文件：assets/20260117-1313-05.7132895.mp4
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* 上传区域 */}
        {!videoFile && (
          <Card className="p-12 border-2 border-dashed">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Video className="w-10 h-10 text-white" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">上传测试视频</h3>
                <p className="text-sm text-muted-foreground">
                  支持 MP4、AVI、MOV 等格式，最大500MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Upload className="w-5 h-5 mr-2" />
                选择视频文件
              </Button>
            </div>
          </Card>
        )}

        {/* 视频预览和识别区域 */}
        {videoFile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：视频播放器 */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  视频预览
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveVideo}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  移除
                </Button>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  controls
                />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>文件名:</span>
                  <span className="font-medium">{videoFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>文件大小:</span>
                  <span className="font-medium">
                    {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>

              <Button
                onClick={handleRecognize}
                disabled={isRecognizing}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                size="lg"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    识别中... {recognitionProgress}%
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5 mr-2" />
                    开始识别
                  </>
                )}
              </Button>

              {isRecognizing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>处理进度</span>
                    <span>{recognitionProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${recognitionProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>

            {/* 右侧：识别结果 */}
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  识别结果
                </h3>
                {recognizedText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadText}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下载文本
                  </Button>
                )}
              </div>

              <div className="flex-1 min-h-[400px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-y-auto">
                {isRecognizing ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-4">
                      <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-500" />
                      <p>正在识别语音...</p>
                    </div>
                  </div>
                ) : recognizedText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {recognizedText}
                  </p>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Volume2 className="w-12 h-12 mx-auto opacity-50" />
                      <p>点击"开始识别"按钮开始转换</p>
                    </div>
                  </div>
                )}
              </div>

              {recognizedText && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>字数统计:</span>
                    <span className="font-medium">{recognizedText.length} 字</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
