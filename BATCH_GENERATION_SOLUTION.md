# 分批生成功能实现方案

## 目标

解决无法生成1000章的问题，通过分批生成实现，避免超时和崩溃。

## 方案概述

将1000章分成多个小批次（每批20-50章），使用任务队列管理，支持暂停/继续和断点续传。

## 核心功能

### 1. 分批生成配置

```typescript
interface BatchGenerateConfig {
  targetChapterCount: number;      // 目标章节数（如1000）
  batchSize: number;               // 每批章节数（如20）
  currentBatch: number;            // 当前批次
  generatedCount: number;          // 已生成章节数
  status: 'idle' | 'generating' | 'paused' | 'completed' | 'error';
}
```

### 2. 自动循环生成

```typescript
async function autoGenerateInBatches() {
  const config: BatchGenerateConfig = {
    targetChapterCount: 1000,
    batchSize: 20,
    currentBatch: 0,
    generatedCount: chapters.length,
    status: 'generating'
  };

  while (config.generatedCount < config.targetChapterCount && config.status === 'generating') {
    // 计算本批次需要生成的章节数
    const remainingChapters = config.targetChapterCount - config.generatedCount;
    const batchChapterCount = Math.min(remainingChapters, config.batchSize);

    // 生成一批
    await generateBatch(batchChapterCount);

    // 更新进度
    config.generatedCount += batchChapterCount;
    config.currentBatch++;

    // 保存状态到IndexedDB（支持断点续传）
    await saveBatchConfig(config);

    // 短暂休息，避免API限制
    await sleep(2000);
  }
}
```

### 3. 任务队列集成

```typescript
// 为每批生成创建一个任务
async function createBatchTask(batchNumber: number, chapterCount: number) {
  const task = {
    taskId: `batch-${batchNumber}-${Date.now()}`,
    type: 'batch-generate-chapters',
    name: `批量生成章节（批次 ${batchNumber}）`,
    priority: 1,
    params: {
      chapterCount,
      targetWordCount: chapterSettings.targetWordCountPerChapter,
      outline,
      characters,
      worldSettings,
      existingChapters: chapters,
      existingVolumes: volumes,
      title,
      apiKey: localStorage.getItem('siliconflow_api_key')
    },
    status: 'pending',
    progress: {
      current: 0,
      total: chapterCount,
      percentage: 0
    },
    createdAt: Date.now()
  };

  // 添加到任务队列
  await taskManager.createTask(task);

  return task;
}
```

### 4. 进度反馈

```typescript
// 显示总体进度
<div className="progress-panel">
  <div className="overall-progress">
    <h3>总体进度</h3>
    <ProgressBar value={config.generatedCount / config.targetChapterCount * 100} />
    <p>{config.generatedCount} / {config.targetChapterCount} 章</p>
  </div>

  <div className="current-batch">
    <h3>当前批次</h3>
    <ProgressBar value={currentBatchProgress.percentage} />
    <p>批次 {config.currentBatch + 1} / {Math.ceil(config.targetChapterCount / config.batchSize)}</p>
  </div>

  <div className="estimated-time">
    <p>预计剩余时间：{calculateRemainingTime()}</p>
  </div>
</div>

// 控制按钮
<div className="controls">
  <Button onClick={pauseGeneration}>暂停</Button>
  <Button onClick={resumeGeneration}>继续</Button>
  <Button onClick={cancelGeneration}>取消</Button>
</div>
```

### 5. 断点续传

```typescript
// 保存批次配置到IndexedDB
async function saveBatchConfig(config: BatchGenerateConfig) {
  await indexedDBStore.put('batch-config', config);
}

// 恢复批次配置
async function loadBatchConfig(): Promise<BatchGenerateConfig | null> {
  const config = await indexedDBStore.get('batch-config');
  return config;
}

// 检查是否有未完成的任务
async function checkIncompleteTask() {
  const config = await loadBatchConfig();

  if (config && config.status === 'generating') {
    const shouldResume = confirm(
      `检测到未完成的生成任务：\n` +
      `已生成 ${config.generatedCount} / ${config.targetChapterCount} 章\n` +
      `是否继续生成？`
    );

    if (shouldResume) {
      resumeGeneration(config);
    }
  }
}
```

## 代码实现

### 1. 修改批量生成API限制

```typescript
// src/app/api/ai/batch-generate-chapters/route.ts

// 修改章节数限制
if (chapterCount < 1 || chapterCount > 50) {  // 从100改为50
  console.error('[BatchGenerate] 章节数超出范围:', chapterCount);
  return NextResponse.json(
    { error: '章节数必须在1-50之间' },
    { status: 400 }
  );
}
```

