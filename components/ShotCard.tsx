
import React, { useState, useEffect, useRef } from 'react';
import { Shot, Language, TRANSLATIONS, CharacterProfile, KeyItem } from '../types';

interface ShotCardProps {
  shot: Shot;
  onGenerate: (id: string) => void;
  onRevert: (id: string) => void;
  onUpdateCharacter: (id: string, charId: string) => void;
  onUpdateItems: (id: string, itemIds: string[]) => void;
  onUpdateBaseRef: (id: string, baseRef: string) => void;
  onEditImage: (id: string, prompt: string) => void;
  onAnimate: (id: string, motionPrompt: string, ratio: '16:9' | '9:16') => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  aspectRatio: string;
  language: Language;
  characters?: CharacterProfile[];
  keyItems?: KeyItem[];
}

const REASSURING_MESSAGES_EN = [
  "Initializing Veo high-performance engine...",
  "Analyzing keyframes for fluid motion...",
  "Interpolating temporal consistency layers...",
  "Rendering cinematic motion vectors...",
  "Finalizing video encoding and stabilization...",
  "Preparing your production-ready clip..."
];

const REASSURING_MESSAGES_ZH = [
  "正在初始化 Veo 高性能引擎...",
  "正在分析关键帧以生成流畅动态...",
  "正在计算时间一致性分层...",
  "正在渲染电影级运动矢量...",
  "正在完成视频编码与稳定化处理...",
  "准备您的专业级短片..."
];

