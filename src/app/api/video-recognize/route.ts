import { NextRequest } from 'next/server';
import { ASRClient, Config } from 'coze-coding-dev-sdk';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return Response.json({ error: '未上传视频文件' }, { status: 400 });
    }

    // 检查文件大小
    if (videoFile.size > 500 * 1024 * 1024) {
      return Response.json({ error: '视频大小不能超过500MB' }, { status: 400 });
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: 'progress', progress: 10, message: '正在加载视频处理工具...' });

          // 初始化FFmpeg
          const ffmpeg = new FFmpeg();
          
          const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
          
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });

          sendEvent({ type: 'progress', progress: 20, message: '正在提取音频...' });

          // 将视频文件转换为buffer
          const videoBuffer = await videoFile.arrayBuffer();
          await ffmpeg.writeFile('input.mp4', new Uint8Array(videoBuffer));

          // 提取音频并转换为MP3格式
          await ffmpeg.exec([
            '-i', 'input.mp4',
            '-vn', // 不处理视频流
            '-acodec', 'libmp3lame',
            '-ar', '16000', // 16kHz采样率，适合语音识别
            '-ac', '1', // 单声道
            '-b:a', '64k', // 64kbps比特率
            'output.mp3'
          ]);

          sendEvent({ type: 'progress', progress: 50, message: '正在读取音频数据...' });

          // 读取提取的音频文件
          const audioData = await ffmpeg.readFile('output.mp3');
          const audioBuffer = Buffer.from(audioData);

          // 转换为base64
          const audioBase64 = audioBuffer.toString('base64');

          sendEvent({ type: 'progress', progress: 70, message: '正在进行语音识别...' });

          // 使用ASR服务进行语音识别
          const config = new Config();
          const asrClient = new ASRClient(config);

          const result = await asrClient.recognize({
            uid: 'video-recognition',
            base64Data: audioBase64
          });

          sendEvent({ type: 'progress', progress: 90, message: '正在处理识别结果...' });

          // 发送识别结果
          sendEvent({ 
            type: 'result', 
            text: result.text || '',
            duration: result.duration 
          });

          sendEvent({ type: 'progress', progress: 100, message: '识别完成' });
          sendEvent({ type: 'complete' });

        } catch (error) {
          console.error('视频识别错误:', error);
          sendEvent({ 
            type: 'error', 
            error: error instanceof Error ? error.message : '识别失败，请稍后重试' 
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API错误:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}
