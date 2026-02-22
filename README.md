# TreeChat (Alpha版)

TreeChat 是一个由 Google Gemini、OpenAI 等多模型（通过 Vercel AI SDK）驱动的试验性、基于节点的对话界面软件。它打破了传统线性的聊天机器人的死板模式，允许用户在一个深度分支、多路径的精美 React Flow 可视化画布中，自由地探索交互、多重推理过程和头脑风暴网络。

## 核心特性

1. **基于节点的分支探索 (Node-Based Branching)：** 每一段对话都可以随时无限衍生出任意数量的平行路径分支。非常适合用于探索不同的代码方案架构、多维度哲学情境推演或并行不同设计选项的对比。
2. **超大容量的 IndexedDB 多标签本地持久化 (Multi-Tab Persistence)：** 您所有的节点生成、连接关系线以及不同世界的对话画布，都会被自动、安全地保存在您的个人浏览器的 IndexedDB 数据库中（比 LocalStorage 大数百倍）。内置 `beforeunload` 刷入保护机制，最大限度减少页面意外关闭时的数据丢失风险。您可以创建几十个相互隔离的工作区（Tabs），哪怕不断刷新页面、重启浏览器，您的树状知识图谱也绝不会丢失！
3. **原生完美支持多模态图文流分析 (Multimodal Ready)：** 自由上传、拖拽任意数量的高清参考图片存入节点。TreeChat 底层完美处理了图片的预校验与 Base64 转码阵列，将其无缝打包投喂给后端的大模型进行强大的原生多模态视觉推理（实测支持几十张图片的单节点塞入）。
4. **Markdown 与纯文本视图秒切与复制 (Toggle MD/TXT & Copy)：** 每个卡牌节点顶部都有两个核心操作按钮。您可以一键在原生纯文本编辑器（方便自己修改提示词）与具有代码高亮的精美 Markdown 富文本排版渲染器之间来回无缝切换。同时支持一键闪电复制全量内容。
5. **自由拉伸动态弹性节点尺寸 (Adjustable Node Sizes)：** 对于极长的大模型万字推理，小卡片怎么够看？只需按住卡片右下角常驻的拉伸微三角形小把手，您即可随时犹如原生的桌面视窗一样去放大缩小每一个对话卡片的尺寸画幅。
6. **多模型 API 密钥动态配置 (Dynamic Multi-Provider Config)：** 内置可视化的 API 密钥配置面板，支持动态切换 Google Gemini、OpenAI、DeepSeek、Ollama 等任何 OpenAI-Compatible 模型服务商的 API Key。支持一键从远程拉取可用模型列表。配置数据安全地存储在您的本地浏览器中，彻底摆脱频繁修改环境变量文件的繁琐。
7. **AI 智能合并文档 (AI Merge Docs)：** 多选任意节点后，AI 会自动提取所选节点的核心内容，进行逻辑压缩与融合，生成一份综合上下文摘要作为新分支的起始节点。
8. **全局交互与操作防护 (Global UX & Safety)：** 引入了全局 Toaster 浮动消息提示与危险操作确认弹窗 (Confirm Dialog)，在您删除关键节点或历史画布时为您提供安全的拦截保护，极大地改善了核心交互体验。
9. **工作流全景数据导入/导出 (JSON Import/Export)：** 提供一键全盘将当前工作区完整的高维树状结构化节点映射图，脱水备份导出为以当前 Tab 名称命名的 `.json` 格式文件功能。同时支持从 JSON 文件导入恢复完整对话树。

## 底层技术栈架构

