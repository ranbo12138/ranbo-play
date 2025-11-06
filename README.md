<div align="center">

# 🎨 ranbo-play

### MVU 状态栏生成器 · AI 协作编程工作台

<p align="center">
  <strong>边写代码边和 AI 聊天，让 AI 读懂你的工作区，实时协作开发</strong>
</p>

<p align="center">
  <a href="#-一键部署">一键部署</a> •
  <a href="#-核心特性">核心特性</a> •
  <a href="#-新手教程">新手教程</a> •
  <a href="#-ai-协作编程">AI 协作</a> •
  <a href="#-常见问题">常见问题</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/ranbo12138/ranbo-play?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/ranbo12138/ranbo-play?style=flat-square" alt="Stars">
  <img src="https://img.shields.io/github/forks/ranbo12138/ranbo-play?style=flat-square" alt="Forks">
  <img src="https://img.shields.io/docker/pulls/ranbo12138/ranbo-play?style=flat-square" alt="Docker Pulls">
</p>

</div>

---

## 📖 这是什么？

ranbo-play 是一款**零门槛**的 MVU 状态栏生成器，专为 TavernAI / SillyTavern 用户打造。

### 🌟 最大亮点

**🤖 AI 能读懂你的代码！**  
不是简单的聊天机器人，AI 助手可以**实时读取你的工作区内容**（HTML、CSS、JS、YAML 变量），理解你正在做什么，提供精准的代码建议和修改方案。真正的 **Vibe Coding** 体验！

**☁️ 小白友好部署！**  
无需安装 Node.js、Git 或任何开发工具，只需在容器云平台（Zeabur、Railway、Render 等）**一键拉取镜像**，3 分钟完成部署，立即使用！

---

## 🚀 一键部署（推荐小白）

### 方式一：Zeabur（推荐）

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates)

1. 点击上方按钮，登录 Zeabur
2. 选择 **Docker Image** 部署方式
3. 填写镜像地址：`ghcr.io/ranbo12138/ranbo-play:latest`
4. 点击部署，等待 1-2 分钟
5. 获取访问链接，开始使用！

💡 **Zeabur 提供免费额度**，足够个人使用。

### 方式二：Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

1. 点击按钮，登录 Railway
2. 选择 **Deploy from Docker Image**
3. 镜像地址：`ghcr.io/ranbo12138/ranbo-play:latest`
4. 部署完成后访问生成的域名

### 方式三：Render

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 创建新的 **Web Service**
3. 选择 **Deploy an existing image from a registry**
4. 镜像 URL：`ghcr.io/ranbo12138/ranbo-play:latest`
5. 选择免费计划，点击 **Create Web Service**

### 方式四：其他容器云平台

支持任何兼容 Docker 的平台，镜像地址：
```
ghcr.io/ranbo12138/ranbo-play:latest
```

---

## ✨ 核心特性

| 功能 | 说明 |
|------|------|
| 🧠 **AI 上下文感知** | AI 可读取工作区所有代码和变量，提供精准建议 |
| 💬 **Vibe Coding** | 边写代码边和 AI 聊天，实时协作开发 |
| 🖥️ **Monaco 编辑器** | VS Code 同款编辑器，支持多语言语法高亮 |
| ✅ **智能校验** | 实时检测 YAML 格式错误，精确定位问题 |
| 👁️ **实时预览** | 修改代码立即看到效果，所见即所得 |
| 📦 **一键导出** | 自动生成 Tavern 世界书、正则表达式和完整代码 |
| 🎨 **主题切换** | 浅色/深色模式，保护眼睛 |
| 💾 **自动保存** | 本地存储，关闭浏览器也不怕丢失 |
| 📱 **全平台适配** | 手机、平板、电脑完美适配 |

---

## 🤖 AI 协作编程

### 什么是 Vibe Coding？

传统 AI 助手只能回答问题，但 ranbo-play 的 AI 能**看到你的整个工作区**：

- 📄 你正在编辑的 HTML/CSS/JS 代码
- 📊 你定义的 YAML 变量结构
- 🎨 当前的样式和布局配置

### 实际使用场景

**场景 1：修改现有代码**
```
你：把生命值进度条改成红色渐变
AI：[读取你的 CSS] 我看到你的进度条在 .health-bar 类中，
    建议修改为：background: linear-gradient(90deg, #ff0000, #cc0000);
```

