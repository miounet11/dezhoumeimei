#!/bin/bash

# PokerIQ Pro 生产构建脚本
echo "🚀 开始构建 PokerIQ Pro v1.0.1..."

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf .next
rm -rf out

# 安装依赖
echo "📦 检查并安装依赖..."
npm install

# 构建项目
echo "🔨 构建生产版本..."
NODE_ENV=production npm run build

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功!"
    echo ""
    echo "📊 构建统计:"
    du -sh .next
    echo ""
    echo "🚀 启动方式:"
    echo "  开发环境: npm run dev"
    echo "  生产环境: npm start"
    echo ""
    echo "📱 多平台构建:"
    echo "  Electron桌面: npm run build:electron"
    echo "  PWA: 已集成在构建中"
    echo "  移动App: npm run build:mobile"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi