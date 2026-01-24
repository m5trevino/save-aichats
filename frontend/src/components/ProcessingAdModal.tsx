import React from 'react';
import { XCircle } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface ProcessingAdModalProps {
    isOpen: boolean;
    currentFileIndex: number;
    totalFiles: number;
    currentFileName: string;
    onAbort: () => void;
}

export const ProcessingAdModal: React.FC<ProcessingAdModalProps> = ({
    isOpen,
    currentFileIndex,
    totalFiles,
    currentFileName,
    onAbort
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            {/* BACKDROP - Semi-transparent so they can see the Ghost Terminal working behind */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            {/* MODAL */}
            <div className="relative w-full max-w-2xl bg-void border-t-4 border-b-4 border-matrix p-8 shadow-[0_0_100px_rgba(0,255,65,0.1)] flex flex-col gap-8">

                {/* HEADER */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Refining Data
                        </h2>
                        <p className="text-matrix font-bold font-mono text-sm tracking-widest uppercase animate-pulse">
                            Processing Active... Do Not Close
                        </p>
                    </div>

                    {/* CIRCULAR SPINNER + COUNTER */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a1a" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#00FF41" strokeWidth="8" strokeDasharray="283" strokeDashoffset="100" strokeLinecap="round" className="opacity-50" />
                        </svg>
                        <div className="text-xs font-black text-white">
                            {currentFileIndex + 1}/{totalFiles}
                        </div>
                    </div>
                </div>

                {/* CURRENT FILE STATUS */}
                <div className="bg-matrix/10 p-3 border-l-2 border-matrix">
                    <p className="text-[10px] text-matrix/60 uppercase tracking-widest mb-1">Target_File</p>
                    <p className="text-sm font-mono text-white truncate">{currentFileName}</p>
                </div>

                {/* THE AD - PROCESSING TAX */}
                <div className="min-h-[250px] bg-black border border-matrix/30 flex flex-col justify-center relative overflow-hidden">
                    {/* Scanline overlay for the ad container */}
                    <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px]" />
                    <AdBanner key="processing-ad" refreshInterval={30} />
                </div>

                {/* ABORT BUTTON */}
                <button
                    onClick={onAbort}
                    className="self-center mt-4 text-xs font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                    <XCircle className="w-4 h-4" />
                    Abort Sequence
                </button>
            </div>
        </div>
    );
};