### 2. 添加批次管理状态

```typescript
// src/app/page.tsx

// 添加批次管理状态
const [batchConfig, setBatchConfig] = useState<BatchGenerateConfig>({
  targetChapterCount: 1000,
  batchSize: 20,
  currentBatch: 0,
  generatedCount: 0,
  status: 'idle'
});

// 添加暂停/继续控制
const [isPaused, setIsPaused] = useState(false);
```

### 3. 实现自动循环生成

```typescript
// src/app/page.tsx

// 自动循环生成函数
const handleAutoGenerateInBatches = async () => {
  if (!outline) {
    alert('请先生成大纲！');
    return;
  }

  // 初始化配置
  const initialConfig: BatchGenerateConfig = {
    targetChapterCount: chapterSettings.targetChapterCount,
    batchSize: 20,
    currentBatch: 0,
    generatedCount: chapters.filter(c => c.content && c.content.length > 0).length,
    status: 'generating'
  };

  setBatchConfig(initialConfig);

  try {
    while (
      initialConfig.generatedCount < initialConfig.targetChapterCount &&
      initialConfig.status === 'generating'
    ) {
      // 如果暂停，等待
      while (isPaused) {
        await sleep(1000);
        if (initialConfig.status !== 'generating') break;
      }

      // 计算本批次章节数
      const remainingChapters = initialConfig.targetChapterCount - initialConfig.generatedCount;
      const batchChapterCount = Math.min(remainingChapters, initialConfig.batchSize);

      console.log(`[分批生成] 批次 ${initialConfig.currentBatch + 1}: 生成 ${batchChapterCount} 章`);

      // 生成一批（调用现有的批量生成API）
      await generateSingleBatch(batchChapterCount);

      // 更新配置
      initialConfig.generatedCount += batchChapterCount;
      initialConfig.currentBatch++;

      // 保存状态
      setBatchConfig({ ...initialConfig });
      await saveBatchConfig(initialConfig);

      // 显示进度
      const progress = (initialConfig.generatedCount / initialConfig.targetChapterCount * 100).toFixed(1);
      console.log(`[分批生成] 总进度: ${progress}% (${initialConfig.generatedCount}/${initialConfig.targetChapterCount})`);

      // 短暂休息
      await sleep(2000);
    }

    if (initialConfig.generatedCount >= initialConfig.targetChapterCount) {
      initialConfig.status = 'completed';
      alert(`✅ 生成完成！共生成 ${initialConfig.generatedCount} 章`);
    }
  } catch (error) {
    console.error('[分批生成] 错误:', error);
    initialConfig.status = 'error';
    alert('生成失败：' + (error instanceof Error ? error.message : '未知错误'));
  } finally {
    setBatchConfig({ ...initialConfig });
  }
};

// 生成单批章节
const generateSingleBatch = async (chapterCount: number) => {
  // 复用现有的批量生成逻辑
  // 但限制章节数为chapterCount
  // ...
};

// 暂停生成
const pauseGeneration = () => {
  setIsPaused(true);
};

// 继续生成
const resumeGeneration = () => {
  setIsPaused(false);
};

// 取消生成
const cancelGeneration = () => {
  if (confirm('确定要取消生成吗？已生成的章节将保留。')) {
    setBatchConfig(prev => ({ ...prev, status: 'idle' }));
    setIsPaused(false);
  }
};

// 辅助函数：睡眠
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

### 4. 添加进度面板UI

```tsx
// src/app/page.tsx

{/* 分批生成进度面板 */}
{batchConfig.status === 'generating' && (
  <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
    <h3 className="font-bold mb-3 flex items-center gap-2">
      <Activity className="h-5 w-5" />
      分批生成进度
    </h3>

    {/* 总体进度 */}
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>总体进度</span>
        <span>
          {batchConfig.generatedCount} / {batchConfig.targetChapterCount} 章
          ({((batchConfig.generatedCount / batchConfig.targetChapterCount) * 100).toFixed(1)}%)
        </span>
      </div>
      <ProgressBar value={(batchConfig.generatedCount / batchConfig.targetChapterCount) * 100} />
    </div>

    {/* 当前批次 */}
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>当前批次</span>
        <span>
          批次 {batchConfig.currentBatch + 1} / {Math.ceil(batchConfig.targetChapterCount / batchConfig.batchSize)}
        </span>
      </div>
      <ProgressBar value={batchGenerateProgress.percentage} />
      <p className="text-xs text-muted-foreground mt-1">{batchGenerateProgress.message}</p>
    </div>

    {/* 预计剩余时间 */}
    <div className="mb-4 text-sm">
      <span className="text-muted-foreground">预计剩余时间：</span>
      <span className="font-medium">{calculateEstimatedTime()}</span>
    </div>

    {/* 控制按钮 */}
    <div className="flex gap-2">
      {isPaused ? (
        <Button onClick={resumeGeneration} size="sm">
          <Play className="h-4 w-4 mr-1" />
          继续
        </Button>
      ) : (
        <Button onClick={pauseGeneration} size="sm" variant="outline">
          <Pause className="h-4 w-4 mr-1" />
          暂停
        </Button>
      )}
      <Button onClick={cancelGeneration} size="sm" variant="destructive">
        <XCircle className="h-4 w-4 mr-1" />
        取消
      </Button>
    </div>
  </Card>
)}

