import React from 'react';
import { XCircle, Activity, Target } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { motion } from 'framer-motion';

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
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            {/* BACKDROP - Semi-transparent */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

            {/* MODAL */}
            <div className="relative w-full max-w-2xl bg-surface-container border-2 border-kinetik-lime p-8 shadow-[0_0_100px_rgba(204,255,0,0.15)] flex flex-col gap-8 overflow-hidden">
                <div className="scanline-overlay absolute inset-0 opacity-10 pointer-events-none"></div>

                {/* HEADER */}
                <div className="flex justify-between items-start border-b-2 border-surface-bright pb-6 relative z-10">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-kinetik-lime uppercase tracking-tighter flex items-center gap-3 font-headline italic">
                            <Activity className="w-7 h-7 animate-pulse" /> Uplink_Active
                        </h2>
                        <p className="text-on-surface-variant font-mono text-[10px] tracking-[0.4em] uppercase">
                            Secure_Refinement_Protocol // ACTIVE
                        </p>
                    </div>

                    {/* TACTICAL COUNTER */}
                    <div className="flex flex-col items-end">
                        <span className="text-4xl font-black text-on-surface tabular-nums tracking-tighter font-mono">
                            {String(currentFileIndex + 1).padStart(2, '0')}<span className="text-on-surface-variant/30 text-lg">/{totalFiles}</span>
                        </span>
                        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-[0.3em]">STREAM_INDEX</span>
                    </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full h-1 bg-surface-bright relative overflow-hidden z-10">
                    <motion.div 
                        className="absolute inset-y-0 left-0 bg-kinetik-lime shadow-[0_0_10px_#CCFF00]" 
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentFileIndex + 1) / totalFiles) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* CURRENT TARGET STATUS */}
                <div className="bg-surface-container-lowest p-4 border-l-4 border-kinetik-lime relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                        <Target className="w-3 h-3 text-kinetik-lime" />
                        <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Target_Payload</p>
                    </div>
                    <p className="text-sm font-mono text-on-surface truncate">{currentFileName}</p>
                </div>

                {/* THE AD - PROCESSING TAX */}
                <div className="min-h-[280px] bg-surface-container-lowest border border-outline-variant/30 flex flex-col justify-center relative overflow-hidden z-10">
                    <div className="absolute top-0 left-0 w-full bg-surface-container-high px-2 py-1 border-b border-outline-variant/20">
                        <span className="text-[8px] text-on-surface-variant font-black uppercase tracking-widest">Validating_Sponsor_Handshake</span>
                    </div>
                    <AdBanner key="processing-ad" refreshInterval={30} />
                </div>

                {/* ABORT BUTTON */}
                <button
                    onClick={onAbort}
                    className="self-center mt-2 text-[10px] font-black text-on-surface-variant/40 hover:text-error uppercase tracking-[0.4em] transition-all flex items-center gap-2 relative z-10"
                >
                    <XCircle className="w-4 h-4" />
                    Terminate_Sequence
                </button>
            </div>
        </div>
    );
};
