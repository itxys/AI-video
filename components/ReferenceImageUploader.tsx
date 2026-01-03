
import React, { useCallback, useRef, useState } from 'react';
import { Language, TRANSLATIONS } from '../types';

interface ReferenceImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  language: Language;
}

export const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({ images, onImagesChange, language }) => {
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages = [...images];
    const remainingSlots = 3 - newImages.length;
    if (remainingSlots <= 0) return;
    
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          onImagesChange([...newImages, result]);
          newImages.push(result);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images, onImagesChange]);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    handleFiles(e.clipboardData.files);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onPaste={onPaste}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 rounded-3xl p-8 transition-all duration-300 cursor-pointer text-center overflow-hidden
          ${isDragging 
            ? 'border-indigo-500 border-solid bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20' 
            : 'border-slate-800 border-dashed bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/50'
          }`}
      >
        {/* Animated border "marching ants" effect when dragging */}
        {isDragging && (
          <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute inset-0 border-4 border-indigo-400 border-dashed animate-[spin_20s_linear_infinite]" style={{ margin: '-10px', borderRadius: '40px' }} />
          </div>
        )}

        {/* Pulse Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none z-0" />
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        <div className="relative z-10 flex flex-col items-center gap-4 py-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            isDragging 
              ? 'bg-indigo-600 text-white rotate-6 scale-110 shadow-lg shadow-indigo-500/40' 
              : 'bg-slate-900 text-slate-500 group-hover:text-indigo-400 group-hover:rotate-3'
          }`}>
            {isDragging ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="space-y-1">
            <p className={`text-base font-bold transition-all duration-300 ${isDragging ? 'text-indigo-300 scale-105' : 'text-slate-200'}`}>
              {isDragging ? (language === 'zh' ? '松开以上传图片' : 'Drop images to upload') : t.labelReferences}
            </p>
            <p className={`text-xs transition-colors duration-300 ${isDragging ? 'text-indigo-400/80' : 'text-slate-500'}`}>
              {isDragging ? (language === 'zh' ? '支持 JPG, PNG 和 WebP' : 'Supports JPG, PNG and WebP') : t.refHint}
            </p>
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div key={idx} className="group/thumb relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 animate-in zoom-in-95 fade-in duration-300 shadow-lg">
              <img 
                src={img} 
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/thumb:scale-115 group-hover/thumb:rotate-1" 
                alt={`Ref ${idx}`} 
              />
              <div className="absolute inset-0 bg-indigo-900/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none" />
              <button 
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-600 rounded-full text-white transition-all flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/thumb:opacity-100 translate-y-2 group-hover/thumb:translate-y-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
