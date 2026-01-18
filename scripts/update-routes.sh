#!/bin/bash

# 批量更新 AI 路由以支持双模式
# 此脚本会更新所有使用 Coze SDK 的路由，使其支持开发者模式和用户模式

echo "开始批量更新 AI 路由..."

# 需要更新的路由列表
ROUTES=(
  "src/app/api/ai/character/route.ts"
  "src/app/api/ai/outline/route.ts"
  "src/app/api/ai/dialogue/route.ts"
  "src/app/api/ai/direct-edit/route.ts"
  "src/app/api/ai/auto-write/route.ts"
  "src/app/api/ai/check-plot/route.ts"
  "src/app/api/ai/fix-issue/route.ts"
  "src/app/api/ai/batch-fix-issues/route.ts"
  "src/app/api/ai/fix-and-verify/route.ts"
  "src/app/api/ai/adjust-outline/route.ts"
  "src/app/api/ai/regenerate-from-outline/route.ts"
  "src/app/api/ai/regenerate-outline-from-world/route.ts"
  "src/app/api/ai/analyze-book/route.ts"
  "src/app/api/ai/rewrite-analysis/route.ts"
  "src/app/api/ai/generate-all/route.ts"
)

echo "找到 ${#ROUTES[@]} 个路由需要更新"
echo ""

# 注意：实际更新需要手动进行，这里只是列出需要更新的路由
for route in "${ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "✓ $route"
  else
    echo "✗ $route (文件不存在)"
  fi
done

echo ""
echo "注意：此脚本只是列出需要更新的路由，实际更新需要手动修改代码"
echo "或者使用自动化的 sed/awk 命令进行批量替换"
