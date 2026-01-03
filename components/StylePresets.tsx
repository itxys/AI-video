
import React from 'react';
import { VISUAL_STYLES, Language } from '../types';

interface StylePresetsProps {
  selectedStyle: string;
  onSelect: (id: string) => void;
  language: Language;
}

export const StylePresets: React.FC<StylePresetsProps> = ({ selectedStyle, onSelect, language }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
      {VISUAL_STYLES.map((style) => (
        <button
          key={style.id}
          type="button"
          onClick={() => onSelect(style.id)}
          title={style.description[language]}
          className={`p-3 rounded-xl border text-left transition-all duration-200 group flex flex-col justify-between h-full ${
            selectedStyle === style.id
              ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
          }`}
        >
          <div>
            <div className={`text-sm font-semibold mb-1 ${selectedStyle === style.id ? 'text-indigo-400' : 'text-slate-200'}`}>
              {style.name[language]}
            </div>
            <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
              {style.description[language]}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
