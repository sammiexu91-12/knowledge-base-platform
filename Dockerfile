# 知识库处理平台 - Docker镜像

# 构建阶段
FROM node:22-alpine AS builder

# 安装pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 生产阶段
FROM node:22-alpine

# 安装pnpm和必要的系统依赖
RUN npm install -g pnpm && \
    apk add --no-cache \
    python3 \
    py3-pip \
    poppler-utils \
    && pip3 install --break-system-packages pdf2image

# 设置工作目录
WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/drizzle ./drizzle

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/server/index.js"]

