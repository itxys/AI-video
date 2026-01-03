
import React, { useState } from 'react';
import { Language, TRANSLATIONS, SavedProject } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSave?: () => void;
  isSaving?: boolean;
  savedProjects: SavedProject[];
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  hasActiveProject: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  language, 
  onLanguageChange, 
  onSave, 
  isSaving,
  savedProjects,
  onLoadProject,
  onDeleteProject,
  hasActiveProject
}) => {
  const t = TRANSLATIONS[language];
  const [showProjects, setShowProjects] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Visionary <span className="text-indigo-400">AI</span></h1>
        </div>
        
        <nav className="flex items-center gap-2 md:gap-6">
          <div className="relative">
            <button 
              onClick={() => setShowProjects(!showProjects)}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 12h14M5 16h14" />
              </svg>
              {t.navProjects}
            </button>
            
            {showProjects && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-96 overflow-y-auto">
                  {savedProjects.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      {t.noSavedProjects}
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {savedProjects.map(project => (
                        <div key={project.id} className="group flex items-center gap-2 p-3 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0" onClick={() => { onLoadProject(project); setShowProjects(false); }}>
                            <div className="text-sm font-bold text-slate-200 truncate">{project.script.title}</div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              {t.lastEdited}: {new Date(project.timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                            className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {hasActiveProject && onSave && (
            <button 
              onClick={onSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isSaving ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-600/30'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              {isSaving ? t.btnSaved : t.btnSave}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4 ml-4">
           <div className="hidden xs:flex bg-slate-800 p-1 rounded-lg border border-slate-700">
             <button 
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               EN
             </button>
             <button 
              onClick={() => onLanguageChange('zh')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'zh' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
               中文
             </button>
           </div>
           <div className="hidden lg:block text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-400">{t.proPlan}</div>
           <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 shadow-inner"></div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};
