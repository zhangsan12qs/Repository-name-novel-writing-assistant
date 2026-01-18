#!/bin/bash

echo "===================================="
echo "  网络小说写作助手 - 打包脚本"
echo "===================================="
echo ""

# 获取版本号
VERSION=${1:-latest}
PACKAGE_NAME="novel-writing-assistant-${VERSION}"
OUTPUT_DIR="./dist"

# 清理旧的打包文件
echo "清理旧的打包文件..."
rm -rf ${OUTPUT_DIR}
mkdir -p ${OUTPUT_DIR}

# 复制项目文件
echo "复制项目文件..."
mkdir -p ${OUTPUT_DIR}/${PACKAGE_NAME}

# 复制所有文件（排除不必要的）
rsync -av \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='dist' \
  --exclude='.coze-logs' \
  --exclude='.turbo' \
  --exclude='.vercel' \
  ./ ${OUTPUT_DIR}/${PACKAGE_NAME}/

# 创建压缩包
echo "创建压缩包..."
cd ${OUTPUT_DIR}

# tar.gz (Linux/Mac)
tar -czf ${PACKAGE_NAME}.tar.gz ${PACKAGE_NAME}

# zip (Windows/通用)
zip -rq ${PACKAGE_NAME}.zip ${PACKAGE_NAME}

# 生成校验文件
echo "生成校验文件..."
sha256sum ${PACKAGE_NAME}.tar.gz > ${PACKAGE_NAME}.tar.gz.sha256
sha256sum ${PACKAGE_NAME}.zip > ${PACKAGE_NAME}.zip.sha256

# 获取文件大小
TAR_SIZE=$(du -h ${PACKAGE_NAME}.tar.gz | cut -f1)
ZIP_SIZE=$(du -h ${PACKAGE_NAME}.zip | cut -f1)

echo ""
echo "===================================="
echo "✅ 打包完成！"
echo "===================================="
echo ""
echo "生成的文件："
echo "  ${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz (${TAR_SIZE})"
echo "  ${OUTPUT_DIR}/${PACKAGE_NAME}.zip (${ZIP_SIZE})"
echo ""
echo "校验文件："
echo "  ${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz.sha256"
echo "  ${OUTPUT_DIR}/${PACKAGE_NAME}.zip.sha256"
echo ""
echo "分享方式："
echo "  1. 分享压缩包文件"
echo "  2. 或上传到网盘/文件分享服务"
echo "  3. 查看 SHARING_GUIDE.md 了解详细分享指南"
echo ""
