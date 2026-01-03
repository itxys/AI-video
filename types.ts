
export type Language = 'en' | 'zh';

export interface StoryConcept {
  title: string;
  premise: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  occupation?: string;
  description: string; // Brief summary
  personality?: string;
  backstory?: string;
  keyFeatures: string[];
  referenceImageUrl?: string;
  alternateImages?: string[]; // To store multiple generation attempts
  isGlobal?: boolean;
}

export interface KeyItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isGlobal?: boolean;
}

export type ShotStatus = 'idle' | 'generating' | 'completed' | 'error' | 'animating';

export interface Shot {
  id: string;
  shotNumber: number;
  shotType: string;
  description: string;
  visualPrompt: string;
  dialogue?: string;
  imageUrl?: string;
  videoUrl?: string;
  status: ShotStatus;
  characterInvolved?: string;
  itemsInvolved?: string[]; 
  baseReferenceImage?: string; 
}

export interface StoryboardScript {
  title: string;
  theme: string;
  visualStyle: string;
  customStyleDescription?: string;
  shots: Shot[];
  referenceImages?: string[]; 
  characterProfiles?: CharacterProfile[];
  keyItems?: KeyItem[];
}

export interface SavedProject {
  id: string;
  timestamp: number;
  script: StoryboardScript;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
  visualStyle: string;
  customStyleDescription?: string;
  lastViewedShotId?: string;
}

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingLinks?: { title: string; uri: string }[];
}

export const VISUAL_STYLES = [
  { id: 'cinematic', name: { en: 'Cinematic', zh: '电影感' }, description: { en: 'High contrast, dramatic lighting, anamorphic lenses', zh: '高对比度，戏剧化光影，变形宽银幕镜头感' } },
  { id: 'anime', name: { en: 'Anime', zh: '二次元' }, description: { en: 'Modern Japanese animation style, vibrant line art', zh: '现代日系动画风格，鲜明的线条与赛璐璐上色' } },
  { id: 'noir', name: { en: 'Film Noir', zh: '黑色电影' }, description: { en: 'B&W, high contrast, moody shadows, chiaroscuro', zh: '黑白，高对比度，忧育阴影，明暗对比法' } },
  { id: 'cyberpunk', name: { en: 'Cyberpunk', zh: '赛博朋克' }, description: { en: 'Neon lights, futuristic, rainy streets, high-tech low-life', zh: '霓虹灯，未来感，多雨街道，高科技低生活' } },
  { id: 'sketch', name: { en: 'Sketch', zh: '手绘草图' }, description: { en: 'Traditional hand-drawn storyboard, charcoal and graphite', zh: '传统手绘分镜风格，木炭与石墨质感' } },
  { id: '3d-render', name: { en: '3D Render', zh: '3D 渲染' }, description: { en: 'Unreal Engine 5, Octane render, raytracing, photorealistic', zh: '虚幻引擎5，Octane 渲染，光线追踪，写实 3D' } },
  { id: 'custom', name: { en: 'Custom', zh: '自定义' }, description: { en: 'Describe your own style', zh: '描述你自己的视觉风格' } }
];

