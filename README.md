# TreeChat (Alpha版)

TreeChat 是一个由 Google Gemini 3（通过 Vercel AI SDK）驱动的试验性、基于节点的对话界面软件。它打破了传统线性的聊天机器人的死板模式，允许用户在一个深度分支、多路径的精美 React Flow 可视化画布中，自由地探索交互、多重推理过程和头脑风暴网络。

## 核心特性

1. **基于节点的分支探索 (Node-Based Branching)：** 每一段对话都可以随时无限衍生出任意数量的平行路径分支。非常适合用于探索不同的代码方案架构、多维度哲学情境推演或并行不同设计选项的对比。
2. **超大容量的 IndexedDB 多标签本地持久化 (Multi-Tab Persistence)：** 您所有的节点生成、连接关系线以及不同世界的对话画布，都会被自动、安全地保存在您的个人浏览器的 IndexedDB 数据库中（比 LocalStorage 大数百倍）。您可以创建几十个相互隔离的工作区（Tabs），哪怕不断刷新页面、重启浏览器，您的树状知识图谱也绝不会丢失！
3. **原生完美支持多模态图文流分析 (Multimodal Ready)：** 自由上传、拖拽任意数量的高清参考图片存入节点。TreeChat 底层完美处理了图片的预校验与 Base64 转码阵列，将其无缝打包投喂给后端的 Gemini 大模型进行强大的原生地多模态视觉推理（实测支持几十张图片的单节点塞入）。
4. **Markdown 与纯文本视图秒切与复制 (Toggle MD/TXT & Copy)：** 每个卡牌节点顶部都有两个核心操作按钮。您可以一键在原生纯文本编辑器（方便自己修改提示词）与具有代码高亮的精美 Markdown 富文本排版渲染器之间来回无缝切换。同时支持一键闪电复制全量内容。
5. **自由拉伸动态弹性节点尺寸 (Adjustable Node Sizes)：** 对于极长的大模型万字推理，小卡片怎么够看？只需按住卡片右下角常驻的拉伸微三角形小把手，您即可随时犹如原生的桌面视窗一样去放大缩小每一个对话卡片的尺寸画幅。
6. **工作流全景数据导出 (JSON Export)：** 提供一键全盘将当前工作区完整的高维树状结构化节点映射图，脱水备份导出为结构清晰的 `.json` 格式文件功能。

## 底层技术栈架构

- **核心框架:** [Next.js 16](https://nextjs.org) (App Router 现代模式)
- **视觉层样式方案:** [Tailwind CSS v4](https://tailwindcss.com) + 高级 Lucide 无极矢量图库 + 官方 `tailwindcss/typography` 排版解析器
- **UI 交互与渲染引擎:** [@xyflow/react](https://reactflow.dev) (React Flow 定制引擎)
- **AI SDK 与大模型枢纽服务:** [Vercel AI SDK 6.0](https://sdk.vercel.ai/docs) + `@ai-sdk/google` (Google Gemini 官方直接 API 网关调用)
- **树状微状态管理与离线持久化存储驱动:** 最快的 [Zustand 5](https://zustand-demo.pmnd.rs) + 高性能的原生 IndexedDB 桥接 `idb-keyval` 中间件
- **高自由度前端富文本解码器:** `react-markdown` + 最强大的 `remark-gfm` 解析库

## 快速构建与运行调试指南

1. **全新安装核心依赖环境**

   ```bash
   npm install
   ```

2. **环境变量权限配置**
   必须在项目文件夹的最根目录下，创建一个名为 `.env.local` 的安全认证文件，并填入以下参数：

   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=在这里填入您的_GEMINI_API_KEY
   ```

3. **启动高速开发服务器热更新挂载**
   ```bash
   npm run dev
   ```
   稍等片刻后，用浏览器打开 [http://localhost:3000](http://localhost:3000) 即可开始俯瞰你的画布！

## 最基础的使用快捷指南

- 左上角精美的磨砂深色横条中，有一个加号按钮可以点击随时增加属于并行的隔离沙盒环境：**[ + New ] 新聊天切页卡** （支持鼠标划动、删除以及激活不同空间的缓存）。
- 当开启一个没有任何节点的空白虚空时，中心将有引路提示亮起：点击大按钮 **“初始化系统节点 (Initialize Chat)”**，以此落下您在这片树状知识宇宙中的第一个“System基石”与“User触发点”。
- 选中属于 User 角色的蓝色卡片节点，您可以任意键入 Prompt 脑洞提问；或者狂点上方照片按钮（或是多选上传），向 AI 丢出你的参考蓝图。
- 写完并敲定提词词细节后...别忘了点击节点底端的 **"Generate AI Response (生成 AI 回答推理)"**。这时一颗翡翠色的模型思考节点将由您指尖开枝散叶，流式输出磅礴的分析内容！
- 如果你突然在这个思维过程萌生了新的测试方案？不需要改变这个节点，你只需要点击之前的 User 或 System 节点底部的 **"Branch New Prompt (创建新分支提问)"** 按钮，就能立刻扯出一条跟当前历史互相独立的支流宇宙供你继续发散追溯！
