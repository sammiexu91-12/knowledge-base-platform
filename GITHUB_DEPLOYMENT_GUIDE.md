# GitHub部署完整指南

## 📋 部署方案

由于这是一个全栈应用，我们需要：
- **前端部署**: Vercel（免费，自动HTTPS）
- **后端部署**: Railway（免费额度，包含数据库）

**预计时间**: 15-20分钟

---

## 第一步：准备GitHub仓库

### 1.1 创建GitHub账号

如果还没有GitHub账号：
1. 访问 https://github.com
2. 点击 "Sign up" 注册
3. 验证邮箱

### 1.2 创建新仓库

1. 登录GitHub后，点击右上角 "+" → "New repository"
2. 填写仓库信息：
   - **Repository name**: `knowledge-base-platform`
   - **Description**: `企业级知识库管理与AI智能处理平台`
   - **Public/Private**: 选择 Public（公开）
   - ✅ 勾选 "Add a README file"
3. 点击 "Create repository"

### 1.3 获取仓库地址

创建完成后，复制仓库地址，格式如：
```
https://github.com/你的用户名/knowledge-base-platform.git
```

---

## 第二步：上传代码到GitHub

### 2.1 下载项目代码

从Manus下载项目文件：
1. 点击项目附件 `manus-webdev://0850ccc1`
2. 下载并解压到本地文件夹

### 2.2 初始化Git仓库

打开终端（Windows用Git Bash，Mac用Terminal），进入项目目录：

```bash
cd /path/to/knowledge-base-platform
```

初始化Git：

```bash
# 初始化仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 知识库处理平台"

# 关联远程仓库（替换成你的仓库地址）
git remote add origin https://github.com/你的用户名/knowledge-base-platform.git

# 推送到GitHub
git branch -M main
git push -u origin main
```

如果提示需要登录，输入GitHub用户名和密码（或使用Personal Access Token）。

### 2.3 验证上传成功

刷新GitHub仓库页面，应该能看到所有代码文件。

---

## 第三步：部署后端到Railway

### 3.1 注册Railway账号

1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 使用GitHub账号登录（授权Railway访问）

### 3.2 创建新项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `knowledge-base-platform` 仓库
4. Railway会自动检测到Node.js项目

### 3.3 添加MySQL数据库

1. 在项目中点击 "+ New"
2. 选择 "Database" → "Add MySQL"
3. Railway会自动创建MySQL数据库

### 3.4 配置环境变量

1. 点击后端服务（knowledge-base-platform）
2. 进入 "Variables" 标签
3. 添加以下环境变量：

**必需变量**：

```bash
# 数据库（Railway自动生成，点击MySQL服务复制）
DATABASE_URL=${{MySQL.DATABASE_URL}}

# JWT密钥（生成随机字符串）
JWT_SECRET=your-random-secret-key-change-this

# 应用配置
VITE_APP_TITLE=知识库处理平台
VITE_APP_LOGO=/logo.png

# LLM API配置（使用你的API）
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=sk-your-openai-api-key
LLM_MODEL=gpt-4o

# S3存储配置（使用你的S3服务）
S3_ENDPOINT=https://s3.amazonaws.com
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key
S3_BUCKET=knowledge-base-files

# 管理员配置
OWNER_OPEN_ID=admin
OWNER_NAME=管理员
```

**如何生成JWT_SECRET**：
```bash
# 在终端运行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5 部署后端

1. 环境变量配置完成后，Railway会自动部署
2. 等待部署完成（约2-3分钟）
3. 部署成功后，点击 "Settings" → "Generate Domain"
4. 复制生成的域名，格式如：`https://knowledge-base-platform-production.up.railway.app`

**这就是你的后端API地址！**

---

## 第四步：部署前端到Vercel

### 4.1 注册Vercel账号

1. 访问 https://vercel.com
2. 点击 "Sign Up"
3. 使用GitHub账号登录

### 4.2 导入项目

1. 点击 "Add New..." → "Project"
2. 选择 `knowledge-base-platform` 仓库
3. 点击 "Import"

### 4.3 配置构建设置

在 "Configure Project" 页面：

**Framework Preset**: Vite

**Build Command**:
```bash
pnpm build
```

**Output Directory**:
```bash
dist/client
```

**Install Command**:
```bash
pnpm install
```

### 4.4 配置环境变量

点击 "Environment Variables"，添加：

```bash
# 应用配置
VITE_APP_TITLE=知识库处理平台
VITE_APP_LOGO=/logo.png

# 后端API地址（使用Railway的域名）
VITE_API_URL=https://knowledge-base-platform-production.up.railway.app
```

### 4.5 部署前端

1. 点击 "Deploy"
2. 等待部署完成（约1-2分钟）
3. 部署成功后，Vercel会生成一个域名，格式如：
   ```
   https://knowledge-base-platform.vercel.app
   ```