- **核心框架:** [Next.js 16](https://nextjs.org) (App Router 现代模式)
- **视觉层样式方案:** [Tailwind CSS v4](https://tailwindcss.com) + [Lucide React](https://lucide.dev) 无极矢量图标库 + 官方 `@tailwindcss/typography` 排版解析器
- **UI 交互与渲染引擎:** [@xyflow/react v12](https://reactflow.dev) (React Flow 定制引擎)
- **AI SDK 与大模型枢纽服务:** [Vercel AI SDK 6.0](https://sdk.vercel.ai/docs) + `@ai-sdk/google` + `@ai-sdk/openai` (双 Provider 全面支持)
- **树状微状态管理与离线持久化存储驱动:** [Zustand 5](https://zustand-demo.pmnd.rs) + 高性能原生 IndexedDB 桥接 `idb-keyval` 中间件（内置防抖写入与 `beforeunload` 数据安全刷入）
- **高自由度前端富文本解码器:** `react-markdown` + `remark-gfm` 解析库
- **字体方案:** Google [Geist](https://vercel.com/font) 字体家族 (Sans + Mono)

## 项目目录结构

```
tree_chat/
├── app/                        # Next.js App Router 页面与路由
│   ├── api/chat/route.ts       # 唯一 API 端点：多 Provider 流式 AI 对话
│   ├── page.tsx                # 首页（Header + TreeChat 画布）
│   ├── layout.tsx              # 全局布局（字体、Toaster、ConfirmDialog）
│   └── globals.css             # 全局样式 + React Flow 深色主题覆写
├── components/                 # React 组件
│   ├── TreeChat.tsx            # 主画布组件（ReactFlow 容器 + 合并栏）
│   ├── MessageNode.tsx         # 核心：消息卡片节点（含 CustomSelect 组件）
│   ├── Header.tsx              # 顶栏：Tab 管理 + 导入/导出
│   ├── ApiConfigModal.tsx      # API 密钥配置弹窗（BYOK 管理）
│   ├── ConfirmDialog.tsx       # 全局确认弹窗
│   └── Toaster.tsx             # 全局浮动通知
├── hooks/                      # 自定义 React Hooks
│   └── useApiConfigSelection.ts # API 配置+模型选择逻辑（共享 Hook）
├── store/                      # Zustand 状态管理
│   ├── useStore.ts             # 核心状态（节点/边/Tab/API配置/AI生成）
│   ├── useConfirmStore.ts      # 确认弹窗 Promise 状态
│   └── useToastStore.ts        # 通知队列状态
├── lib/                        # 类型定义与工具函数
│   └── types.ts                # TypeScript 类型（MessageRole, ApiConfig 等）
└── vision_document.md          # 产品愿景文档
```

## 快速构建与运行调试指南

1. **全新安装核心依赖环境**

   ```bash
   npm install
   ```

2. **启动高速开发服务器热更新挂载**

   ```bash
   npm run dev
   ```

   稍等片刻后，用浏览器打开 [http://localhost:3000](http://localhost:3000) 即可开始俯瞰你的画布！

3. **生产构建**
   ```bash
   npm run build
   npm run start
   ```

## 最基础的使用快捷指南

- 左上角精美的磨砂深色横条中，有一个加号按钮可以点击随时增加属于并行的隔离沙盒环境：**[ + New ] 新聊天切页卡** （支持鼠标划动、双击重命名、删除以及激活不同空间的缓存）。
- 首次打开新标签页时，系统会自动初始化一个 **System 基石节点** 与一个 **User 触发点**，让您立即开始对话。
- 选中属于 User 角色的蓝色卡片节点，您可以任意键入 Prompt 脑洞提问；或者狂点上方照片按钮（或是多选上传），向 AI 丢出你的参考蓝图。
- 写完并敲定提示词细节后...别忘了点击节点底端的 **"Generate AI Response (生成 AI 回答推理)"**。这时一颗翡翠色的模型思考节点将由您指尖开枝散叶，流式输出磅礴的分析内容！
- 如果你突然在这个思维过程萌生了新的测试方案？不需要改变这个节点，你只需要点击之前的 User 或 System 节点底部的 **"Branch New Prompt (创建新分支提问)"** 按钮，就能立刻扯出一条跟当前历史互相独立的支流宇宙供你继续发散追溯！
- 按住 **Shift 键** 可以框选多个节点，底部会弹出合并操作栏，支持 **AI 智能合并** 或 **批量删除**。

## 开发贡献指南

### 代码组织原则

- **状态管理**：所有业务状态集中在 `store/useStore.ts`，使用 Zustand 单 Store 模式。
- **共享逻辑**：跨组件的可复用逻辑抽取至 `hooks/` 目录下的自定义 Hook。
- **组件职责**：每个组件只关注渲染逻辑，业务操作委托给 Store Actions。
- **样式管理**：全局样式统一维护在 `globals.css`，组件内不使用内联 `<style>` 标签。

### 关键注意事项

- API 路由 (`app/api/chat/route.ts`) 支持双 Provider 模式（Google / OpenAI Compatible），通过请求头 `X-Provider` 和 `X-Api-Key` 动态切换。
- IndexedDB 持久化带有 300ms 防抖 + `beforeunload` 安全刷入，在修改持久化逻辑时需注意数据一致性。
- `MessageNode` 使用 `React.memo` 优化渲染性能，修改时注意引用稳定性。
