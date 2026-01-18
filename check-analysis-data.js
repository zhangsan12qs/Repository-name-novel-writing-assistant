// 在浏览器控制台运行此脚本检查拆书分析数据
console.log('=== 检查拆书分析数据 ===');

const keys = ['novel-editor-data', 'analysisResult', 'partialResults', 'importData'];

keys.forEach(key => {
  const data = localStorage.getItem(key);
  console.log(`\n${key}:`);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (key === 'novel-editor-data') {
        console.log('  - analysisResult:', parsed.analysisResult ? '存在' : '不存在');
        console.log('  - partialResults:', parsed.partialResults ? parsed.partialResults.length + ' 项' : '不存在');
        console.log('  - importData:', parsed.importData ? '存在' : '不存在');
      } else {
        console.log('  数据长度:', data.length, '字符');
        console.log('  预览:', data.substring(0, 200));
      }
    } catch (e) {
      console.log('  解析失败:', e.message);
    }
  } else {
    console.log('  不存在');
  }
});

console.log('\n=== 检查完成 ===');
