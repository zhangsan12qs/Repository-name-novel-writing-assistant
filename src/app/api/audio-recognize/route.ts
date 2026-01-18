import { NextRequest } from 'next/server';
import { ASRClient, Config } from 'coze-coding-dev-sdk';

export const maxDuration = 300; // 5分钟超时
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return Response.json({ error: '未上传音频文件' }, { status: 400 });
    }

    // 检查文件大小
    if (audioFile.size > 500 * 1024 * 1024) {
      return Response.json({ error: '音频大小不能超过500MB' }, { status: 400 });
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ type: 'progress', progress: 20, message: '正在读取音频数据...' });

          // 读取音频文件
          const audioBuffer = await audioFile.arrayBuffer();
          const audioBase64 = Buffer.from(audioBuffer).toString('base64');

          sendEvent({ type: 'progress', progress: 50, message: '正在进行语音识别...' });

          // 使用ASR服务进行语音识别
          const config = new Config();
          const asrClient = new ASRClient(config);

          const result = await asrClient.recognize({
            uid: 'audio-recognition',
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
          console.error('音频识别错误:', error);
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