// 计算预计剩余时间
const calculateEstimatedTime = () => {
  const remainingChapters = batchConfig.targetChapterCount - batchConfig.generatedCount;
  const estimatedMinutes = Math.ceil(remainingChapters * 0.75); // 假设每章45秒
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;

  if (hours > 0) {
    return `约 ${hours} 小时 ${minutes} 分钟`;
  } else {
    return `约 ${minutes} 分钟`;
  }
};
```

### 5. 修改批量生成按钮

```tsx
// src/app/page.tsx

{/* 批量生成章节按钮 */}
<Button
  onClick={() => {
    if (chapterSettings.targetChapterCount > 50) {
      // 如果目标章节数超过50，使用分批生成
      handleAutoGenerateInBatches();
    } else {
      // 否则使用单次生成
      handleBatchGenerateChapters();
    }
  }}
  disabled={batchChapterGenerating}
>
  {batchChapterGenerating ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      生成中...
    </>
  ) : (
    <>
      <Sparkles className="h-4 w-4 mr-2" />
      {chapterSettings.targetChapterCount > 50
        ? `批量生成 ${chapterSettings.targetChapterCount} 章（分批）`
        : `批量生成 ${batchGenerateChapterCount} 章`
      }
    </>
  )}
</Button>
```

## 优化建议

### 1. 智能批次大小

```typescript
// 根据目标章节数动态调整批次大小
const calculateBatchSize = (targetChapterCount: number): number => {
  if (targetChapterCount <= 50) return targetChapterCount;  // 小规模：一次完成
  if (targetChapterCount <= 200) return 30;                  // 中规模：30章/批
  if (targetChapterCount <= 500) return 25;                  // 大规模：25章/批
  return 20;                                                 // 超大规模：20章/批
};
```

### 2. 自动调整休息时间

```typescript
// 根据批次大小动态调整休息时间
const calculateRestTime = (batchSize: number): number => {
  // 批次越大，休息时间越长
  return batchSize * 100;  // 20章 = 2秒，30章 = 3秒，50章 = 5秒
};
```

### 3. 错误重试机制

```typescript
// 某批失败后自动重试
async function generateBatchWithRetry(batchNumber: number, maxRetries: number = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await generateSingleBatch(batchSize);
      return true;  // 成功
    } catch (error) {
      console.error(`批次 ${batchNumber} 第${attempt}次失败:`, error);
      if (attempt < maxRetries) {
        await sleep(5000);  // 等待5秒后重试
      }
    }
  }
  return false;  // 失败
}
```

## 测试计划

### 1. 功能测试

- [ ] 分批生成100章
- [ ] 分批生成300章
- [ ] 分批生成500章
- [ ] 分批生成1000章

### 2. 稳定性测试

- [ ] 暂停/继续功能
- [ ] 取消功能
- [ ] 断点续传
- [ ] 页面刷新后恢复

### 3. 性能测试

- [ ] 内存占用
- [ ] CPU占用
- [ ] 网络流量
- [ ] 响应速度

### 4. 错误处理测试

- [ ] 网络断开
- [ ] API超时
- [ ] 内存不足
- [ ] IndexedDB失败

## 总结

通过分批生成方案，可以安全地生成1000章内容，避免超时和崩溃：

✅ **优点**：
- 避免API超时
- 减少内存压力
- 支持暂停/继续
- 支持断点续传
- 提供详细进度

⚠️ **注意**：
- 生成时间较长（8-12小时）
- 需要保持网络连接
- 需要足够的存储空间

📝 **建议**：
- 每批20-30章
- 自动保存进度
- 定期备份
- 提供预估时间