**场景 2：添加新功能**
```
你：我想在状态栏底部加一个经验值显示
AI：[读取你的 YAML 变量] 我看到你已经定义了 exp 和 max_exp 变量，
    我帮你生成对应的 HTML 和 CSS 代码...
```

**场景 3：调试问题**
```
你：为什么魔法值不显示？
AI：[读取你的代码] 我发现你的 YAML 中变量名是 mana，
    但 HTML 中引用的是 magic，需要统一命名。
```

### 如何配置 AI

1. 点击右上角 **⚙️ API 设置**
2. 填写配置：
   - **API Key**：你的 OpenAI API 密钥（[获取地址](https://platform.openai.com/api-keys)）
   - **Base URL**：默认 `https://api.openai.com/v1`（可使用代理或第三方服务）
   - **Model**：推荐 `gpt-4o-mini`（性价比高）或 `gpt-4`（效果更好）
3. 保存后即可开始协作编程

💡 **提示**：支持所有兼容 OpenAI API 的服务（如 Azure OpenAI、国内代理等）

---

## 📚 新手教程

### 第一步：部署应用

选择上面的[一键部署](#-一键部署推荐小白)方式，获得你的专属网址。

### 第二步：配置 AI（可选但推荐）

按照 [AI 协作编程](#-ai-协作编程) 章节配置 API，解锁完整功能。

### 第三步：创建你的第一个状态栏

#### 方法 A：使用示例模板（最简单）

1. 点击左侧 **"加载示例变量"** 按钮
2. 右侧预览区自动显示效果
3. 点击 **"生成输出"** 获取代码
4. 复制到 Tavern 世界书中使用

#### 方法 B：让 AI 帮你做（推荐）

1. 在聊天区域描述需求：
   ```
   帮我创建一个角色状态栏，包括：
   - 生命值（红色进度条）
   - 魔法值（蓝色进度条）
   - 等级和经验值
   - 使用深色主题
   ```
2. AI 会读取你的工作区，生成完整代码
3. 将代码粘贴到编辑器
4. 在预览区查看效果，继续和 AI 调整细节

#### 方法 C：导入现有配置

如果你已有 Tavern 的 `[initvar]` 条目：

1. 点击 **"粘贴 [initvar] 内容"**
2. 粘贴你的配置
3. 自动转换为标准格式

### 第四步：导出到 Tavern

1. 点击 **"生成输出"**
2. 复制生成的内容：
   - **Tavern World Book YAML**：世界书条目
   - **正则模板**：变量匹配规则
   - **HTML/CSS/JS**：状态栏代码
3. 在 Tavern 中创建世界书条目，粘贴对应内容
4. 保存并测试

---

## 🛠️ 本地开发（开发者）

如果你想修改源码或本地调试：

### 环境要求
- Node.js ≥ 18

### 安装运行
```bash
# 克隆项目
git clone https://github.com/ranbo12138/ranbo-play.git
cd ranbo-play

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:5173`

### 可用命令
```bash
npm run dev       # 开发模式
npm run build     # 构建生产版本
npm run preview   # 预览构建结果
npm run lint      # 代码检查
```

---

## 🐳 Docker 部署（进阶）

### 使用预构建镜像

```bash
docker pull ghcr.io/ranbo12138/ranbo-play:latest
docker run -d -p 8080:80 ghcr.io/ranbo12138/ranbo-play:latest
```

访问 `http://localhost:8080`

### 使用 docker-compose

```yaml
version: '3'
services:
  ranbo-play:
    image: ghcr.io/ranbo12138/ranbo-play:latest
    ports:
      - "8080:80"
    restart: unless-stopped
```

启动：
```bash
docker-compose up -d
```

### 本地构建

```bash
docker build -t ranbo-play .
docker run -d -p 8080:80 ranbo-play
```

---

## ❓ 常见问题

<details>
<summary><strong>Q: 我完全不会编程，能用吗？</strong></summary>

**A:** 完全可以！推荐流程：
1. 使用容器云一键部署（无需安装任何软件）
2. 配置 AI 助手
3. 用自然语言告诉 AI 你想要什么
4. AI 会帮你生成所有代码

全程不需要写一行代码！
</details>

<details>
<summary><strong>Q: AI 真的能读懂我的代码吗？</strong></summary>

**A:** 是的！当你和 AI 聊天时，系统会自动把你的工作区内容（HTML、CSS、JS、YAML 变量）发送给 AI，所以 AI 能：
- 看到你当前的代码结构
- 理解你定义的变量
- 基于现有代码提供精准建议
- 帮你调试和优化

这就是 Vibe Coding 的魅力！
</details>

<details>
<summary><strong>Q: 需要付费吗？</strong></summary>

**A:** 
- **应用本身**：完全免费开源
- **部署**：容器云平台通常提供免费额度（如 Zeabur、Railway）
- **AI 功能**：需要 OpenAI API Key（按使用量付费，`gpt-4o-mini` 非常便宜）

你也可以不配置 AI，手动编辑代码，所有其他功能照常使用。
</details>

<details>
<summary><strong>Q: 支持哪些 AI 服务？</strong></summary>

**A:** 支持所有兼容 OpenAI API 格式的服务：
- ✅ OpenAI 官方
- ✅ Azure OpenAI
- ✅ 国内代理服务（如 API2D、OpenAI-SB 等）
- ✅ 自建代理（如 new-api、one-api）
- ✅ 其他兼容服务（Claude via API、Gemini via API 等）

只需修改 Base URL 和 API Key 即可。
</details>

<details>
<summary><strong>Q: 数据安全吗？</strong></summary>

**A:** 
- ✅ 所有编辑内容保存在**你的浏览器本地**，不上传服务器
- ✅ API Key 保存在**浏览器 localStorage**，仅你可见
- ✅ 与 AI 的对话通过你配置的 API 直连，不经过第三方
- ⚠️ 建议定期导出重要配置作为备份
</details>

<details>
<summary><strong>Q: 容器云部署后如何更新版本？</strong></summary>

**A:** 
1. 在容器云平台找到你的服务
2. 重新部署或触发重启
3. 系统会自动拉取最新的 `latest` 镜像

或者指定版本号：`ghcr.io/ranbo12138/ranbo-play:v1.0.0`
</details>

<details>
<summary><strong>Q: 为什么 AI 回复很慢？</strong></summary>

**A:** 可能原因：
- 网络延迟（特别是使用国外 API）
- 选择的模型较大（如 `gpt-4`）
- API 服务繁忙

建议：
- 使用国内代理服务
- 选择 `gpt-4o-mini` 模型（速度快且便宜）
- 检查 Base URL 配置是否正确
</details>

<details>
<summary><strong>Q: 如何清除所有数据？</strong></summary>

**A:** 按 F12 打开浏览器控制台，输入：
```javascript
localStorage.clear()
location.reload()
```
</details>

---

## 🎯 使用技巧

### 💡 与 AI 协作的最佳实践

1. **描述要具体**：不要说"改好看点"，而是"把进度条改成圆角，加上阴影效果"
2. **分步骤进行**：先让 AI 生成基础结构，再逐步优化细节
3. **善用预览**：每次修改后看预览效果，再告诉 AI 需要调整什么
4. **保存版本**：满意的版本及时导出备份

### 🎨 状态栏设计建议

- 使用对比色区分不同属性（生命值红色、魔法值蓝色）
- 进度条加上数值显示（如 "80/100"）
- 深色主题更适合长时间使用
- 移动端注意字体大小和间距

---

## 🔄 CI/CD

项目使用 GitHub Actions 自动构建 Docker 镜像：

- **PR 预览**：`ghcr.io/ranbo12138/ranbo-play:pr-<number>`
- **主分支**：`ghcr.io/ranbo12138/ranbo-play:latest`
- **版本发布**：`ghcr.io/ranbo12138/ranbo-play:v1.0.0`

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 贡献流程
1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

提交前请运行 `npm run lint` 确保代码质量。

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 强大的代码编辑器
- [TavernAI](https://github.com/TavernAI/TavernAI) / [SillyTavern](https://github.com/SillyTavern/SillyTavern) - 灵感来源
- 所有贡献者和用户

---

## 📞 获取帮助

- 🐛 [报告 Bug](https://github.com/ranbo12138/ranbo-play/issues)
- 💡 [功能建议](https://github.com/ranbo12138/ranbo-play/issues)
- 📖 [查看文档](./docs)
- 💬 [讨论区](https://github.com/ranbo12138/ranbo-play/discussions)

---

<div align="center">

### ⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！

**让 AI 成为你的编程伙伴，一起 Vibe Coding！**

Made with ❤️ by [ranbo12138](https://github.com/ranbo12138)

</div>