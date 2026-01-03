
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StylePresets } from './components/StylePresets';
import { ShotCard } from './components/ShotCard';
import { ReferenceImageUploader } from './components/ReferenceImageUploader';
import { CharacterBible } from './components/CharacterBible';
import { ItemLibrary } from './components/ItemLibrary';
import { StoryboardScript, AspectRatio, ImageSize, Shot, Language, TRANSLATIONS, SavedProject, CharacterProfile, KeyItem, ChatMessage, StoryConcept, VISUAL_STYLES } from './types';
import { geminiService } from './services/geminiService';

const PROJECTS_KEY = 'visionary_projects_v1';
const CHAR_BIBLE_KEY = 'visionary_char_bible_v1';
const GLOBAL_LIB_KEY = 'visionary_global_library_v1';
const ITEM_LIB_KEY = 'visionary_item_library_v1';

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
  const [keyItems, setKeyItems] = useState<KeyItem[]>([]);
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

      const items = localStorage.getItem(ITEM_LIB_KEY);
      if (items) setKeyItems(JSON.parse(items));

      const lib = localStorage.getItem(GLOBAL_LIB_KEY);
      if (lib) setGlobalLibrary(JSON.parse(lib));
    } catch (e) { 
      console.error("Failed to load local storage data:", e); 
    }
  }, []);

  // Persistent Storage Sync
  useEffect(() => {
    localStorage.setItem(CHAR_BIBLE_KEY, JSON.stringify(characterProfiles));
    localStorage.setItem(ITEM_LIB_KEY, JSON.stringify(keyItems));
    localStorage.setItem(GLOBAL_LIB_KEY, JSON.stringify(globalLibrary));
  }, [characterProfiles, keyItems, globalLibrary]);

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
    if (error.message?.includes("Requested entity was not found.")) setHasKey(false);
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
    } finally { setIsProcessing(false); }
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
    } finally { setIsProcessing(false); }
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
    } finally { setIsProcessing(false); }
  };

  const handleSaveProject = useCallback(() => {
    if (!script) return;
    setIsSaving(true);
    try {
      const projectId = currentProjectId || crypto.randomUUID();
      const newProject: SavedProject = {
        id: projectId,
        timestamp: Date.now(),
        script: { ...script, characterProfiles, keyItems }, 
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
      alert("Storage limit exceeded.");
    }
  }, [script, aspectRatio, imageSize, visualStyle, customStyleDescription, currentProjectId, savedProjects, characterProfiles, keyItems]);

  const handleGenerateShot = async (shotId: string) => {
    if (!script) return;
    setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'generating' } : s) } : null);
    try {
      const shotToGen = script.shots.find(s => s.id === shotId)!;
      const url = await geminiService.generateShotImage(
        shotToGen, 
        visualStyle, 
        aspectRatio, 
        imageSize, 
        referenceImages, 
        characterProfiles,
        keyItems,
        customStyleDescription
      );
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, imageUrl: url, status: 'completed' } : s) } : null);
    } catch (e) {
      handleApiError(e);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : null);
    }
  };

  const handleAnimate = async (shotId: string, prompt: string, ratio: '16:9' | '9:16') => {
    if (!script) return;
    setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'animating' } : s) } : null);
    try {
      const shotToAni = script.shots.find(s => s.id === shotId)!;
      const videoUrl = await geminiService.animateToVideo(shotToAni.imageUrl!, prompt, ratio);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, videoUrl, status: 'completed' } : s) } : null);
    } catch (e) {
      handleApiError(e);
      setScript(prev => prev ? { ...prev, shots: prev.shots.map(s => s.id === shotId ? { ...s, status: 'error' } : s) } : null);
    }
  };

  return (
    <Layout 
      language={language} onLanguageChange={setLanguage} 
      savedProjects={savedProjects} 
      onLoadProject={(p) => { 
        setScript(p.script); 
        setStep('script'); 
        setCurrentProjectId(p.id); 
        setCharacterProfiles(p.script.characterProfiles || []);
        setKeyItems(p.script.keyItems || []);
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
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {step === 'seed' && (
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in-95 pb-20">
              <div className="text-center space-y-6">
                <h2 className="text-6xl font-black text-white tracking-tight">{t.heroTitle}</h2>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">{t.heroSubtitle}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className={`p-8 rounded-3xl border transition-all ${creationMode === 'quick' ? 'bg-indigo-600/10 border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'bg-slate-900/40 border-slate-800'}`} onClick={() => setCreationMode('quick')}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${creationMode === 'quick' ? 'bg-indigo-600' : 'bg-slate-800'}`}><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <div><h3 className="text-xl font-bold text-white">{t.modeQuickTitle}</h3><p className="text-sm text-slate-500">{t.modeQuickDesc}</p></div>
                  </div>
                  {creationMode === 'quick' && (
                    <form onSubmit={handleQuickCreate} className="space-y-6 animate-in slide-in-from-top-4">
                      <textarea value={wizardData.seed} onChange={e => setWizardData({...wizardData, seed: e.target.value})} placeholder={t.placeholderIdea} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white min-h-[120px] outline-none focus:border-indigo-500 transition-all shadow-inner" required />
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-xl font-black text-lg transition-all">{t.btnCreateQuick}</button>
                    </form>
                  )}
                </div>

                <div className={`p-8 rounded-3xl border transition-all cursor-pointer ${creationMode === 'guided' ? 'bg-emerald-600/10 border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'bg-slate-900/40 border-slate-800'}`} onClick={() => setCreationMode('guided')}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-3 rounded-2xl ${creationMode === 'guided' ? 'bg-emerald-600' : 'bg-slate-800'}`}><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg></div>
                    <div><h3 className="text-xl font-bold text-white">{t.modeGuidedTitle}</h3><p className="text-sm text-slate-500">{t.modeGuidedDesc}</p></div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setCreationMode('guided'); setStep('wizard'); }} className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl ${creationMode === 'guided' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>{t.btnCreateGuided}</button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8">
                <button onClick={() => setStep('library')} className="px-10 py-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-all group">
                   <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9l-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                   <div className="text-left"><h4 className="font-bold text-white uppercase tracking-wider">{t.btnManageLib}</h4><p className="text-xs text-slate-500">Manage character and item presets.</p></div>
                </button>
              </div>

              <div className="bg-slate-900/30 p-8 rounded-3xl border border-slate-800 flex flex-wrap gap-10 items-center justify-center">
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t.labelAspect}</label><div className="flex gap-2">{(['16:9', '9:16', '1:1'] as AspectRatio[]).map(r => (<button key={r} onClick={() => setAspectRatio(r)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${aspectRatio === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{r}</button>))}</div></div>
                 <div className="space-y-3"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{t.labelSize}</label><div className="flex gap-2">{(['1K', '2K'] as ImageSize[]).map(s => (<button key={s} onClick={() => setImageSize(s)} className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${imageSize === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>{s}</button>))}</div></div>
                 <div className="space-y-3 flex-1 min-w-[200px]"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Style Direction</label><select value={visualStyle} onChange={e => setVisualStyle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 outline-none">{VISUAL_STYLES.map(s => <option key={s.id} value={s.id}>{s.name[language]}</option>)}</select></div>
              </div>
            </div>
          )}

          {step === 'concept_review' && refinedConcept && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in pb-20">
               <div className="bg-slate-900/40 p-10 rounded-3xl border border-slate-800 backdrop-blur-md space-y-12">
                 <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-widest">{refinedConcept.title}</h2>
                 <p className="text-2xl text-slate-100 italic">"{refinedConcept.premise}"</p>
                 
                 <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.itemLibrary}</h4>
                    <ItemLibrary 
                      items={keyItems} 
                      onAdd={() => setKeyItems([...keyItems, {id: crypto.randomUUID(), name: '', description: ''}])}
                      onUpdate={(i, f, v) => { const u = [...keyItems]; (u[i] as any)[f] = v; setKeyItems(u); }}
                      onRemove={(i) => setKeyItems(keyItems.filter((_, idx) => idx !== i))}
                      language={language}
                    />
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.labelCharacterProfile}</h4>
                    <CharacterBible 
                      profiles={characterProfiles} 
                      onAdd={() => setCharacterProfiles([...characterProfiles, {id: crypto.randomUUID(), name:'', description:'', keyFeatures:[]}])} 
                      onUpdate={(i,f,v) => { const u = [...characterProfiles]; (u[i] as any)[f] = typeof v === 'string' && f === 'keyFeatures' ? v.split(',').map(s=>s.trim()) : v; setCharacterProfiles(u); }} 
                      onRemove={(i) => setCharacterProfiles(characterProfiles.filter((_,idx) => idx !== i))} 
                      onGenerateRef={async (i) => { setIsGeneratingRef(i); try { const url = await geminiService.generateCharacterReference(characterProfiles[i], visualStyle); const u = [...characterProfiles]; u[i].referenceImageUrl = url; setCharacterProfiles(u); } catch (e) { handleApiError(e); } finally { setIsGeneratingRef(null); } }} 
                      language={language} 
                    />
                 </div>

                 <div className="flex gap-4 pt-10 border-t border-slate-800">
                    <button onClick={() => setStep('wizard')} className="flex-1 py-4 bg-slate-800 rounded-xl font-bold">{t.btnBack}</button>
                    <button onClick={handleAcceptConcept} disabled={isProcessing} className="flex-[3] py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-xl text-white transition-all shadow-xl">{t.btnAcceptConcept}</button>
                 </div>
               </div>
            </div>
          )}

          {step === 'script' && script && (
            <div className="space-y-10 animate-in fade-in pb-20">
              <div className="flex items-center justify-between">
                <div>
                   <button onClick={() => setStep('seed')} className="text-[10px] font-black text-indigo-400 mb-4 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>{t.btnBack}</button>
                   <h2 className="text-5xl font-black text-white">{script.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {script.shots.map(shot => (
                  <ShotCard 
                    key={shot.id} shot={shot} aspectRatio={aspectRatio}
                    characters={characterProfiles} keyItems={keyItems}
                    onGenerate={handleGenerateShot} 
                    onUpdateCharacter={(id, charId) => setScript(prev => prev ? {...prev, shots: prev.shots.map(s => s.id === id ? {...s, characterInvolved: charId} : s)} : null)}
                    onUpdateItems={(id, itemIds) => setScript(prev => prev ? {...prev, shots: prev.shots.map(s => s.id === id ? {...s, itemsInvolved: itemIds} : s)} : null)}
                    onUpdateBaseRef={(id, baseRef) => setScript(prev => prev ? {...prev, shots: prev.shots.map(s => s.id === id ? {...s, baseReferenceImage: baseRef} : s)} : null)}
                    onEditImage={(id, prompt) => {}}
                    onAnimate={handleAnimate} 
                    onReorder={(draggedId, targetId) => {}}
                    onFocus={() => {}}
                    language={language}
                    onRevert={() => {}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
