#!/bin/bash

# 查询 Groq 支持的最新模型
# 需要提供 Groq API Key

GROQ_API_KEY="${GROQ_API_KEY:-your_groq_api_key_here}"

if [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
    echo "请先设置 GROQ_API_KEY 环境变量"
    echo "export GROQ_API_KEY=gsk_xxxxxxxxxxxxxx"
    exit 1
fi

echo "查询 Groq 支持的模型列表..."
echo ""

curl -s "https://api.groq.com/openai/v1/models" \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  | jq -r '.data[] | "\(.id) - \(.owned_by)"' \
  | sort

echo ""
echo "查询完成！"
