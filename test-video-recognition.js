const fs = require('fs');
const path = require('path');

const videoPath = '/workspace/projects/assets/20260117-1313-05.7132895.mp4';

// 检查文件是否存在
if (!fs.existsSync(videoPath)) {
  console.error('视频文件不存在:', videoPath);
  process.exit(1);
}

const stats = fs.statSync(videoPath);
console.log('视频文件信息:');
console.log('  路径:', videoPath);
console.log('  大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
console.log('  修改时间:', stats.mtime);

// 读取文件
const videoBuffer = fs.readFileSync(videoPath);
console.log('\n已读取视频文件，准备识别...');

// 创建FormData的边界
const boundary = '----WebKitFormBoundary' + Date.now();
const formData = [];

// 添加视频文件
formData.push(
  `--${boundary}\r\n`,
  `Content-Disposition: form-data; name="video"; filename="test-video.mp4"\r\n`,
  `Content-Type: video/mp4\r\n\r\n`
);
formData.push(videoBuffer);
formData.push(`\r\n--${boundary}--\r\n`);

const body = Buffer.concat(formData.map(item => 
  Buffer.isBuffer(item) ? item : Buffer.from(item, 'utf8')
));

console.log('\n开始发送识别请求...\n');

// 发送到API
fetch('http://localhost:5000/api/video-recognize', {
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  },
  body: body,
})
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`HTTP ${response.status}: ${text}`);
      });
    }
    
    console.log('识别请求已发送，开始接收结果...\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let fullText = '';
    
    const processChunk = async ({ done, value }) => {
      if (done) {
        console.log('\n========== 识别完成 ==========');
        console.log('\n识别结果:');
        console.log('─'.repeat(60));
        console.log(fullText || '（没有识别到语音内容）');
        console.log('─'.repeat(60));
        console.log(`\n总字数: ${fullText.length} 字`);
        return;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              process.stdout.write(`\r进度: ${data.progress}% - ${data.message}`);
            } else if (data.type === 'result') {
              fullText = data.text;
              console.log('\n\n收到识别结果...');
            } else if (data.type === 'complete') {
              console.log('\n\n✓ 识别完成！');
            } else if (data.type === 'error') {
              console.error('\n\n✗ 错误:', data.error);
              throw new Error(data.error);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      return reader.read().then(processChunk);
    };
    
    return reader.read().then(processChunk);
  })
  .catch(error => {
    console.error('\n✗ 识别失败:', error.message);
    console.error('\n详细错误信息:', error);
    process.exit(1);
  });