export const TRANSLATIONS = {
  en: {
    heroTitle: 'Visionary AI Studio',
    heroSubtitle: 'Choose your workflow: Quick generation from a single prompt or professional guided development.',
    modeQuickTitle: 'Quick Create',
    modeQuickDesc: 'Directly generate a full storyboard from a single sentence.',
    modeGuidedTitle: 'Pro Discovery',
    modeGuidedDesc: 'Step-by-step interactive guidance to develop deep cinematic concepts.',
    labelIdea: "What's your story idea?",
    placeholderIdea: "e.g. A noir detective enters a rainy office...",
    wizardTitle: "Story Discovery",
    wizardStep1: "Step 1: Genre & Mood",
    wizardStep2: "Step 2: Conflict & Stakes",
    wizardStep3: "Step 3: Character Role",
    wizardNext: "Next Step",
    wizardFinish: "Analyze & Refine",
    conceptPremise: "Refined Story Concept",
    btnBack: "Back",
    btnAcceptConcept: "Generate Full Script",
    btnCreateQuick: "Launch Instant Creation",
    btnCreateGuided: "Begin Guided Discovery",
    btnSave: "Save Project",
    btnSaved: "Saved",
    btnExport: "Export PDF",
    btnVisualize: "Generate View",
    btnAnimate: "Animate",
    paintingFrame: "Painting frame...",
    animatingFrame: "Animating shot...",
    deleteConfirm: "Delete this project?",
    navProjects: "Projects",
    lastEdited: "Last edited",
    proPlan: "Pro",
    assistantTitle: "Creative AI Assistant",
    chatPlaceholder: "Ask me anything...",
    videoTitle: "Video Studio",
    btnGenerateVideo: "Gen Video",
    resolutionWarning: "2K/4K/Video requires API Key.",
    confirmNo: "Cancel",
    noSavedProjects: "No projects yet.",
    labelAspect: "Aspect Ratio",
    labelSize: "Resolution",
    labelCharacterProfile: "Character Bible",
    labelKeyItems: "Key Item Library",
    addCharacter: "+ Add Character",
    addItem: "+ Add Key Item",
    btnGenCharRef: "Draw Character",
    btnGachaAgain: "Draw Again",
    assignChar: "Assign Role",
    assignItem: "Assign Item",
    consistencyBadge: "Consistent",
    actionLabel: "Action",
    videoPromptPlaceholder: "Describe the movement (e.g., slow zoom in, character smiles...)",
    btnRegenerate: "Regenerate Image",
    labelReferences: "Reference Images",
    refHint: "Drag & drop or click to upload up to 3 style/character references.",
    characterName: "Name",
    characterAge: "Age",
    characterGender: "Gender",
    characterOccupation: "Occupation",
    characterTraits: "Visual Traits",
    characterDescription: "Summary",
    characterPersonality: "Personality & Mannerisms",
    characterBackstory: "Detailed Backstory",
    itemName: "Item Name",
    itemDescription: "Visual Details",
    labelCustomStyle: "Custom Style Prompt",
    placeholderCustomStyle: "e.g. Ghibli aesthetic, oil painting texture, soft golden hour lighting...",
    confirmGenTitle: "Start Generation?",
    confirmGenDesc: "This will use processing resources. Continue?",
    btnConfirm: "Confirm",
    libraryTitle: "Asset Vault",
    btnImportFromLib: "Import from Library",
    btnSaveToLib: "Save to Library",
    libEmpty: "Your vault is empty.",
    btnManageLib: "Open Asset Vault",
    imgToImgTitle: "Image to Image",
    uploadBaseRef: "Upload Base Image",
    baseRefActive: "Using Reference Image",
    itemLibrary: "Prop & Item Library",
    tabCharacters: "Characters",
    tabItems: "Props & Items",
    btnDeleteSelected: "Delete Selected",
    searchPlaceholder: "Search assets...",
    bulkActions: "Bulk Actions",
    galleryTitle: "Generation History"
  },
  zh: {
    heroTitle: 'Visionary AI 创意工作室',
    heroSubtitle: '选择您的创作流：基于提示词快速生成，或使用专业引导模式深入打磨创意。',
    modeQuickTitle: '快速创作',
    modeQuickDesc: '一句话直接生成完整分镜，适合快速捕捉灵感。',
    modeGuidedTitle: '专业引导',
    modeGuidedDesc: '通过交互式提问，深度开发具有电影感的故事内核。',
    labelIdea: "你的故事创意是什么？",
    placeholderIdea: "例如：一位黑色电影风格的侦探走进阴雨连绵的办公室...",
    wizardTitle: "创意发现阶段",
    wizardStep1: "第一步：类型与基调",
    wizardStep2: "第二步：核心冲突",
    wizardStep3: "第三步：主角设定",
    wizardNext: "下一步",
    wizardFinish: "提炼并完善叙事",
    conceptPremise: "优化后的故事构思",
    btnBack: "返回",
    btnAcceptConcept: "基于此构思生成全部分镜",
    btnCreateQuick: "立即生成分镜",
    btnCreateGuided: "进入引导模式",
    btnSave: "保存项目",
    btnSaved: "已保存",
    btnExport: "导出 PDF",
    btnVisualize: "预览画面",
    btnAnimate: "生成视频",
    paintingFrame: "正在绘制画面...",
    animatingFrame: "正在生成视频...",
    deleteConfirm: "确定要删除这个项目吗？",
    navProjects: "我的项目",
    lastEdited: "最后编辑",
    proPlan: "专业版",
    assistantTitle: "AI 创意助手",
    chatPlaceholder: "问我任何问题...",
    videoTitle: "视频实验室",
    btnGenerateVideo: "开始生成",
    resolutionWarning: "2K/4K 和视频生成需要 API Key。",
    confirmNo: "取消",
    noSavedProjects: "暂无已保存的项目。",
    labelAspect: "画幅比例",
    labelSize: "画面分辨率",
    labelCharacterProfile: "角色档案",
    labelKeyItems: "重要物品库",
    addCharacter: "+ 新建角色",
    addItem: "+ 添加物品",
    btnGenCharRef: "生成角色 (抽卡)",
    btnGachaAgain: "再次抽卡",
    assignChar: "指定角色",
    assignItem: "指定物品",
    consistencyBadge: "已同步",
    actionLabel: "动作描述",
    videoPromptPlaceholder: "描述动态效果（例如：镜头缓慢拉近，角色微笑...）",
    btnRegenerate: "重新生成画面",
    labelReferences: "参考图",
    refHint: "拖拽或点击上传最多 3 张风格或角色参考图。",
    characterName: "姓名",
    characterAge: "年龄",
    characterGender: "性别",
    characterOccupation: "职业",
    characterTraits: "视觉特征",
    characterDescription: "简介",
    characterPersonality: "性格与言谈举止",
    characterBackstory: "详细背景故事",
    itemName: "物品名称",
    itemDescription: "外观细节描述",
    labelCustomStyle: "自定义风格描述",
    placeholderCustomStyle: "例如：吉卜力美术风格，油画质感，柔和的黄金时段光效...",
    confirmGenTitle: "确定开始生成？",
    confirmGenDesc: "该过程将消耗计算资源。是否继续？",
    btnConfirm: "确认",
    libraryTitle: "全局资源库",
    btnImportFromLib: "从库中导入",
    btnSaveToLib: "同步到资源库",
    libEmpty: "资源库为空。",
    btnManageLib: "管理资源库",
    imgToImgTitle: "图生图模式",
    uploadBaseRef: "上传底图",
    baseRefActive: "正在使用参考底图",
    itemLibrary: "重要道具与物品库",
    tabCharacters: "角色",
    tabItems: "道具物品",
    btnDeleteSelected: "删除所选",
    searchPlaceholder: "搜索资源...",
    bulkActions: "批量操作",
    galleryTitle: "历史抽卡记录"
  }
};
