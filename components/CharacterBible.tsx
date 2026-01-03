
import React, { useState } from 'react';
import { CharacterProfile, Language, TRANSLATIONS } from '../types';

interface CharacterBibleProps {
  profiles: CharacterProfile[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof CharacterProfile, value: string) => void;
  onRemove: (index: number) => void;
  onGenerateRef: (index: number) => void;
  language: Language;
  isGeneratingRef?: number | null;
}

export const CharacterBible: React.FC<CharacterBibleProps> = ({ 
  profiles, 
  onAdd, 
  onUpdate, 
  onRemove, 
  onGenerateRef,
  language,
  isGeneratingRef
}) => {
  const t = TRANSLATIONS[language];
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-300">
          {t.labelCharacterProfile}
        </label>
        <button 
          type="button" 
          onClick={onAdd}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t.addCharacter}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((char, idx) => (
          <div key={char.id} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl relative group flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Remove button */}
            <button 
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute -top-2 -right-2 w-7 h-7 bg-slate-800 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Visual Ref Preview */}
            <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative group/ref mx-auto sm:mx-0 shadow-inner">
              {char.referenceImageUrl ? (
                <div className="relative w-full h-full cursor-zoom-in" onClick={() => setPreviewImage(char.referenceImageUrl!)}>
                  <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-center justify-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                     </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                   <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                   <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">No Ref</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onGenerateRef(idx); }}
                disabled={isGeneratingRef === idx}
                className={`absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/ref:opacity-100 transition-all disabled:opacity-100 py-1.5 rounded-lg border border-white/10 ${char.referenceImageUrl ? 'hover:bg-indigo-600' : ''}`}
              >
                {isGeneratingRef === idx ? (
                  <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                ) : (
                  <span className="text-[9px] font-black text-white uppercase tracking-tighter">{t.btnGenCharRef}</span>
                )}
              </button>
            </div>

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterName}</label>
                  <input 
                    type="text" 
                    placeholder={t.characterName}
                    value={char.name}
                    onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                    className="bg-slate-950 border border-slate-800 w-full px-3 py-2 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterAge}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 28"
                    value={char.age || ''}
                    onChange={(e) => onUpdate(idx, 'age', e.target.value)}
                    className="bg-slate-950 border border-slate-800 w-full px-3 py-2 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterGender}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Male"
                    value={char.gender || ''}
                    onChange={(e) => onUpdate(idx, 'gender', e.target.value)}
                    className="bg-slate-950 border border-slate-800 w-full px-3 py-2 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterOccupation}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Undercover Agent"
                    value={char.occupation || ''}
                    onChange={(e) => onUpdate(idx, 'occupation', e.target.value)}
                    className="bg-slate-950 border border-slate-800 w-full px-3 py-2 rounded-xl text-xs text-slate-300 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterTraits}</label>
                <textarea 
                  placeholder={t.characterTraits}
                  value={char.keyFeatures.join(', ')}
                  onChange={(e) => onUpdate(idx, 'keyFeatures', e.target.value)}
                  className="bg-slate-950 border border-slate-800 w-full p-3 text-xs text-slate-400 outline-none focus:border-indigo-500 transition-colors rounded-xl resize-none h-20 shadow-inner"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.characterDescription}</label>
                <textarea 
                  placeholder={t.characterDescription}
                  value={char.description || ''}
                  onChange={(e) => onUpdate(idx, 'description', e.target.value)}
                  className="bg-slate-950 border border-slate-800 w-full p-3 text-xs text-slate-400 outline-none focus:border-indigo-500 transition-colors rounded-xl resize-none h-24 shadow-inner"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Large Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
            onClick={() => setPreviewImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={previewImage} 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500" 
              alt="Character Preview" 
            />
            <div className="absolute -bottom-10 left-0 right-0 text-center">
               <p className="text-slate-500 text-xs font-medium tracking-widest uppercase">Reference Concept Sheet</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
