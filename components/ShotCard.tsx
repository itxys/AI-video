
import React, { useState, useEffect } from 'react';
import { Shot, Language, TRANSLATIONS, CharacterProfile } from '../types';

interface ShotCardProps {
  shot: Shot;
  onGenerate: (id: string) => void;
  onRevert: (id: string) => void;
  onUpdateCharacter: (id: string, charId: string) => void;
  onEditImage: (id: string, prompt: string) => void;
  onAnimate: (id: string, motionPrompt: string, ratio: '16:9' | '9:16') => void;
  onReorder?: (draggedId: string, targetId: string) => void;
  onFocus?: (id: string) => void;
  isFocused?: boolean;
  aspectRatio: string;
  language: Language;
  characters?: CharacterProfile[];
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
  onEditImage,
  onAnimate,
  onReorder,
  onFocus,
  isFocused,
  aspectRatio, 
  language,
  characters = []
}) => {
  const t = TRANSLATIONS[language];
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [isConfiguringAnimate, setIsConfiguringAnimate] = useState(false);
  const [confirmType, setConfirmType] = useState<'image' | 'video' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [motionPrompt, setMotionPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>(
    aspectRatio === '9:16' ? '9:16' : '16:9'
  );
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  // Rotate reassuring messages during animation
  useEffect(() => {
    let interval: number;
    if (shot.status === 'animating') {
      interval = window.setInterval(() => {
        setLoadingMessageIdx(prev => (prev + 1) % REASSURING_MESSAGES_EN.length);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [shot.status]);

  const loadingMessage = language === 'zh' 
    ? REASSURING_MESSAGES_ZH[loadingMessageIdx] 
    : REASSURING_MESSAGES_EN[loadingMessageIdx];

  const aspectRatioClass = aspectRatio === '16:9' ? 'aspect-video' : 
                         aspectRatio === '9:16' ? 'aspect-[9/16]' : 
                         aspectRatio === '4:3' ? 'aspect-[4/3]' : 
                         aspectRatio === '2:3' ? 'aspect-[2/3]' : 
                         aspectRatio === '3:2' ? 'aspect-[3/2]' : 'aspect-square';

  const assignedChar = characters.find(c => c.id === shot.characterInvolved);

  const handleApplyAnimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmType('video');
  };

  const executeAnimate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAnimate(shot.id, motionPrompt, videoAspectRatio);
    setIsConfiguringAnimate(false);
    setConfirmType(null);
  };

  const handleApplyGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmType('image');
  };

  const executeGenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerate(shot.id);
    setConfirmType(null);
  };

  const handleSelectCharacter = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    onUpdateCharacter(shot.id, charId);
    setShowCharSelect(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('shotId', shot.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('shotId');
    if (draggedId && draggedId !== shot.id && onReorder) {
      onReorder(draggedId, shot.id);
    }
  };

  return (
    <div 
      id={`shot-${shot.id}`}
      onClick={() => onFocus?.(shot.id)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`bg-slate-900 border rounded-2xl overflow-hidden flex flex-col group transition-all cursor-pointer relative ${
        isDragging ? 'opacity-40 grayscale' : 'opacity-100'
      } ${
        isFocused ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className={`relative bg-slate-950 ${aspectRatioClass} overflow-hidden group/img`}>
        {shot.videoUrl ? (
          <video 
            src={shot.videoUrl} 
            className="w-full h-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline 
            controlsList="nodownload"
          />
        ) : shot.imageUrl && shot.status !== 'animating' ? (
          <img src={shot.imageUrl} alt={shot.description} className="w-full h-full object-cover animate-in fade-in duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-950/50">
            {shot.status === 'generating' || shot.status === 'animating' ? (
              <div className="flex flex-col items-center gap-4 max-w-[80%]">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
                  {shot.status === 'animating' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-indigo-500/20 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 animate-pulse">
                    {shot.status === 'animating' ? 'Veo Studio Processing' : 'GenAI Rendering'}
                  </p>
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    {shot.status === 'animating' ? loadingMessage : t.paintingFrame}
                  </p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleApplyGenerate}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                {t.btnVisualize}
              </button>
            )}
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          <div className="flex items-center bg-indigo-600 shadow-lg rounded-lg overflow-hidden border border-indigo-400/30">
            <span className="px-2 py-1 text-[11px] font-black text-white bg-indigo-700">#{shot.shotNumber}</span>
            <span className="px-2 py-1 text-[9px] font-bold text-indigo-100 uppercase">{shot.shotType}</span>
          </div>
          
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowCharSelect(!showCharSelect); }}
              title={assignedChar ? t.consistencyBadge : t.assignChar}
              className={`flex items-center gap-1.5 px-3 py-2 backdrop-blur-md rounded-lg border text-[10px] font-black transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
                assignedChar 
                  ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-300 ring-1 ring-emerald-500/20' 
                  : 'bg-slate-950/80 border-slate-700/50 text-slate-400 hover:bg-slate-900'
              }`}
            >
              {assignedChar ? (
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="uppercase tracking-widest text-white">{assignedChar.name}</span>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{t.assignChar}</span>
                </>
              )}
            </button>

            {showCharSelect && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-[9px] font-bold text-slate-500 px-3 py-2 uppercase tracking-widest">{t.labelCharacterProfile}</div>
                <div className="max-h-60 overflow-y-auto">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={(e) => handleSelectCharacter(e, char.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-3 transition-colors ${
                        shot.characterInvolved === char.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                        {char.referenceImageUrl ? <img src={char.referenceImageUrl} className="w-full h-full object-cover" /> : <span className="text-[8px] font-black">{char.name[0]}</span>}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-bold">{char.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drag Handle Overlay (Visible on Hover) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-move">
           <div className="bg-slate-900/80 backdrop-blur-sm p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
           </div>
        </div>

        {/* Confirmation Overlay */}
        {confirmType && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 z-[60] animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 border border-amber-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h5 className="text-sm font-black text-white mb-1 uppercase tracking-wider">{t.confirmGenTitle}</h5>
            <p className="text-[10px] text-slate-400 text-center mb-6 max-w-[200px] leading-relaxed">{t.confirmGenDesc}</p>
            <div className="flex gap-2 w-full">
              <button 
                onClick={confirmType === 'image' ? executeGenerate : executeAnimate}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-indigo-600/20"
              >
                {t.btnConfirm}
              </button>
              <button 
                onClick={() => setConfirmType(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition-all"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        )}

        {/* Animate Config Overlay */}
        {isConfiguringAnimate && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col p-5 z-30 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{t.videoTitle}</h5>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] font-bold text-slate-500">VEO FAST 3.1</span>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Motion Directives</label>
                <textarea 
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  placeholder={t.videoPromptPlaceholder}
                  className="w-full h-24 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white resize-none outline-none focus:border-indigo-500 shadow-inner leading-relaxed"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Format</label>
                <div className="flex gap-2">
                  {(['16:9', '9:16'] as const).map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setVideoAspectRatio(ratio)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all border ${
                        videoAspectRatio === ratio 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800/50">
              <button 
                onClick={handleApplyAnimate} 
                className="flex-[2] py-2.5 bg-indigo-600 rounded-xl text-xs font-black transition-all hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {t.btnGenerateVideo}
              </button>
              <button 
                onClick={() => setIsConfiguringAnimate(false)} 
                className="flex-1 py-2.5 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t.actionLabel}</h4>
          <p className="text-sm text-slate-300 line-clamp-2 italic leading-relaxed">"{shot.description}"</p>
        </div>

        <div className="mt-auto pt-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
          {shot.imageUrl && shot.status === 'completed' && !shot.videoUrl && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsConfiguringAnimate(true); }} 
              className="flex-1 py-1.5 bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 rounded-lg text-[10px] font-black transition-all hover:bg-indigo-500 flex items-center justify-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {t.btnAnimate}
            </button>
          )}
          <button 
            onClick={handleApplyGenerate} 
            className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            title={t.btnRegenerate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