**这就是你的网站链接！** 🎉

---

## 第五步：配置API连接

### 5.1 更新前端API配置

需要让前端知道后端地址。有两种方式：

**方式一：环境变量（推荐）**

在Vercel项目设置中添加环境变量：
```bash
VITE_API_URL=https://你的railway域名.up.railway.app
```

**方式二：修改代码**

编辑 `client/src/lib/trpc.ts`，添加：

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
    }),
  ],
});
```

### 5.2 配置CORS

在Railway后端添加环境变量：

```bash
ALLOWED_ORIGINS=https://knowledge-base-platform.vercel.app
```

---

## 第六步：初始化数据库

### 6.1 运行数据库迁移

在Railway项目中：
1. 点击后端服务
2. 进入 "Deployments" 标签
3. 点击最新的部署
4. 点击 "View Logs"
5. 确认数据库连接成功

或者在本地运行：

```bash
# 设置数据库连接
export DATABASE_URL="你的Railway数据库URL"

# 运行迁移
pnpm db:push
```

---

## 第七步：测试访问

### 7.1 访问网站

打开浏览器，访问你的Vercel域名：
```
https://knowledge-base-platform.vercel.app
```

### 7.2 测试功能

1. 尝试上传文件
2. 查看数据源列表
3. 检查处理任务
4. 验证知识库功能

---

## 🎯 完整部署清单

- [ ] GitHub仓库创建完成
- [ ] 代码推送到GitHub
- [ ] Railway后端部署成功
- [ ] Railway MySQL数据库创建
- [ ] Railway环境变量配置完成
- [ ] Railway域名生成
- [ ] Vercel前端部署成功
- [ ] Vercel环境变量配置完成
- [ ] Vercel域名生成
- [ ] 前后端连接测试通过
- [ ] 数据库初始化完成
- [ ] 功能测试通过

---

## 🔧 常见问题

### Q1: Railway部署失败

**检查**：
- 确认 `package.json` 中有 `start` 脚本
- 检查环境变量是否配置正确
- 查看部署日志找到具体错误

**解决**：
```json
// package.json
{
  "scripts": {
    "start": "node dist/server/index.js",
    "build": "tsc && vite build"
  }
}
```

### Q2: Vercel构建失败

**检查**：
- 确认使用pnpm作为包管理器
- 检查构建命令和输出目录
- 查看构建日志

**解决**：
在Vercel项目设置中：
- Build Command: `pnpm build`
- Output Directory: `dist/client`
- Install Command: `pnpm install`

### Q3: 前端无法连接后端

**检查**：
- 确认Railway后端正常运行
- 检查CORS配置
- 确认API地址正确

**解决**：
在Railway添加环境变量：
```bash
ALLOWED_ORIGINS=https://你的vercel域名.vercel.app
```

### Q4: 数据库连接失败

**检查**：
- Railway MySQL服务是否正常
- DATABASE_URL格式是否正确

**解决**：
在Railway MySQL服务中复制正确的DATABASE_URL。

### Q5: 文件上传失败

**检查**：
- S3配置是否正确
- S3密钥权限是否足够

**解决**：
确保S3_ACCESS_KEY_ID有上传权限，或使用Railway提供的存储服务。

---

## 🚀 进阶配置

### 自定义域名

**Vercel**:
1. 进入项目设置 → Domains
2. 添加你的域名
3. 按提示配置DNS

**Railway**:
1. 进入项目设置 → Settings
2. 添加Custom Domain
3. 配置DNS CNAME记录

### 配置HTTPS

Vercel和Railway都自动提供免费HTTPS证书，无需额外配置。

### 性能优化

1. **启用CDN**: Vercel自动提供全球CDN
2. **数据库索引**: 为常查询字段添加索引
3. **缓存策略**: 配置静态资源缓存

---

## 📊 成本估算

| 服务 | 免费额度 | 超出后价格 |
|------|---------|-----------|
| **GitHub** | 无限公开仓库 | 免费 |
| **Vercel** | 100GB带宽/月 | $20/月起 |
| **Railway** | $5免费额度/月 | 按使用量计费 |

**预计月成本**: $0（在免费额度内）

---

## 🎉 部署完成！

恭喜！你的知识库处理平台已经成功部署到云端。

**你的网站链接**：
- 前端: `https://knowledge-base-platform.vercel.app`
- 后端API: `https://knowledge-base-platform-production.up.railway.app`

**下一步**：
1. 配置自定义域名
2. 设置管理员账号
3. 上传第一个文档测试
4. 邀请团队成员使用

---

## 📞 需要帮助？

如果遇到问题：
1. 查看Railway和Vercel的部署日志
2. 检查环境变量配置
3. 参考本文档的常见问题部分
4. 在GitHub Issues提问

祝使用愉快！🚀

