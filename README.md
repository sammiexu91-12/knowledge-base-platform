# 知识库处理平台

<div align="center">

![知识库处理平台](./client/public/logo.png)

**企业级知识库管理与AI智能处理平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-blue.svg)](https://reactjs.org/)

[功能特性](#功能特性) • [快速开始](#快速开始) • [部署指南](#部署指南) • [技术栈](#技术栈) • [文档](#文档)

</div>

---

## 📖 项目简介

知识库处理平台是一个功能强大的企业级知识管理系统，支持多格式文档智能解析、AI自动加工、知识库管理和智能问答。适用于企业文档管理、学术文献整理、技术文档归档等场景。

### ✨ 功能特性

#### 📄 多格式文档解析
- **文档类型**: PDF、Word、Excel、PowerPoint
- **图片格式**: JPG、PNG、TIFF、BMP
- **音视频**: MP3、WAV、MP4、AVI
- **智能识别**: 自动OCR文字识别、ASR语音转写

#### 🤖 AI智能处理
- **文本提取**: 三层智能架构（MinerU + pdf-parse + LLM多模态）
- **智能分段**: 基于语义的文本分段
- **自动摘要**: 生成精准的文档摘要
- **关键词提取**: 智能提取核心关键词
- **QA对生成**: 自动生成高质量问答对
- **多模态融合**: 支持图文、音视频混合处理

#### 📚 知识库管理
- **分类管理**: RAG、SFT、预训练、多模态分类
- **标签系统**: 灵活的标签管理
- **版本控制**: 知识片段版本追踪
- **状态管理**: 草稿、审核、发布流程
- **全文搜索**: 快速检索知识内容

#### 💬 问答对管理
- **批量生成**: 基于文档自动生成QA对
- **人工审核**: 支持人工编辑和审核
- **质量控制**: 问答对质量评估
- **导出功能**: 支持多种格式导出

#### 👥 用户权限管理
- **角色管理**: 管理员、普通用户
- **权限控制**: 细粒度权限设置
- **部门管理**: 支持多部门协作
- **审核流程**: 内容审核工作流

#### 📊 数据统计
- **实时统计**: 数据源、知识片段、QA对统计
- **任务监控**: 处理任务进度跟踪
- **可视化**: 数据可视化展示

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MySQL >= 8.0 或 TiDB
- S3兼容对象存储
- OpenAI兼容LLM API

### 安装步骤

1. **克隆项目**

```bash
git clone https://github.com/your-username/knowledge-base-platform.git
cd knowledge-base-platform
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

创建 `.env` 文件并配置必要的环境变量：

```env
# 应用配置
VITE_APP_TITLE=知识库处理平台
VITE_APP_LOGO=/logo.png

# 数据库
DATABASE_URL=mysql://user:password@localhost:3306/knowledge_base

# JWT密钥
JWT_SECRET=your-random-secret-key

# S3存储
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=your-key
S3_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket

# LLM API
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-key
```

详细配置说明请参考 [环境变量配置文档](#环境变量配置)

4. **初始化数据库**

```bash
pnpm db:push
```

5. **启动开发服务器**

```bash
pnpm dev
```

访问 `http://localhost:3000`

---

## 🏗️ 技术栈

### 前端
- **框架**: React 19
- **样式**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **路由**: wouter
- **状态管理**: React Query (via tRPC)
- **构建工具**: Vite

### 后端
- **运行时**: Node.js 22
- **框架**: Express 4
- **API**: tRPC 11
- **数据库**: Drizzle ORM + MySQL
- **认证**: JWT + OAuth
- **文件存储**: S3 SDK

### AI能力
- **文档解析**: MinerU + pdf-parse
- **OCR**: LLM多模态
- **ASR**: LLM多模态
- **文本处理**: LLM结构化输出

---

## 📦 部署指南

### Docker部署（推荐）

#### 使用Docker Compose

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑.env配置必要的环境变量
vim .env

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app
```

#### 仅启动应用（使用外部数据库）

```bash
docker-compose up -d app
```

#### 包含MinIO对象存储

```bash
docker-compose --profile with-minio up -d
```

### 传统部署

详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔧 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | MySQL连接字符串 | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | JWT密钥 | 随机字符串 |
| `S3_ENDPOINT` | S3服务端点 | `https://s3.amazonaws.com` |
| `S3_ACCESS_KEY_ID` | S3访问密钥ID | - |
| `S3_SECRET_ACCESS_KEY` | S3访问密钥 | - |
| `S3_BUCKET` | S3存储桶名称 | `knowledge-base-files` |
| `LLM_API_URL` | LLM API地址 | `https://api.openai.com/v1` |
| `LLM_API_KEY` | LLM API密钥 | `sk-xxx` |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_APP_TITLE` | 应用标题 | `知识库处理平台` |
| `VITE_APP_LOGO` | 应用Logo路径 | `/logo.png` |
| `LLM_MODEL` | LLM模型名称 | `gpt-4o` |
| `S3_REGION` | S3区域 | `us-east-1` |
| `OWNER_OPEN_ID` | 管理员ID | `admin` |
| `OWNER_NAME` | 管理员姓名 | `管理员` |

### 国内服务配置示例

<details>
<summary>点击展开查看国内LLM和存储服务配置</summary>

#### 智谱AI (GLM-4)
```env
LLM_API_URL=https://open.bigmodel.cn/api/paas/v4
LLM_API_KEY=your-zhipu-api-key
LLM_MODEL=glm-4
```

#### 阿里云通义千问
```env
LLM_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_API_KEY=sk-your-dashscope-key
LLM_MODEL=qwen-turbo
```

#### 阿里云OSS
```env
S3_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
S3_REGION=oss-cn-hangzhou
S3_ACCESS_KEY_ID=your-aliyun-access-key-id
S3_SECRET_ACCESS_KEY=your-aliyun-access-key-secret
S3_BUCKET=your-bucket-name
```

#### 腾讯云COS
```env
S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
S3_REGION=ap-guangzhou
S3_ACCESS_KEY_ID=your-tencent-secret-id
S3_SECRET_ACCESS_KEY=your-tencent-secret-key
S3_BUCKET=your-bucket-name
```

</details>

---

## 📚 文档

- [部署指南](./DEPLOYMENT.md) - 详细的部署说明
- [API文档](./docs/API.md) - tRPC API接口文档
- [开发指南](./docs/DEVELOPMENT.md) - 开发环境配置和最佳实践
- [架构设计](./docs/ARCHITECTURE.md) - 系统架构设计文档

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📄 开源协议

本项目采用 [MIT](LICENSE) 协议开源。

---

## 🙏 致谢

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [tRPC](https://trpc.io/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [MinerU](https://github.com/opendatalab/MinerU)

---

## 📧 联系方式

- GitHub Issues: [提交问题](https://github.com/your-username/knowledge-base-platform/issues)
- Email: your-email@example.com

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个Star支持一下！**

Made with ❤️ by [Your Name]

</div>

