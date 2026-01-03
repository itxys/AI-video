
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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-300">{t.labelKeyItems}</label>
        <button 
          onClick={onAdd}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20"
        >
          {t.addItem}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div key={item.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex gap-4 animate-in fade-in duration-300 group">
            <div 
              onClick={() => fileInputRefs.current[idx]?.click()}
              className="w-24 h-24 bg-slate-950 rounded-xl flex-shrink-0 border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer relative group/img"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[10px] font-bold text-white uppercase">Upload</span>
              </div>
              <input type="file" className="hidden" ref={el => fileInputRefs.current[idx] = el} onChange={e => handleImageUpload(idx, e)} />
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <input 
                value={item.name} 
                onChange={e => onUpdate(idx, 'name', e.target.value)} 
                placeholder={t.itemName}
                className="bg-slate-950 border border-slate-800 w-full px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500 transition-colors"
              />
              <textarea 
                value={item.description} 
                onChange={e => onUpdate(idx, 'description', e.target.value)} 
                placeholder={t.itemDescription}
                className="bg-slate-950 border border-slate-800 w-full p-2 text-[10px] text-slate-400 outline-none focus:border-indigo-500 rounded-lg resize-none h-16"
              />
            </div>

            <button onClick={() => onRemove(idx)} className="self-start text-slate-600 hover:text-red-500 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
