# 知识库处理平台 - 部署指南

## 项目概述

这是一个企业级知识库管理平台，支持多格式文档解析、智能AI加工、知识管理和问答对生成。

**核心功能**：
- 📄 多格式文档解析（PDF/Word/Excel/图片/音视频）
- 🤖 AI智能处理（OCR/ASR/分段/摘要/关键词/QA生成）
- 📚 知识库管理（分类/标签/版本控制）
- 💬 问答对管理
- 👥 用户权限管理

---

## 技术栈

- **前端**: React 19 + Tailwind CSS 4 + shadcn/ui
- **后端**: Node.js + Express + tRPC
- **数据库**: MySQL / TiDB
- **存储**: S3兼容对象存储
- **AI**: OpenAI兼容API（支持任何兼容接口）

---

## 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0 或 TiDB
- S3兼容对象存储（可选：MinIO、阿里云OSS、腾讯云COS等）
- OpenAI兼容的LLM API（可选：OpenAI、Azure OpenAI、国内大模型等）

---

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd knowledge-base-platform
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 应用配置
VITE_APP_TITLE=知识库处理平台
VITE_APP_LOGO=/logo.png

# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/knowledge_base

# JWT密钥（用于session加密）
JWT_SECRET=your-random-secret-key-change-this

# S3对象存储配置
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=knowledge-base-files

# LLM API配置（OpenAI兼容）
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o

# OAuth配置（可选，用于第三方登录）
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com
VITE_APP_ID=your-app-id

# 管理员配置
OWNER_OPEN_ID=admin-user-id
OWNER_NAME=管理员
```

### 4. 初始化数据库

```bash
pnpm db:push
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000`

---

## 生产部署

### 方式一：Docker部署（推荐）

#### 1. 构建Docker镜像

```bash
docker build -t knowledge-base-platform .
```

#### 2. 运行容器

```bash
docker run -d \
  --name knowledge-base-platform \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/db" \
  -e JWT_SECRET="your-secret" \
  -e S3_ENDPOINT="https://s3.amazonaws.com" \
  -e S3_ACCESS_KEY_ID="your-key" \
  -e S3_SECRET_ACCESS_KEY="your-secret" \
  -e S3_BUCKET="your-bucket" \
  -e LLM_API_URL="https://api.openai.com/v1" \
  -e LLM_API_KEY="sk-your-key" \
  knowledge-base-platform
```

#### 3. 使用Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://user:password@db:3306/knowledge_base
      - JWT_SECRET=your-random-secret
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
      - S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET}
      - LLM_API_URL=${LLM_API_URL}
      - LLM_API_KEY=${LLM_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=knowledge_base
      - MYSQL_USER=user
      - MYSQL_PASSWORD=password
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

启动：

```bash
docker-compose up -d
```

---

### 方式二：传统部署

#### 1. 构建生产版本

```bash
pnpm build
```

#### 2. 启动生产服务器

```bash
NODE_ENV=production node dist/server/index.js
```

#### 3. 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start dist/server/index.js --name knowledge-base-platform

# 设置开机自启
pm2 startup
pm2 save
```

---

### 方式三：云平台部署

#### Vercel / Netlify（仅前端）

1. 连接GitHub仓库
2. 配置构建命令：`pnpm build`
3. 配置输出目录：`dist/client`
4. 后端需要单独部署到支持Node.js的平台

#### Railway / Render（全栈）

1. 连接GitHub仓库
2. 自动检测Node.js项目
3. 配置环境变量
4. 自动部署

#### 阿里云 / 腾讯云（服务器）

1. 购买云服务器（ECS/CVM）
2. 安装Node.js、MySQL
3. 克隆代码并配置
4. 使用Nginx反向代理
5. 配置SSL证书

---

## 去除Manus品牌元素

### 1. 修改应用名称和Logo

在 `.env` 文件中修改：

```env
VITE_APP_TITLE=知识库处理平台
VITE_APP_LOGO=/logo.png
```

将您的Logo文件放到 `client/public/logo.png`

### 2. 替换OAuth认证（可选）

如果不使用Manus OAuth，可以集成其他认证方案：

**选项A：自建认证系统**
- 修改 `server/_core/auth.ts`
- 实现用户注册/登录逻辑
- 使用JWT管理session

**选项B：第三方OAuth**
- GitHub OAuth
- Google OAuth
- 企业微信
- 钉钉

**选项C：禁用认证（仅内网使用）**
- 修改 `server/_core/trpc.ts`
- 将 `protectedProcedure` 改为 `publicProcedure`

### 3. 替换LLM服务

支持任何OpenAI兼容的API：

```env
# OpenAI官方
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-key

# Azure OpenAI
LLM_API_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
LLM_API_KEY=your-azure-key

# 国内大模型（以智谱AI为例）
LLM_API_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your-zhipu-key

# 本地部署（Ollama）
LLM_API_URL=http://localhost:11434/v1
LLM_API_KEY=ollama
```

### 4. 替换S3存储

支持任何S3兼容的对象存储：

```env
# AWS S3
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1

# 阿里云OSS
S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
S3_REGION=oss-cn-hangzhou

# 腾讯云COS
S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
S3_REGION=ap-guangzhou

# MinIO（自建）
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
```

---

## Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 前端静态文件
    location / {
        root /path/to/knowledge-base-platform/dist/client;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 数据库迁移

如果需要迁移数据库：

```bash
# 导出数据
mysqldump -u user -p knowledge_base > backup.sql

# 导入数据
mysql -u user -p new_knowledge_base < backup.sql
```

---

## 性能优化建议

1. **使用CDN**：静态资源托管到CDN
2. **数据库索引**：为常查询字段添加索引
3. **Redis缓存**：缓存热点数据
4. **负载均衡**：多实例部署
5. **文件压缩**：启用gzip/brotli压缩

---

## 监控和日志

### PM2日志

```bash
# 查看日志
pm2 logs knowledge-base-platform

# 清空日志
pm2 flush
```

### 应用日志

日志文件位置：`logs/app.log`

---

## 故障排查

### 数据库连接失败

检查 `DATABASE_URL` 配置是否正确：

```bash
mysql -h host -u user -p database
```

### S3上传失败

检查S3配置和权限：

```bash
# 使用AWS CLI测试
aws s3 ls s3://your-bucket --endpoint-url=https://your-endpoint
```

### LLM调用失败

检查API密钥和网络连接：

```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $LLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"test"}]}'
```

---

## 安全建议

1. **使用HTTPS**：生产环境必须启用SSL
2. **强密码**：JWT_SECRET使用强随机字符串
3. **定期备份**：数据库和文件定期备份
4. **访问控制**：配置防火墙规则
5. **更新依赖**：定期更新npm包
6. **环境隔离**：开发/测试/生产环境分离

---

## 开源协议

MIT License

---

## 技术支持

- GitHub Issues: <your-repo-url>/issues
- 文档: <your-docs-url>
- 邮箱: <your-email>

---

## 更新日志

### v1.0.0 (2025-10-17)

- ✅ 初始版本发布
- ✅ 支持PDF/Word/Excel/图片/音视频解析
- ✅ 集成LLM智能处理
- ✅ 知识库和QA对管理
- ✅ 用户权限系统

