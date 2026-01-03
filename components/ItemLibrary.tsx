
import React, { useRef } from 'react';
import { KeyItem, Language, TRANSLATIONS } from '../types';

interface ItemLibraryProps {
  items: KeyItem[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof KeyItem, value: string) => void;
  onRemove: (index: number) => void;
  language: Language;
}

export const ItemLibrary: React.FC<ItemLibraryProps> = ({ items, onAdd, onUpdate, onRemove, language }) => {
  const t = TRANSLATIONS[language];
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdate(index, 'imageUrl', ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {items.length > 1 && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-slate-300">{t.labelKeyItems}</label>
          <button 
            onClick={onAdd}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20"
          >
            {t.addItem}
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row gap-6 animate-in fade-in duration-300 group shadow-lg">
            <div 
              onClick={() => fileInputRefs.current[idx]?.click()}
              className="w-full sm:w-40 h-40 bg-slate-950 rounded-2xl flex-shrink-0 border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer relative group/img shadow-inner"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-110 duration-500" />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Asset</span>
                </div>
              )}
              <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Replace</span>
              </div>
              <input type="file" className="hidden" ref={el => fileInputRefs.current[idx] = el} onChange={e => handleImageUpload(idx, e)} />
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.itemName}</label>
                <input 
                  value={item.name} 
                  onChange={e => onUpdate(idx, 'name', e.target.value)} 
                  placeholder={t.itemName}
                  className="bg-slate-950 border border-slate-800 w-full px-5 py-3 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{t.itemDescription}</label>
                <textarea 
                  value={item.description} 
                  onChange={e => onUpdate(idx, 'description', e.target.value)} 
                  placeholder={t.itemDescription}
                  className="bg-slate-950 border border-slate-800 w-full p-5 text-sm text-slate-400 outline-none focus:border-indigo-500 rounded-xl resize-none h-full min-h-[100px] shadow-inner leading-relaxed"
                />
              </div>
            </div>

            <button onClick={() => onRemove(idx)} className="self-start text-slate-700 hover:text-red-500 transition-all p-2 hover:bg-red-500/10 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
