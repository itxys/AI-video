
import React, { useState } from 'react';
import { CharacterProfile, Language, TRANSLATIONS } from '../types';

interface CharacterBibleProps {
  profiles: CharacterProfile[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof CharacterProfile, value: any) => void;
  onRemove: (index: number) => void;
  onGenerateRef: (index: number) => void;
  onSaveToLib?: (char: CharacterProfile) => void;
  language: Language;
  isGeneratingRef?: number | null;
}

export const CharacterBible: React.FC<CharacterBibleProps> = ({ 
  profiles, 
  onAdd, 
  onUpdate, 
  onRemove, 
  onGenerateRef,
  onSaveToLib,
  language,
  isGeneratingRef
}) => {
  const t = TRANSLATIONS[language];
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleSelectHistory = (idx: number, url: string) => {
    onUpdate(idx, 'referenceImageUrl', url);
  };

  return (
    <div className="space-y-8 w-full">
      {profiles.length > 1 && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-300">
            {t.labelCharacterProfile}
          </label>
          <button 
            type="button" 
            onClick={onAdd}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t.addCharacter}
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-8 w-full">
        {profiles.map((char, idx) => {
          const keyFeaturesStr = Array.isArray(char.keyFeatures) 
            ? char.keyFeatures.join(', ') 
            : (typeof char.keyFeatures === 'string' ? char.keyFeatures : '');

          const hasHistory = char.alternateImages && char.alternateImages.length > 0;

          return (
            <div key={char.id} className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2rem] relative group flex flex-col lg:flex-row gap-10 animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl w-full">
              {/* Action buttons */}
              <div className="absolute -top-3 -right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                {onSaveToLib && (
                  <button 
                    type="button"
                    onClick={() => onSaveToLib(char)}
                    title={t.btnSaveToLib}
                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="w-10 h-10 bg-slate-800 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-xl hover:scale-110 active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Visual Ref Preview */}
              <div className="flex-shrink-0 w-full lg:w-72 space-y-4">
                <div className="h-[400px] lg:h-[400px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 relative group/ref shadow-inner">
                  {char.referenceImageUrl ? (
                    <div className="relative w-full h-full cursor-zoom-in" onClick={() => setPreviewImage(char.referenceImageUrl!)}>
                      <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white drop-shadow-2xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                      {char.isGlobal && (
                        <div className="absolute top-4 left-4 bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-lg">Library</div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950/40">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-black uppercase tracking-widest opacity-30">Concept Preview</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onGenerateRef(idx); }}
                    disabled={isGeneratingRef === idx}
                    className={`absolute bottom-6 left-6 right-6 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover/ref:opacity-100 transition-all disabled:opacity-100 py-3 rounded-2xl border border-white/10 hover:bg-indigo-600`}
                  >
                    {isGeneratingRef === idx ? (
                      <div className="w-5 h-5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                    ) : (
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {char.referenceImageUrl ? t.btnGachaAgain : t.btnGenCharRef}
                      </span>
                    )}
                  </button>
                </div>

                {/* Gacha History */}
                {hasHistory && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.galleryTitle}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {char.alternateImages?.map((url, hIdx) => (
                        <button 
                          key={hIdx} 
                          onClick={() => handleSelectHistory(idx, url)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${char.referenceImageUrl === url ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105' : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" alt={`History ${hIdx}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Content */}
              <div className="flex-1 space-y-8 min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="md:col-span-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterName}</label>
                    <input 
                      type="text" 
                      placeholder={t.characterName}
                      value={char.name}
                      onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                      className="bg-slate-950 border border-slate-800 w-full px-5 py-4 rounded-2xl text-lg font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterAge}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 28"
                      value={char.age || ''}
                      onChange={(e) => onUpdate(idx, 'age', e.target.value)}
                      className="bg-slate-950 border border-slate-800 w-full px-5 py-4 rounded-2xl text-base text-slate-300 outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterGender}</label>
                    <input 
                      type="text" 
                      placeholder="M/F/O"
                      value={char.gender || ''}
                      onChange={(e) => onUpdate(idx, 'gender', e.target.value)}
                      className="bg-slate-950 border border-slate-800 w-full px-5 py-4 rounded-2xl text-base text-slate-300 outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterOccupation}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Undercover Detective / Cyberpunk Hacker"
                    value={char.occupation || ''}
                    onChange={(e) => onUpdate(idx, 'occupation', e.target.value)}
                    className="bg-slate-950 border border-slate-800 w-full px-5 py-4 rounded-2xl text-base text-slate-300 outline-none focus:border-indigo-500 transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterTraits}</label>
                      <textarea 
                        placeholder="Physical features, outfits, identifiable marks..."
                        value={keyFeaturesStr}
                        onChange={(e) => onUpdate(idx, 'keyFeatures', e.target.value)}
                        className="bg-slate-950 border border-slate-800 w-full p-5 text-base text-slate-300 outline-none focus:border-indigo-500 transition-all rounded-2xl resize-none h-32 shadow-inner leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterDescription}</label>
                      <textarea 
                        placeholder="Short summary of the character's core identity..."
                        value={char.description || ''}
                        onChange={(e) => onUpdate(idx, 'description', e.target.value)}
                        className="bg-slate-950 border border-slate-800 w-full p-5 text-base text-slate-300 outline-none focus:border-indigo-500 transition-all rounded-2xl resize-none h-32 shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterPersonality}</label>
                      <textarea 
                        placeholder="Behavioral traits, tone of voice, typical reactions..."
                        value={char.personality || ''}
                        onChange={(e) => onUpdate(idx, 'personality', e.target.value)}
                        className="bg-slate-950 border border-slate-800 w-full p-5 text-base text-slate-300 outline-none focus:border-indigo-500 transition-all rounded-2xl resize-none h-32 shadow-inner leading-relaxed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.characterBackstory}</label>
                      <textarea 
                        placeholder="Historical context, motivations, past events..."
                        value={char.backstory || ''}
                        onChange={(e) => onUpdate(idx, 'backstory', e.target.value)}
                        className="bg-slate-950 border border-slate-800 w-full p-5 text-base text-slate-300 outline-none focus:border-indigo-500 transition-all rounded-2xl resize-none h-32 shadow-inner leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {previewImage && (
        <div 
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-10 right-10 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            onClick={() => setPreviewImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500" 
              alt="Character Preview" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
