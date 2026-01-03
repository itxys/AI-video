
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StylePresets } from './components/StylePresets';
import { ShotCard } from './components/ShotCard';
import { ReferenceImageUploader } from './components/ReferenceImageUploader';
import { CharacterBible } from './components/CharacterBible';
import { StoryboardScript, AspectRatio, ImageSize, Shot, Language, TRANSLATIONS, SavedProject, CharacterProfile, ChatMessage, StoryConcept, VISUAL_STYLES } from './types';
import { geminiService } from './services/geminiService';

const PROJECTS_KEY = 'visionary_projects_v1';
const CHAR_BIBLE_KEY = 'visionary_char_bible_v1';
const GLOBAL_LIB_KEY = 'visionary_global_library_v1';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh');
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [step, setStep] = useState<'seed' | 'wizard' | 'refining' | 'concept_review' | 'script' | 'library'>('seed');
  const [creationMode, setCreationMode] = useState<'quick' | 'guided'>('quick');
  const [wizardData, setWizardData] = useState({ genre: 'Sci-Fi', conflict: '', protagonist: '', seed: '' });
  const [wizardStep, setWizardStep] = useState(0);
  
  const [visualStyle, setVisualStyle] = useState('cinematic');
  const [customStyleDescription, setCustomStyleDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [characterProfiles, setCharacterProfiles] = useState<CharacterProfile[]>([]);
  const [globalLibrary, setGlobalLibrary] = useState<CharacterProfile[]>([]);
  const [isGeneratingRef, setIsGeneratingRef] = useState<number | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refinedConcept, setRefinedConcept] = useState<StoryConcept | null>(null);
  const [script, setScript] = useState<StoryboardScript | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  // Initial Load
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    };
    checkKey();

    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (projects) setSavedProjects(JSON.parse(projects));
      
      const chars = localStorage.getItem(CHAR_BIBLE_KEY);
      if (chars) setCharacterProfiles(JSON.parse(chars));

      const lib = localStorage.getItem(GLOBAL_LIB_KEY);
      if (lib) setGlobalLibrary(JSON.parse(lib));
    } catch (e) { 
      console.error("Failed to load local storage data:", e); 
    }
  }, []);

  // Persistent Character Bible Sync
  useEffect(() => {
    try {
      localStorage.setItem(CHAR_BIBLE_KEY, JSON.stringify(characterProfiles));
    } catch (e) { console.warn(e); }
  }, [characterProfiles]);

  // Global Library Sync
  useEffect(() => {
    try {
      localStorage.setItem(GLOBAL_LIB_KEY, JSON.stringify(globalLibrary));
    } catch (e) { console.warn(e); }
  }, [globalLibrary]);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleApiError = (error: any) => {
    console.error(error);
    if (error.message?.includes("Requested entity was not found.")) {
      setHasKey(false);
    }
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardData.seed.trim()) return;
    setIsProcessing(true);
    setStep('refining');
    try {
      const result = await geminiService.generateScript(wizardData.seed, visualStyle, language, characterProfiles);
      setScript(result);
      setStep('script');
      setCurrentProjectId(crypto.randomUUID());
    } catch (e) {
      handleApiError(e);
      setStep('seed');
      alert(language === 'zh' ? '生成失败，请检查提示词或网络。' : 'Failed to generate. Please check your prompt.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartGuided = () => {
    setCreationMode('guided');
    setStep('wizard');
  };

  const handleRefineConcept = async () => {
    setIsProcessing(true);
    setStep('refining');
    try {
      const concept = await geminiService.refineConcept(wizardData, language);
      setRefinedConcept(concept);
      setStep('concept_review');
    } catch (e) { 
      handleApiError(e);
      setStep('wizard'); 
      alert(language === 'zh' ? '创意生成失败，请重试。' : 'Concept generation failed.');
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleAcceptConcept = async () => {
    if (!refinedConcept) return;
    setIsProcessing(true);
    try {
      const result = await geminiService.generateScriptFromConcept(refinedConcept, visualStyle, language, characterProfiles);
      setScript(result);
      setStep('script');
      setCurrentProjectId(crypto.randomUUID());
    } catch (e) { 
      handleApiError(e);
      alert(language === 'zh' ? '分镜生成失败，请重试。' : 'Storyboard generation failed.');
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleSaveProject = useCallback(() => {
    if (!script) return;
    setIsSaving(true);
    try {
      const projectId = currentProjectId || crypto.randomUUID();
      const newProject: SavedProject = {
        id: projectId,
        timestamp: Date.now(),
        script: { ...script, characterProfiles }, 
        aspectRatio,
        imageSize,
        visualStyle,
        customStyleDescription
      };
      const updatedProjects = [newProject, ...savedProjects.filter(p => p.id !== projectId)];
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      setSavedProjects(updatedProjects);
      if (!currentProjectId) setCurrentProjectId(projectId);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error: any) {
      setIsSaving(false);
      alert(language === 'zh' ? "存储空间不足或保存失败。" : "Save failed or storage full.");
    }
  }, [script, aspectRatio, imageSize, visualStyle, customStyleDescription, currentProjectId, savedProjects, language, characterProfiles]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput; setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatting(true);
    try {
      const res = await geminiService.chatWithGrounding(msg, chatHistory);
      setChatHistory(prev => [...prev, res]);
    } catch (e) {
      handleApiError(e);
    } finally { setIsChatting(false); }
  };

  const handleGenerateShot = async (shotId: string) => {
    setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'generating' } : s) } : null);
    try {
      const url = await geminiService.generateShotImage(
        script!.shots.find(s => s.id === shotId)!, 
        visualStyle, 
        aspectRatio, 
        imageSize, 
        referenceImages, 
        characterProfiles,
        customStyleDescription
      );
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: url, status: 'completed' } : s) } : null);
    } catch (e) {
      handleApiError(e);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : null);
    }
  };

  const handleEditShot = async (shotId: string, prompt: string) => {
    setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'generating' } : s) } : null);
    try {
      const shot = script!.shots.find(s => s.id === shotId)!;
      const url = await geminiService.editShotImage(shot.imageUrl!, prompt);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: url, status: 'completed' } : s) } : null);
    } catch (e) {
      handleApiError(e);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : null);
    }
  };

  const handleAnimate = async (shotId: string, prompt: string, ratio: '16:9' | '9:16') => {
    setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'animating' } : s) } : null);
    try {
      const videoUrl = await geminiService.animateToVideo(script!.shots.find(s => s.id === shotId)!.imageUrl!, prompt, ratio);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, videoUrl, status: 'completed' } : s) } : null);
    } catch (e) {
      handleApiError(e);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : null);
    }
  };

  const handleReorderShots = useCallback((draggedId: string, targetId: string) => {
    if (!script) return;
    const newShots = [...script.shots];
    const draggedIdx = newShots.findIndex(s => s.id === draggedId);
    const targetIdx = newShots.findIndex(s => s.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    const [removed] = newShots.splice(draggedIdx, 1);
    newShots.splice(targetIdx, 0, removed);

    const updatedShots = newShots.map((s, i) => ({ ...s, shotNumber: i + 1 }));

    setScript({ ...script, shots: updatedShots });
  }, [script]);

  const handleImportFromLib = (char: CharacterProfile) => {
    if (characterProfiles.find(p => p.id === char.id)) return;
    setCharacterProfiles([...characterProfiles, { ...char }]);
  };

  const handleSaveToLib = (char: CharacterProfile) => {
    setGlobalLibrary(prev => {
      const exists = prev.find(p => p.id === char.id);
      if (exists) return prev.map(p => p.id === char.id ? { ...char, isGlobal: true } : p);
      return [...prev, { ...char, isGlobal: true }];
    });
    alert(language === 'zh' ? '已保存到全局角色库' : 'Saved to global library');
  };

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/40 rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
           </div>
           <div className="space-y-4">
              <h1 className="text-4xl font-black text-white tracking-tighter">Visionary Studio</h1>
              <p className="text-slate-400 text-lg">Professional storyboard generation and Veo video tools require a paid project API key.</p>
              <div className="flex flex-col gap-2 pt-2">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Billing Documentation
                </a>
              </div>
           </div>
           <button 
             onClick={handleSelectKey}
             className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-600/20 text-white active:scale-[0.98]"
           >
             Select API Key
           </button>
        </div>
      </div>
    );
  }

  if (hasKey === null) return null;

  return (
    <Layout 
      language={language} onLanguageChange={setLanguage} 
      savedProjects={savedProjects} 
      onLoadProject={(p) => { 
        setScript(p.script); 
        setStep('script'); 
        setCurrentProjectId(p.id); 
        setCharacterProfiles(p.script.characterProfiles || []);
        if(p.aspectRatio) setAspectRatio(p.aspectRatio);
        if(p.imageSize) setImageSize(p.imageSize);
        if(p.visualStyle) setVisualStyle(p.visualStyle);
        if(p.customStyleDescription) setCustomStyleDescription(p.customStyleDescription);
      }}
      onDeleteProject={(id) => {
        if(window.confirm(t.deleteConfirm)) {
          const updated = savedProjects.filter(p => p.id !== id);
          setSavedProjects(updated);
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
        }
      }}
      onSave={handleSaveProject} isSaving={isSaving} hasActiveProject={!!script}
    >
      <div className="flex flex-1 relative overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {step === 'seed' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500 pb-20">
              <div className="text-center space-y-6">
                <h2 className="text-6xl font-black text-white tracking-tight">{t.heroTitle}</h2>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className={`p-8 rounded-3xl border transition-all duration-300 ${creationMode === 'quick' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`} onClick={() => setCreationMode('quick')}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${creationMode === 'quick' ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t.modeQuickTitle}</h3>
                      <p className="text-sm text-slate-500">{t.modeQuickDesc}</p>
                    </div>
                  </div>
                  {creationMode === 'quick' && (
                    <form onSubmit={handleQuickCreate} className="space-y-6 animate-in slide-in-from-top-4">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t.labelIdea}</label>
                        <textarea 
                          value={wizardData.seed} onChange={e => setWizardData({...wizardData, seed: e.target.value})}
                          placeholder={t.placeholderIdea}
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white min-h-[120px] outline-none focus:border-indigo-500 transition-all shadow-inner" required
                        />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-lg transition-all shadow-xl">{t.btnCreateQuick}</button>
                    </form>
                  )}
                </div>

                <div className={`p-8 rounded-3xl border transition-all duration-300 cursor-pointer ${creationMode === 'guided' ? 'bg-emerald-600/10 border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`} onClick={() => setCreationMode('guided')}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${creationMode === 'guided' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{t.modeGuidedTitle}</h3>
                      <p className="text-sm text-slate-500">{t.modeGuidedDesc}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleStartGuided(); }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl ${creationMode === 'guided' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{t.btnCreateGuided}</button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8">
                <button 
                  onClick={() => setStep('library')}
                  className="px-10 py-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-all group"
                >
                   <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9l-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                   </div>
                   <div className="text-left">
                      <h4 className="font-bold text-white uppercase tracking-wider">{t.btnManageLib}</h4>
                      <p className="text-xs text-slate-500">Maintain visual consistency across productions.</p>
                   </div>
                </button>
              </div>

              <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800 flex flex-wrap gap-10 items-center justify-center">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t.labelAspect}</label>
                   <div className="flex gap-2">
                     {(['16:9', '9:16', '1:1'] as AspectRatio[]).map(r => (
                       <button key={r} onClick={() => setAspectRatio(r)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${aspectRatio === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{r}</button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t.labelSize}</label>
                   <div className="flex gap-2">
                     {(['1K', '2K'] as ImageSize[]).map(s => (
                       <button key={s} onClick={() => setImageSize(s)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${imageSize === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{s}</button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-3 flex-1 min-w-[200px]">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Style Direction</label>
                   <select value={visualStyle} onChange={e => setVisualStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 outline-none">
                      {VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.name[language]}</option>)}
                   </select>
                 </div>
              </div>
            </div>
          )}

          {step === 'library' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
               <div className="flex items-center justify-between">
                  <button onClick={() => setStep('seed')} className="flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     {t.btnBack}
                  </button>
                  <h2 className="text-3xl font-black text-white uppercase tracking-widest">{t.libraryTitle}</h2>
                  <div className="w-20"></div>
               </div>

               {globalLibrary.length === 0 ? (
                 <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                    <p className="text-slate-500 text-lg">{t.libEmpty}</p>
                    <button onClick={() => setGlobalLibrary([{id: crypto.randomUUID(), name:'', description:'', keyFeatures:[], isGlobal: true}])} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">{t.addCharacter}</button>
                 </div>
               ) : (
                 <CharacterBible 
                    profiles={globalLibrary}
                    isGeneratingRef={isGeneratingRef}
                    onAdd={() => setGlobalLibrary([...globalLibrary, {id: crypto.randomUUID(), name:'', description:'', keyFeatures:[], isGlobal: true}])}
                    onUpdate={(i,f,v) => {
                       const u = [...globalLibrary];
                       (u[i] as any)[f] = typeof v === 'string' && f === 'keyFeatures' ? v.split(',').map(s=>s.trim()) : v;
                       setGlobalLibrary(u);
                    }}
                    onRemove={(i) => setGlobalLibrary(globalLibrary.filter((_,idx) => idx !== i))}
                    onGenerateRef={async (i) => {
                      setIsGeneratingRef(i);
                      try {
                        const url = await geminiService.generateCharacterReference(globalLibrary[i], 'cinematic');
                        const u = [...globalLibrary]; u[i].referenceImageUrl = url;
                        setGlobalLibrary(u);
                      } finally { setIsGeneratingRef(null); }
                    }}
                    language={language}
                 />
               )}
            </div>
          )}

          {step === 'concept_review' && refinedConcept && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-500 pb-20">
               <div className="bg-slate-900/40 p-10 rounded-3xl border border-slate-800 backdrop-blur-md space-y-10">
                 <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-widest">{refinedConcept.title}</h2>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter">Narrative Polished</div>
                 </div>
                 
                 <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.conceptPremise}</h4>
                    <p className="text-2xl text-slate-100 leading-relaxed italic font-serif">"{refinedConcept.premise}"</p>
                 </div>

                 <div className="pt-10 border-t border-slate-800 space-y-12">
                    {/* Visual Style */}
                    <div className="space-y-6">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Visual Style Selection</h4>
                       <StylePresets selectedStyle={visualStyle} onSelect={setVisualStyle} language={language} />
                       <div className="mt-6">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.labelCustomStyle}</label>
                          <textarea 
                            value={customStyleDescription}
                            onChange={(e) => setCustomStyleDescription(e.target.value)}
                            placeholder={t.placeholderCustomStyle}
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 min-h-[100px] outline-none focus:border-indigo-500 transition-all shadow-inner"
                          />
                       </div>
                    </div>
                    
                    {/* References */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelReferences}</h4>
                       <ReferenceImageUploader images={referenceImages} onImagesChange={setReferenceImages} language={language} />
                    </div>

                    {/* Library Importer */}
                    {globalLibrary.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.libraryTitle}</h4>
                        <div className="flex flex-wrap gap-4">
                           {globalLibrary.map(char => (
                             <button 
                              key={char.id}
                              onClick={() => handleImportFromLib(char)}
                              disabled={!!characterProfiles.find(p => p.id === char.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${characterProfiles.find(p => p.id === char.id) ? 'bg-slate-800 border-slate-700 opacity-50 grayscale' : 'bg-slate-900 border-slate-800 hover:border-indigo-500'}`}
                             >
                                <div className="w-10 h-10 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                                   {char.referenceImageUrl && <img src={char.referenceImageUrl} className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-xs font-bold text-slate-300">{char.name || 'Unnamed'}</span>
                             </button>
                           ))}
                        </div>
                      </div>
                    )}

                    {/* Character Bible */}
                    <div className="space-y-4">
                       <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCharacterProfile}</h4>
                       <CharacterBible 
                         profiles={characterProfiles} 
                         isGeneratingRef={isGeneratingRef}
                         onAdd={() => setCharacterProfiles([...characterProfiles, {id: crypto.randomUUID(), name:'', description:'', keyFeatures:[]}])} 
                         onUpdate={(i,f,v) => { 
                           const u = [...characterProfiles]; 
                           (u[i] as any)[f] = typeof v === 'string' && f === 'keyFeatures' ? v.split(',').map(s=>s.trim()) : v; 
                           setCharacterProfiles(u); 
                         }} 
                         onRemove={(i) => setCharacterProfiles(characterProfiles.filter((_,idx) => idx !== i))} 
                         onSaveToLib={handleSaveToLib}
                         onGenerateRef={async (i) => { 
                           setIsGeneratingRef(i);
                           try {
                             const url = await geminiService.generateCharacterReference(characterProfiles[i], visualStyle); 
                             const u = [...characterProfiles]; u[i].referenceImageUrl = url; 
                             setCharacterProfiles(u);
                           } catch (e) { handleApiError(e); } finally { setIsGeneratingRef(null); }
                         }} 
                         language={language} 
                       />
                    </div>
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button onClick={() => setStep('wizard')} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold">{t.btnBack}</button>
                    <button onClick={handleAcceptConcept} disabled={isProcessing} className="flex-[3] py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-xl text-white transition-all shadow-xl">{t.btnAcceptConcept}</button>
                 </div>
               </div>
            </div>
          )}

          {step === 'script' && script && (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-10">
                 <div>
                    <button onClick={() => setStep('seed')} className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 group">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                      {language === 'zh' ? '返回首页' : 'Home'}
                    </button>
                    <h2 className="text-5xl font-black text-white">{script.title}</h2>
                    <p className="text-slate-500 text-lg mt-2 max-w-3xl leading-relaxed">{script.theme}</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleSaveProject} 
                      disabled={isSaving}
                      className={`px-8 py-4 rounded-xl font-black flex items-center gap-3 transition-all ${isSaving ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20'}`}
                    >
                      {isSaving && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                      {isSaving ? t.btnSaved : t.btnSave}
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {script.shots.map(shot => (
                  <ShotCard 
                    key={shot.id} shot={shot} aspectRatio={aspectRatio}
                    onGenerate={handleGenerateShot} 
                    onRevert={() => {}}
                    onUpdateCharacter={(id, charId) => {
                       setScript(prev => prev ? {...prev, shots: prev.shots.map(s => s.id === id ? {...s, characterInvolved: charId} : s)} : null);
                    }}
                    onEditImage={handleEditShot}
                    onAnimate={handleAnimate} 
                    onReorder={handleReorderShots}
                    language={language} characters={characterProfiles}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-96 border-l border-slate-800 bg-slate-900/40 flex flex-col hidden xl:flex backdrop-blur-sm">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-widest text-indigo-400">{t.assistantTitle}</h3>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-slate-500">ONLINE</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30 grayscale">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                 </svg>
                 <p className="text-sm font-medium">Ready to discuss your production.</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-6' : 'bg-slate-800 text-slate-200 mr-6 border border-slate-700'}`}>
                {msg.text}
                {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {msg.groundingLinks.map((link, j) => (
                      <a key={j} href={link.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-black/30 px-2 py-1 rounded-md hover:bg-black/50 transition-colors truncate max-w-[120px]">
                        {link.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleChat} className="p-6 border-t border-slate-800 bg-slate-950">
             <div className="relative group">
               <input 
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder={t.chatPlaceholder}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-5 pr-12 py-4 text-sm outline-none focus:border-indigo-500 transition-all shadow-inner group-hover:border-slate-700"
               />
               <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:text-white transition-colors" disabled={isChatting}>
                  {isChatting ? (
                    <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
               </button>
             </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default App;
