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
            <div className="absolute inset-0 bg-black/20" />

            {/* MODAL */}
            <div className="relative w-full max-w-2xl bg-void border-t-4 border-b-4 border-matrix p-8 shadow-[0_0_100px_rgba(0,255,65,0.1)] flex flex-col gap-8">

                {/* HEADER */}
                <div className="flex justify-between items-start border-b border-matrix/20 pb-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-matrix uppercase tracking-tighter flex items-center gap-3">
                            <span className="animate-pulse">⚡</span> Uplink Active
                        </h2>
                        <p className="text-matrix/60 font-mono text-[10px] tracking-widest uppercase">
                            Secure Data Refinement in Progress...
                        </p>
                    </div>

                    {/* TACTICAL COUNTER */}
                    <div className="flex flex-col items-end">
                        <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                            {String(currentFileIndex + 1).padStart(2, '0')}<span className="text-matrix/40 text-lg">/{totalFiles}</span>
                        </span>
                        <span className="text-[8px] font-bold text-matrix/40 uppercase tracking-[0.3em]">Payload Index</span>
                    </div>
                </div>

                {/* TACTICAL LINEAR PROGRESS */}
                <div className="w-full h-2 bg-black border border-matrix/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-matrix/20 animate-pulse" style={{ width: `${((currentFileIndex + 1) / totalFiles) * 100}%` }} />
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)] opacity-50" />
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
