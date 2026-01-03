
import React, { useState, useMemo } from 'react';
import { CharacterProfile, KeyItem, Language, TRANSLATIONS } from '../types';
import { CharacterBible } from './CharacterBible';
import { ItemLibrary } from './ItemLibrary';

interface GlobalAssetVaultProps {
  characters: CharacterProfile[];
  items: KeyItem[];
  onUpdateCharacters: (chars: CharacterProfile[]) => void;
  onUpdateItems: (items: KeyItem[]) => void;
  onGenerateCharRef: (index: number) => void;
  isGeneratingGlobalRef: number | null;
  onClose: () => void;
  language: Language;
}

export const GlobalAssetVault: React.FC<GlobalAssetVaultProps> = ({
  characters,
  items,
  onUpdateCharacters,
  onUpdateItems,
  onGenerateCharRef,
  isGeneratingGlobalRef,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'chars' | 'items'>('chars');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase()));
  }, [characters, search]);

  const filteredItems = useMemo(() => {
    return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (!window.confirm(language === 'zh' ? '确定删除选中的资源吗？' : 'Delete selected assets?')) return;
    if (activeTab === 'chars') {
      onUpdateCharacters(characters.filter(c => !selectedIds.has(c.id)));
    } else {
      onUpdateItems(items.filter(i => !selectedIds.has(i.id)));
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-[1600px] h-full max-h-[95vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-widest">{t.libraryTitle}</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Central repository for all cross-project production assets.</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center gap-6 sticky top-[108px] z-40">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button 
              onClick={() => { setActiveTab('chars'); setSelectedIds(new Set()); }}
              className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'chars' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.tabCharacters}
            </button>
            <button 
              onClick={() => { setActiveTab('items'); setSelectedIds(new Set()); }}
              className={`px-10 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.tabItems}
            </button>
          </div>

          <div className="flex-1 relative min-w-[350px]">
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-4 text-sm text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-8 py-3.5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {t.btnDeleteSelected} ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-950/20">
          {activeTab === 'chars' ? (
            <div className="flex flex-col gap-12 max-w-[1200px] mx-auto pb-20">
              {filteredCharacters.map((char) => {
                const globalIndex = characters.findIndex(c => c.id === char.id);
                return (
                  <div key={char.id} className="relative group w-full">
                    <div className={`absolute top-6 left-6 z-20 transition-opacity ${selectedIds.has(char.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(char.id)}
                        onChange={() => toggleSelection(char.id)}
                        className="w-7 h-7 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-xl border-2"
                      />
                    </div>
                    <CharacterBible 
                      profiles={[char]}
                      onAdd={() => {}} 
                      onUpdate={(i, f, v) => {
                        const updated = [...characters];
                        if (globalIndex !== -1) {
                          if (f === 'keyFeatures' && typeof v === 'string') {
                            (updated[globalIndex] as any)[f] = v.split(',').map(s => s.trim());
                          } else {
                            (updated[globalIndex] as any)[f] = v;
                          }
                          onUpdateCharacters(updated);
                        }
                      }}
                      onRemove={() => onUpdateCharacters(characters.filter(c => c.id !== char.id))}
                      onGenerateRef={() => globalIndex !== -1 && onGenerateCharRef(globalIndex)} 
                      isGeneratingRef={isGeneratingGlobalRef === globalIndex ? 0 : null}
                      language={language}
                    />
                  </div>
                );
              })}
              {filteredCharacters.length === 0 && <p className="text-center text-slate-600 py-32 italic text-lg uppercase tracking-widest">{t.libEmpty}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 max-w-[1400px] mx-auto pb-20">
               {filteredItems.map((item) => (
                <div key={item.id} className="relative group h-full">
                  <div className={`absolute top-6 left-6 z-20 transition-opacity ${selectedIds.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-7 h-7 rounded-lg border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-xl border-2"
                    />
                  </div>
                  <div className="h-full">
                    <ItemLibrary 
                      items={[item]}
                      onAdd={() => {}}
                      onUpdate={(i, f, v) => {
                        const updated = [...items];
                        const globalIdx = updated.findIndex(itm => itm.id === item.id);
                        if (globalIdx !== -1) {
                          (updated[globalIdx] as any)[f] = v;
                          onUpdateItems(updated);
                        }
                      }}
                      onRemove={() => onUpdateItems(items.filter(i => i.id !== item.id))}
                      language={language}
                    />
                  </div>
                </div>
               ))}
               {filteredItems.length === 0 && <p className="col-span-full text-center text-slate-600 py-32 italic text-lg uppercase tracking-widest">{t.libEmpty}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-800 bg-slate-900 flex justify-end sticky bottom-0 z-40 shadow-2xl">
          <button 
            onClick={() => {
              if (activeTab === 'chars') onUpdateCharacters([...characters, { id: crypto.randomUUID(), name: '', description: '', keyFeatures: [], isGlobal: true }]);
              else onUpdateItems([...items, { id: crypto.randomUUID(), name: '', description: '', isGlobal: true }]);
            }}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.25rem] text-sm font-black shadow-2xl shadow-indigo-600/30 active:scale-95 transition-all uppercase tracking-widest"
          >
            {activeTab === 'chars' ? t.addCharacter : t.addItem}
          </button>
        </div>
      </div>
    </div>
  );
};
