# 性能优化与卡顿解决方案

## 🚨 立即应急措施（卡顿时使用）

### 1. 清理旧快照
```
访问：http://localhost:5000/data-manager
点击："清理旧快照"按钮
```
- 保留最新的5个快照，删除旧快照
- 减少localStorage占用

### 2. 导出并清空数据
```
步骤1：访问 http://localhost:5000/data-manager
步骤2：点击"导出所有数据"下载备份
步骤3：清空浏览器localStorage
步骤4：刷新页面，重新导入备份
```

### 3. 重启浏览器
```
- 关闭所有浏览器标签
- 重新打开浏览器
- 访问应用
```

### 4. 检查浏览器控制台
```
- 按F12打开开发者工具
- 查看Console是否有错误
- 查看Network是否有请求失败
- 查看Performance是否有卡顿记录
```

---

## 🎯 长期优化方案

### 方案1：章节分页加载（推荐）
**适用场景**：章节数量超过50章

```typescript
// 只加载当前显示的章节
const [visibleChapters, setVisibleChapters] = useState<Chapter[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const chaptersPerPage = 20;

useEffect(() => {
  const start = (currentPage - 1) * chaptersPerPage;
  const end = start + chaptersPerPage;
  setVisibleChapters(chapters.slice(start, end));
}, [chapters, currentPage]);
```

### 方案2：内容懒加载（推荐）
**适用场景**：单个章节超过5000字

```typescript
// 只在需要时加载章节内容
const [loadedChapterIds, setLoadedChapterIds] = useState<Set<string>>(new Set());

const loadChapterContent = (chapterId: string) => {
  if (!loadedChapterIds.has(chapterId)) {
    setLoadedChapterIds(prev => new Set([...prev, chapterId]));
  }
};
```

### 方案3：虚拟滚动（高级）
**适用场景**：章节数量超过100章

```typescript
// 使用react-window或react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={chapters.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ChapterItem chapter={chapters[index]} />
    </div>
  )}
</FixedSizeList>
```

### 方案4：内容压缩存储
**适用场景**：localStorage接近容量上限

```typescript
// 使用LZString压缩存储
import LZString from 'lz-string';

const saveCompressed = (data: any) => {
  const compressed = LZString.compress(JSON.stringify(data));
  localStorage.setItem('novel-data-compressed', compressed);
};

const loadCompressed = () => {
  const compressed = localStorage.getItem('novel-data-compressed');
  if (compressed) {
    const decompressed = LZString.decompress(compressed);
    return JSON.parse(decompressed);
  }
  return null;
};
```

### 方案5：IndexedDB存储（终极方案）
**适用场景**：数据量超过localStorage限制（5MB）

```typescript
// 使用IndexedDB存储大量数据
const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('NovelDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('chapters')) {
        db.createObjectStore('chapters', { keyPath: 'id' });
      }
    };
  });
};
```

---

## 📊 性能监控

### 访问性能监控页面
```
http://localhost:5000/performance-monitor
```

功能：
- 实时显示localStorage使用量
- 显示内存占用情况
- 检测卡顿原因
- 提供优化建议

### 浏览器自带性能分析
```
1. 按F12打开开发者工具
2. 切换到Performance标签
3. 点击Record开始录制
4. 操作应用
5. 点击Stop停止录制
6. 分析性能瓶颈
```

---

## 🔧 预防措施

### 1. 定期清理
- 每周清理一次旧快照
- 删除不需要的草稿
- 导出备份后清空本地数据

### 2. 分卷管理
- 每100章创建一个新卷
- 每卷独立存储
- 只加载当前卷

### 3. 内容精简
- 避免在章节中保存过长的示例文本
- 使用摘要代替完整内容
- 定期归档已完成的章节

### 4. 浏览器优化
- 使用最新版本的Chrome/Edge
- 关闭不必要的浏览器扩展
- 增加浏览器内存限制

---

## ⚡ 快速诊断清单

卡顿时依次检查：

- [ ] localStorage占用是否超过4MB？
  - 检查：http://localhost:5000/data-manager
  - 解决：清理旧快照

- [ ] 章节数量是否超过100章？
  - 解决：分页加载或分卷管理

- [ ] 单个章节是否超过1万字？
  - 解决：内容懒加载

- [ ] 快照数量是否超过10个？
  - 解决：清理旧快照

- [ ] 浏览器内存是否占用过高？
  - 解决：重启浏览器

- [ ] 是否有错误日志？
  - 解决：查看控制台并修复错误

---

## 🆘 紧急求助

如果以上方法都无法解决：

1. **导出所有数据**
   ```
   访问：http://localhost:5000/data-manager
   点击："导出所有数据"
   ```

2. **记录问题**
   ```
   - 截图性能监控页面
   - 记录卡顿发生的具体操作
   - 保存浏览器控制台错误日志
   ```

3. **重新开始**
   ```
   - 清空浏览器所有数据
   - 重新加载应用
   - 从备份文件导入数据
   ```

---

## 📈 性能基准

### 正常情况
- localStorage占用：< 2MB
- 加载时间：< 2秒
- 切换章节：< 500ms
- 保存数据：< 200ms

### 需要优化
- localStorage占用：2-4MB
- 加载时间：2-5秒
- 切换章节：500ms-1s
- 保存数据：200-500ms

### 立即处理
- localStorage占用：> 4MB
- 加载时间：> 5秒
- 切换章节：> 1s
- 保存数据：> 500ms
