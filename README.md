# Visionary AI Studio - AI 分镜头与剧本创作工具

Visionary AI Studio 是一款专为电影制作人、广告创意和叙事者设计的专业级分镜头脚本创作工具。它利用 Google Gemini 系列模型，实现了从“创意闪念”到“视觉分镜”再到“动态预演”的全流程 AI 驱动。

## 🌟 核心功能 (Core Features)

- **双重创作模式**:
  - **快速创作 (Quick Create)**: 输入一句话，直接生成完整的分镜脚本与视觉提示词。
  - **专业引导 (Pro Guided)**: 交互式向导，协助用户完善世界观、核心冲突与主角设定。
- **角色一致性引擎 (Character Consistency)**:
  - **全局角色库 (Global Library)**: 跨项目存储角色档案，包含视觉特征、职业、背景。
  - **角色档案 (Character Bible)**: 生成角色参考设计稿（Concept Sheet），在生成分镜时作为视觉锚点自动注入提示词。
- **高质量视觉生成**:
  - **分镜绘制**: 支持多种画幅比例（16:9, 9:16, 1:1）与分辨率（1K, 2K）。
  - **视觉风格预设**: 电影感、二次元、黑色电影、赛博朋克等多种工业级预设。
- **Veo 动态视频预演**:
  - 利用 Veo 3.1 模型将静态分镜转化为 720p 电影级动态短片。
- **生产力助手**:
  - 侧边栏 AI 助手支持 Google Search Grounding，实时解答创作过程中的技术或事实问题。

## 🛠 技术栈 (Tech Stack)

- **Frontend**: React 19 (ESM), Tailwind CSS.
- **AI SDK**: `@google/genai` (Google Generative AI SDK).
- **Models**:
  - `gemini-3-pro-preview`: 剧本逻辑生成、创意润色。
  - `gemini-3-flash-preview`: 侧边栏对话助手。
  - `gemini-2.5-flash-image` & `gemini-3-pro-image-preview`: 图像生成与编辑。
  - `veo-3.1-fast-generate-preview`: 视频生成。
- **Persistence**: Browser LocalStorage (Project & Character Library).

## 📂 项目结构 (Structure)

- `App.tsx`: 应用主状态管理与流程控制。
- `types.ts`: 全局接口定义与多语言配置。
- `services/geminiService.ts`: 封装所有 AI 交互逻辑，确保 API 调用符合最新规范。
- `components/`:
  - `CharacterBible.tsx`: 角色管理核心组件。
  - `ShotCard.tsx`: 单个分镜的交互、渲染与操作。
  - `StylePresets.tsx`: 视觉风格选择器。
  - `Layout.tsx`: 应用基础框架与项目管理。

## 🔑 环境配置 (Environment)

应用依赖 `process.env.API_KEY`。在开发或部署时，请确保：
1. **API Key 获取**: 需从 Google AI Studio 获取。
2. **结算账户**: 视频生成 (Veo) 和高分辨率图像需要关联了付费项目的 API Key。
3. **权限**: `metadata.json` 中配置了必要的摄像头与麦克风权限（预留给未来 Live API 扩展）。

## 🚀 后续开发计划 (Roadmap)

1. **导出功能**: 增加 PDF 导出，自动排版为标准的电影分镜表。
2. **Live API 集成**: 引入语音交互，实现与 AI 助手的实时“头脑风暴”对话。
3. **精准编辑 (In-painting)**: 增加对分镜局部重绘的功能。
4. **音频生成**: 为 Veo 视频自动合成背景音效或配音。

---

## 💡 开发注意事项

- **API 规范**: 修改 `geminiService.ts` 时，必须严格遵守 `@google/genai` 的初始化规范：`new GoogleGenAI({ apiKey: process.env.API_KEY })`。
- **角色锚点**: 为了保持角色一致性，生成分镜时必须同时传入 `inlineData`（参考图）和详细的 `keyFeatures` 描述。
- **性能**: 图像与视频生成为高耗时操作，已实现确认对话框以防止误触。

---
*Visionary AI Studio - Turning prompts into production.*
