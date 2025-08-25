FROM node:18-alpine

WORKDIR /app

# 安装wget用于健康检查
RUN apk add --no-cache wget

# 复制package.json
COPY package*.json ./
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "api-gateway-mock.js"]
