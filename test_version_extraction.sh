#!/bin/bash

# 测试版本号提取功能
echo "测试版本号提取..."

# 提取版本号（模拟GitHub Actions中的步骤）
VERSION=$(grep '"version"' smart-search-extension/manifest.json | cut -d'"' -f4)
TAG_NAME="v${VERSION}"

echo "当前版本: $VERSION"
echo "标签名称: $TAG_NAME"

# 检查版本格式
if [[ $VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
    echo "✅ 版本格式正确"
else
    echo "❌ 版本格式不正确"
fi

echo "测试完成！"
