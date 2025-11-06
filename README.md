# ranbo-play MVU 状态栏生成器

## 项目概览

### 项目简介
ranbo-play 是一款专为 TavernAI / SillyTavern 场景打造的 MVU（MagVarUpdate）状态栏生成器。项目集成代码编辑、变量校验、AI 助手与预览沙箱能力，帮助开发者快速搭建可视化的状态栏与世界书条目，并保证与现有 MVU 变量体系的兼容性。

### 主要特性
- **Monaco 代码编辑器**：支持 YAML / HTML / CSS / JavaScript，多标签编辑与语法高亮。
- **AI 助手集成**：兼容 OpenAI 生态 API，可在应用内配置模型、Base URL 与密钥。
- **MVU 变量解析与验证**：内置 YAML 解析、结构校验及错误定位，保障 `stat_data` 数据质量。
- **实时预览沙箱**：通过 iframe 隔离运行生成的状态栏，自动同步变量与样式。
- **代码生成器**：一键生成状态栏 HTML / CSS / JS 以及 Tavern world book YAML 和正则模板。
- **响应式布局**：适配移动端、平板与桌面端的多列布局。
- **浅色 / 深色主题**：内置主题切换，支持即时预览。
- **本地数据持久化**：使用 `localStorage` 存储编辑内容和变量源数据，防止误关闭导致的丢失。

---

## 快速开始

### 前置要求
- Node.js ≥ 18（建议使用 LTS 版本）
- npm 或 yarn 环境

### 安装与运行
```bash
git clone https://github.com/ranbo12138/ranbo-play.git
cd ranbo-play
npm install
npm run dev
```
- 访问 `http://localhost:5173` 即可预览开发环境。

### 构建与预览
- 构建生产版本：
  ```bash
  npm run build
  ```
- 预览构建结果：
  ```bash
  npm run preview
  ```

---

## 配置说明

### API 配置
- 打开应用右上角的 **API 设置** 面板，填写以下信息：
  - **API Key**：OpenAI 兼容服务的访问密钥。
  - **Base URL**：默认指向 `https://api.openai.com/v1`，可自定义为代理或第三方服务。
  - **Model**：模型名称，例如 `gpt-4o-mini`、`gpt-4.1` 等。
- 所有配置均保存在浏览器 `localStorage`，仅对当前设备生效。

### 数据存储
- 应用使用命名空间 `mvu-generator` 进行本地持久化：
  - `mvu-generator:preview:code`：代码工作区内容。
  - `mvu-generator:variables:source`：变量编辑器中的 YAML 数据源。
- 清除数据可在浏览器开发者工具中执行：
  ```js
  localStorage.removeItem('mvu-generator:preview:code')
  localStorage.removeItem('mvu-generator:variables:source')
  ```

### 主题切换
- 页面顶部提供浅色 / 深色模式切换按钮，状态同样存储于 `localStorage`，刷新后自动恢复。

---

## 使用指南

### 变量编辑器
1. 在左侧变量面板中粘贴或编写符合 MVU 规范的 YAML `stat_data`。
2. 点击“加载示例变量”快速获取参考结构。
3. 如果已有 Tavern `[initvar]` 条目，可使用“粘贴 [initvar] 内容”按钮，自动清洗并转化为 YAML。
4. 解析错误会显示行列位置，请及时修复后再进行代码生成。

### AI 聊天助手
1. 在“聊天调试”区域配置 API 凭证和模型。
2. 描述所需的状态栏布局、变量展示方式或世界书需求。
3. 将模型返回的建议粘贴到“AI 建议”区域，可在生成代码时作为注释保留。

### 代码生成与预览
1. 根据需求调整组件名称、主题色、布局方式等选项。
2. 点击“生成输出”获取 HTML / CSS / JS / Tavern world book / 正则模板等代码片段。
3. 右侧预览沙箱会自动注入生成的资源，并通过 `postMessage` 与父页面通信，实时展示状态栏效果。
4. 可导出代码用于 Tavern 世界书或自定义前端项目。

---

## Docker 部署

### 本地构建与运行
```bash
docker build -t ranbo-play .
docker run -p 8080:80 ranbo-play
```
- 构建完成后访问 `http://localhost:8080`。

### 使用 docker-compose
仓库提供 `docker-compose.yml`，可直接启动：
```bash
docker-compose up -d
```

### 从 GHCR 拉取镜像
```bash
docker pull ghcr.io/ranbo12138/ranbo-play:latest
docker run -p 8080:80 ghcr.io/ranbo12138/ranbo-play:latest
```
- 根据 CI 流程亦可拉取 PR 或版本标签镜像（详见后文）。

---

## CI/CD 说明
- 项目使用 GitHub Actions 自动化构建与发布 Docker 镜像。
- 拉取请求（PR）会生成预览镜像：`ghcr.io/ranbo12138/ranbo-play:pr-<number>`。
- `main` 分支合并后自动更新稳定镜像：`ghcr.io/ranbo12138/ranbo-play:latest`。
- 发布版本时会推送带语义化标签的镜像，例如：`ghcr.io/ranbo12138/ranbo-play:v1.0.0`。

---

## 故障排除
- **Monaco 编辑器加载缓慢**：首次加载时需要初始化 Web Workers，网络较慢时可提前预热或使用本地 CDN。
- **CORS 错误**：自定义 API Base URL 时需确保目标服务允许浏览器跨域访问，必要时配置反向代理。
- **iframe 沙箱报错**：预览沙箱使用严格的 `sandbox` 与 CSP 设置，若引入外部脚本需确保允许域名并避免内联危险代码。
- **localStorage 数据丢失**：浏览器隐私模式或清理策略会清空本地存储，建议定期导出代码与变量备份。

---

## 开发者注意事项
- **npm scripts**：
  - `npm run dev`：启动 Vite 开发服务器。
  - `npm run build`：构建生产资源。
  - `npm run preview`：本地预览构建产物。
  - `npm run lint`：运行 ESLint 检查代码质量。
- **代码规范**：
  - 项目使用 `eslint.config.js` 配置 ESLint，集成 React Hooks 与 React Refresh 插件。
  - 禁止存在未使用变量，若需保留常量请使用全大写命名并符合 `^[A-Z_]` 规则。
- **localStorage 命名规范**：所有键以 `mvu-generator:` 为前缀，新增持久化数据时需沿用命名空间并提供清除方法。
- **贡献指南**：欢迎通过 Fork + PR 的方式贡献代码，提交前请确保通过 `npm run lint` 并附带必要的文档更新。

更多背景与使用示例可参见 [`docs/`](./docs) 目录中的教程与扩展资料。
