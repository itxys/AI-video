
import React, { useState, useMemo } from 'react';
import { CharacterProfile, KeyItem, Language, TRANSLATIONS } from '../types';
import { CharacterBible } from './CharacterBible';
import { ItemLibrary } from './ItemLibrary';

interface GlobalAssetVaultProps {
  characters: CharacterProfile[];
  items: KeyItem[];
  onUpdateCharacters: (chars: CharacterProfile[]) => void;
  onUpdateItems: (items: KeyItem[]) => void;
  onClose: () => void;
  language: Language;
}

export const GlobalAssetVault: React.FC<GlobalAssetVaultProps> = ({
  characters,
  items,
  onUpdateCharacters,
  onUpdateItems,
  onClose,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'chars' | 'items'>('chars');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredCharacters = useMemo(() => {
    return characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()));
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
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-full max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">{t.libraryTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">Central repository for all cross-project production assets.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => { setActiveTab('chars'); setSelectedIds(new Set()); }}
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'chars' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.tabCharacters}
            </button>
            <button 
              onClick={() => { setActiveTab('items'); setSelectedIds(new Set()); }}
              className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'items' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.tabItems}
            </button>
          </div>

          <div className="flex-1 relative">
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {selectedIds.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {t.btnDeleteSelected} ({selectedIds.size})
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'chars' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCharacters.map((char, idx) => (
                <div key={char.id} className="relative group">
                  <div className={`absolute top-4 left-4 z-20 transition-opacity ${selectedIds.has(char.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(char.id)}
                      onChange={() => toggleSelection(char.id)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <CharacterBible 
                    profiles={[char]}
                    onAdd={() => {}} 
                    onUpdate={(i, f, v) => {
                      const updated = [...characters];
                      const globalIdx = updated.findIndex(c => c.id === char.id);
                      (updated[globalIdx] as any)[f] = v;
                      onUpdateCharacters(updated);
                    }}
                    onRemove={() => onUpdateCharacters(characters.filter(c => c.id !== char.id))}
                    onGenerateRef={() => {}} // Reference generation logic omitted for global view simplicty or can be added
                    language={language}
                  />
                </div>
              ))}
              {filteredCharacters.length === 0 && <p className="col-span-2 text-center text-slate-600 py-20">{t.libEmpty}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {filteredItems.map((item, idx) => (
                <div key={item.id} className="relative group">
                  <div className={`absolute top-4 left-4 z-20 transition-opacity ${selectedIds.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelection(item.id)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <ItemLibrary 
                    items={[item]}
                    onAdd={() => {}}
                    onUpdate={(i, f, v) => {
                      const updated = [...items];
                      const globalIdx = updated.findIndex(itm => itm.id === item.id);
                      (updated[globalIdx] as any)[f] = v;
                      onUpdateItems(updated);
                    }}
                    onRemove={() => onUpdateItems(items.filter(i => i.id !== item.id))}
                    language={language}
                  />
                </div>
               ))}
               {filteredItems.length === 0 && <p className="col-span-2 text-center text-slate-600 py-20">{t.libEmpty}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={() => {
              if (activeTab === 'chars') onUpdateCharacters([...characters, { id: crypto.randomUUID(), name: '', description: '', keyFeatures: [], isGlobal: true }]);
              else onUpdateItems([...items, { id: crypto.randomUUID(), name: '', description: '', isGlobal: true }]);
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg"
          >
            {activeTab === 'chars' ? t.addCharacter : t.addItem}
          </button>
        </div>
      </div>
    </div>
  );
};
