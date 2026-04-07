import React, { useCallback, useState, useRef } from 'react';
import { EntryAdModal } from './EntryAdModal';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  onClear: () => void;
  isProcessing: boolean;
  hasFiles: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, onClear, isProcessing, hasFiles }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showEntryAd, setShowEntryAd] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setPendingFiles(fileArray);
    setShowEntryAd(true); // TRIGGER THE TRAP
  }, []);

  const completeUpload = () => {
    setShowEntryAd(false);
    onFilesSelect(pendingFiles);
    setPendingFiles([]);
  };

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <>
      <EntryAdModal isOpen={showEntryAd} onComplete={completeUpload} />

      <div className="w-full max-w-4xl mx-auto mb-8">
        {!hasFiles ? (
          <label
            htmlFor="dropzone-file"
            className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
              ${dragActive ? 'border-sky-400 bg-slate-800 shadow-2xl shadow-sky-900/20' : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600'}`}
          >
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="absolute top-0 left-0 w-full h-full"></div>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none text-center px-4">
              <div className={`p-4 rounded-full mb-4 bg-slate-900/50 border border-slate-700 transition-transform ${dragActive ? 'scale-110' : ''}`}>
                <svg className="w-10 h-10 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="mb-2 text-lg text-slate-300 font-bold tracking-tight">
                {dragActive ? 'Release to Start Extraction' : 'Injest Chat Logs'}
              </p>
              <p className="text-sm text-slate-500 font-medium">Drag & Drop or click to browse (supports multi-selection)</p>
              <p className="mt-4 text-[10px] text-slate-600 font-mono uppercase tracking-[0.3em]">Scalable Batch Processing v2.0</p>
            </div>
            <input ref={inputRef} id="dropzone-file" type="file" multiple className="hidden" onChange={handleChange} />
          </label>
        ) : (
          <div className="flex items-center justify-between p-5 bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700 shadow-xl">
            <div className='flex items-center space-x-4'>
              <div className="w-10 h-10 bg-sky-900/30 rounded-lg flex items-center justify-center border border-sky-500/30">
                <svg className='w-6 h-6 text-sky-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
              </div>
              <div>
                <p className="font-bold text-slate-200">Processing Engine Active</p>
                <p className="text-xs text-slate-500 font-mono">Status: {isProcessing ? 'Extracting Data...' : 'Idle / Complete'}</p>
              </div>
            </div>
            <button
              onClick={onClear}
              className="px-6 py-2 text-sm font-bold text-white bg-red-600/90 hover:bg-red-600 rounded-xl transition-all shadow-lg shadow-red-900/40"
            >
              RESET CONSOLE
            </button>
          </div>
        )}
      </div>
    </>
  );
};
