#!/bin/bash

# PokerIQ Pro 快速本地测试（不使用Docker）

echo "🚀 启动本地测试环境..."

# 进入API网关目录
cd system-integration

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动Mock API网关
echo "🔌 启动Mock API网关..."
nohup node api-gateway-mock.js > ../logs/api-gateway.log 2>&1 &
API_PID=$!
echo "API网关已启动 (PID: $API_PID)"

# 等待服务启动
sleep 3

# 健康检查
echo "🏥 执行健康检查..."
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo "✅ API网关运行正常"
else
    echo "❌ API网关启动失败"
    exit 1
fi

echo ""
echo "======================================="
echo "🎯 测试环境已启动！"
echo "======================================="
echo "📱 API网关: http://localhost:3001"
echo "🏥 健康检查: http://localhost:3001/health"
echo "📊 指标监控: http://localhost:3001/metrics"
echo ""
echo "测试账户:"
echo "邮箱: test@pokeriq.com"
echo "密码: test123456"
echo ""
echo "停止服务: kill $API_PID"
echo "======================================="

# 测试登录
echo ""
echo "🧪 测试登录功能..."
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@pokeriq.com","password":"test123456"}' \
  | python3 -m json.tool

echo ""
echo "✨ 本地测试环境部署完成！"