export const ShotCard: React.FC<ShotCardProps> = ({ 
  shot, 
  onGenerate, 
  onRevert, 
  onUpdateCharacter,
  onUpdateItems,
  onUpdateBaseRef,
  onEditImage,
  onAnimate,
  onReorder,
  onFocus,
  isFocused,
  aspectRatio, 
  language,
  characters = [],
  keyItems = []
}) => {
  const t = TRANSLATIONS[language];
  const baseRefInputRef = useRef<HTMLInputElement>(null);
  
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [showItemSelect, setShowItemSelect] = useState(false);
  const [isConfiguringAnimate, setIsConfiguringAnimate] = useState(false);
  const [confirmType, setConfirmType] = useState<'image' | 'video' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>(
    aspectRatio === '9:16' ? '9:16' : '16:9'
  );
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  useEffect(() => {
    let interval: number;
    if (shot.status === 'animating') {
      interval = window.setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % REASSURING_MESSAGES_EN.length);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [shot.status]);

  const loadingMessage = language === 'zh' ? REASSURING_MESSAGES_ZH[loadingMessageIdx] : REASSURING_MESSAGES_EN[loadingMessageIdx];
  const aspectRatioClass = aspectRatio === '16:9' ? 'aspect-video' : 
                         aspectRatio === '9:16' ? 'aspect-[9/16]' : 
                         aspectRatio === '4:3' ? 'aspect-[4/3]' : 
                         aspectRatio === '2:3' ? 'aspect-[2/3]' : 
                         aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-square';

  const assignedChar = characters.find(c => c.id === shot.characterInvolved);
  const assignedItems = keyItems.filter(i => shot.itemsInvolved?.includes(i.id));

  const handleBaseRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpdateBaseRef(shot.id, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleItem = (itemId: string) => {
    const current = shot.itemsInvolved || [];
    const updated = current.includes(itemId) ? current.filter(id => id !== itemId) : [...current, itemId];
    onUpdateItems(shot.id, updated);
  };

  return (
    <div 
      onClick={() => onFocus?.(shot.id)}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('shotId', shot.id); setTimeout(() => setIsDragging(true), 0); }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const draggedId = e.dataTransfer.getData('shotId'); if (draggedId !== shot.id && onReorder) onReorder(draggedId, shot.id); }}
      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col group transition-all cursor-pointer relative ${isDragging ? 'opacity-40 grayscale' : 'opacity-100'} ${isFocused ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl' : 'border-slate-800 hover:border-slate-700'}`}
    >
      <div className={`relative bg-slate-950 ${aspectRatioClass} overflow-hidden`}>
        {shot.videoUrl ? (
          <video src={shot.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : shot.imageUrl && shot.status !== 'animating' ? (
          <img src={shot.imageUrl} className="w-full h-full object-cover animate-in fade-in" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {shot.status === 'generating' || shot.status === 'animating' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{shot.status === 'animating' ? 'Veo' : 'Rendering'}</p>
                <p className="text-[10px] text-slate-500 italic px-4">{shot.status === 'animating' ? loadingMessage : t.paintingFrame}</p>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setConfirmType('image'); }} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">{t.btnVisualize}</button>
            )}
          </div>
        )}

        {/* Top Overlays */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          <div className="flex items-center bg-indigo-600 rounded-lg overflow-hidden shadow-lg border border-indigo-500/50">
            <span className="px-2 py-1 text-[10px] font-black text-white bg-indigo-700">#{shot.shotNumber}</span>
            <span className="px-2 py-1 text-[8px] font-bold text-indigo-100 uppercase">{shot.shotType}</span>
          </div>

          <div className="flex gap-1.5">
            {/* Character Selector */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowCharSelect(!showCharSelect); setShowItemSelect(false); }} className={`p-2 rounded-lg backdrop-blur-md border transition-all ${assignedChar ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
              {showCharSelect && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30">
                  {characters.map(char => (
                    <button key={char.id} onClick={(e) => { e.stopPropagation(); onUpdateCharacter(shot.id, char.id); setShowCharSelect(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-colors ${shot.characterInvolved === char.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                      {char.name}
                    </button>
                  ))}
                  <button onClick={(e) => { e.stopPropagation(); onUpdateCharacter(shot.id, ''); setShowCharSelect(false); }} className="w-full text-left px-3 py-2 rounded-lg text-[10px] text-red-400 hover:bg-slate-800">Unassign</button>
                </div>
              )}
            </div>

            {/* Item Selector */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowItemSelect(!showItemSelect); setShowCharSelect(false); }} className={`p-2 rounded-lg backdrop-blur-md border transition-all ${assignedItems.length > 0 ? 'bg-amber-500/30 border-amber-500/50 text-amber-200' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </button>
              {showItemSelect && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30">
                  {keyItems.map(item => (
                    <button key={item.id} onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }} className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-between ${shot.itemsInvolved?.includes(item.id) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                      {item.name}
                      {shot.itemsInvolved?.includes(item.id) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Overlays (Img2Img) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          <div className="relative group/base">
            <button onClick={(e) => { e.stopPropagation(); baseRefInputRef.current?.click(); }} title={t.uploadBaseRef} className={`p-2 rounded-lg backdrop-blur-md border transition-all ${shot.baseReferenceImage ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <input type="file" className="hidden" ref={baseRefInputRef} onChange={handleBaseRefUpload} accept="image/*" />
            {shot.baseReferenceImage && (
              <button onClick={(e) => { e.stopPropagation(); onUpdateBaseRef(shot.id, ''); }} className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 text-white shadow-lg opacity-0 group-hover/base:opacity-100 transition-opacity">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Overlay */}
        {confirmType && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-[60] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h5 className="text-xs font-black text-white mb-2 uppercase">{t.confirmGenTitle}</h5>
            <p className="text-[10px] text-slate-400 text-center mb-6 leading-relaxed">{t.confirmGenDesc}</p>
            <div className="flex gap-2 w-full">
              <button onClick={(e) => { e.stopPropagation(); if (confirmType === 'image') onGenerate(shot.id); else onAnimate(shot.id, motionPrompt, videoAspectRatio); setConfirmType(null); }} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all">{t.btnConfirm}</button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmType(null); }} className="flex-1 py-2 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg">{t.confirmNo}</button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.actionLabel}</h4>
        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">"{shot.description}"</p>
        
        <div className="mt-auto pt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
          {shot.imageUrl && !shot.videoUrl && (
            <button onClick={(e) => { e.stopPropagation(); setIsConfiguringAnimate(true); }} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
              {t.btnAnimate}
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); setConfirmType('image'); }} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors" title={t.btnRegenerate}>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
