# 技术架构总览

本文档概述 ranbo-play MVU 状态栏生成器的目录结构、核心数据流与关键技术选型，帮助开发者快速理解项目内聚点与扩展边界。

---

## 项目结构

- `/src/components`
  - 负责 UI 呈现与交互的 React 组件集合。
  - **Layout.jsx**：主布局与导航容器，组织代码编辑区、变量编辑器、聊天面板与预览窗口。
  - **VariableEditor.jsx**：基于 Monaco 的变量编辑器，处理 YAML 输入、错误提示与示例加载。
  - **ChatInterface.jsx**：AI 助手面板，收集模型建议、生成配置并联动代码生成器。
  - **CodeEditor.jsx / CodeWorkspace.jsx**：多标签代码编辑体验，提供 HTML/CSS/JS 与世界书模板预览。
  - **PreviewSandbox.jsx**：iframe 沙箱容器，负责与父页面建立安全的 `postMessage` 信道实现实时预览。
  - **SplitPane.jsx**：自定义分栏组件，支持拖拽调整面板尺寸以适配不同终端尺寸。

- `/src/services`
  - 封装外部接口与生成逻辑，保证业务逻辑与视图层分离。
  - **openai.js**：对接 OpenAI 兼容 API（含自定义 Base URL）的聊天补全请求，提供统一的错误处理与超时控制。
  - **codeGenerator.js**：根据解析后的 `stat_data` 构造 HTML/CSS/JS、Tavern world book YAML 与正则模板，导出宏解析、元数据收集等工具函数。

- `/src/utils`
  - 工具函数与泛业务逻辑的沉淀，供多个模块复用。
  - **storage.js**：封装 `localStorage` 读写与命名空间逻辑，统一管理 `mvu-generator:*` 键值。
  - **yamlParser.js**：基于 `js-yaml` 的增强解析器，提供错误定位、`stat_data` 结构校验与 `[initvar]` 内容清洗。
  - **prompts.js**：生成 AI 聊天上下文与提示词模板的辅助方法，负责组装模型指令与变量摘要。
  - **sandboxTemplate.js**：动态生成 iframe 内注入的 HTML 模板，保证预览环境的隔离与资源加载顺序。

- `/src/context`
  - 全局状态管理与业务事件中心。
  - **ThemeContext.jsx**：主题切换（浅色 / 深色）与持久化处理。
  - **AppStateContext.jsx**：使用 `useReducer` 管理变量源、解析状态、AI 建议、生成结果等核心数据，并暴露行为方法。

- `/src/hooks`
  - **useDebouncedValue.js**：通用防抖 Hook，用于优化变量解析与预览渲染的频繁状态更新。

---

## 数据流说明

1. **变量解析链路**
   1. 用户在变量编辑器中输入或导入 YAML。
   2. `yamlParser` 对内容进行语法解析与 `stat_data` 结构校验，返回格式化结果或错误信息。
   3. 解析结果通过 `AppStateContext` 存储，触发订阅组件（代码生成器、预览沙箱、宏预览等）更新。

2. **AI 助手链路**
   1. 用户在 ChatInterface 中描述需求并配置 API 凭证。
   2. `openai.js` 基于配置调用 OpenAI 兼容 API，返回模型建议、变量总结或代码片段。
   3. 结果写回 `AppStateContext`，供变量摘要、代码生成器和日志模块消费。

3. **代码生成与预览链路**
   1. 用户点击“生成输出”，`AppStateContext` 调用 `codeGenerator.js`，结合当前变量与选项生成多种代码资产。
   2. 生成的 HTML/CSS/JS 通过 `sandboxTemplate` 注入到 iframe，预览沙箱完成渲染。
   3. 父页面与 iframe 之间使用 `postMessage` 传输最新变量与主题参数，实现实时刷新与安全隔离。

---

## 关键技术选型

- **React 18 + Vite 4**：提供现代化的开发体验、即时热更新与组件化生态。
- **Tailwind CSS**：以原子化工具类快速搭建响应式界面，并兼容浅色 / 深色主题切换。
- **Monaco Editor**：提供媲美 VS Code 的编辑体验，内置 YAML、HTML、CSS、JavaScript 等语言服务。
- **js-yaml**：负责 YAML 解析与错误处理，配合自定义校验保障 `stat_data` 格式正确。
- **localStorage**：在浏览器端持久化代码片段、变量源与用户配置，支持断点续写和多次迭代。

以上结构确保了 ranbo-play 在保持强大功能的同时具备良好的可维护性与可扩展性。
