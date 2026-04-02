"use client";

import React, { useState } from 'react';
import { XCircle, Download, CheckCircle2, FileText, Terminal, Activity } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { motion } from 'framer-motion';

interface ProcessingGateModalProps {
  isOpen: boolean;
  chatNames: string[];
  batchProgress: ('IDLE' | 'PROCESSING' | 'COMPLETE')[];
  overallProgress: number;
  isProcessing: boolean;
  onAbort: () => void;
  onDownload?: () => void;
}

export const ProcessingGateModal: React.FC<ProcessingGateModalProps> = ({
  isOpen,
  chatNames,
  batchProgress,
  overallProgress,
  isProcessing,
  onAbort,
  onDownload,
}) => {
  const [showConfirmAbort, setShowConfirmAbort] = useState(false);

  if (!isOpen) return null;

  const currentIndex = batchProgress.findIndex(p => p === 'PROCESSING');
  const completedCount = batchProgress.filter(p => p === 'COMPLETE').length;
  const pendingCount = batchProgress.filter(p => p === 'IDLE').length;
  const isDone = !isProcessing && completedCount > 0 && pendingCount === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />
      <div className="relative w-full max-w-5xl bg-surface-container border-2 border-kinetik-lime shadow-[0_0_100px_rgba(204,255,0,0.15)] flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="relative z-20 flex justify-between items-center border-b-2 border-surface-bright p-6 bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-black text-kinetik-lime uppercase tracking-tighter flex items-center gap-3 font-headline italic">
              <Activity className="w-6 h-6 animate-pulse" />
              Extraction_Pipeline
            </h2>
            <p className="text-on-surface-variant font-mono text-[10px] tracking-[0.3em] uppercase mt-1">
              [ BATCH_TARGETS: {chatNames.length} // SESSION_AUTH: ADMIN ]
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-kinetik-lime tabular-nums tracking-tighter font-mono">{Math.round(overallProgress)}%</div>
            <div className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">COMPLETION_INDEX</div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-20 flex flex-col lg:flex-row gap-6 p-6 overflow-hidden bg-surface">
          
          {/* LEFT: QUEUE */}
          <div className="lg:w-1/4 flex flex-col bg-surface-container-lowest border border-outline-variant">
            <div className="p-3 bg-surface-container-high border-b border-outline-variant">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-on-surface uppercase tracking-widest font-black">In_Queue</span>
                <span className="text-[10px] text-kinetik-lime font-mono">[{pendingCount}]</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[400px] p-2 space-y-1 scrollbar-hide">
              {chatNames.map((name, idx) => (
                batchProgress[idx] === 'IDLE' && (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-surface-container-low border border-outline-variant/30 opacity-40">
                    <Terminal className="w-3 h-3 text-on-surface-variant" />
                    <span className="text-[10px] text-on-surface-variant truncate font-mono">{name || `TARGET_${String(idx+1).padStart(2,'0')}`}</span>
                  </div>
                )
              ))}
              {pendingCount === 0 && <div className="text-center py-8 text-[10px] text-on-surface-variant/20 uppercase font-black tracking-widest">Queue_Purged</div>}
            </div>
          </div>

          {/* CENTER: ACTIVE PROCESSING & AD */}
          <div className="lg:w-2/4 flex flex-col gap-6">
            {/* Current Target */}
            <div className="bg-surface-container-lowest border-l-4 border-kinetik-lime p-6 relative overflow-hidden">
              <div className="scanline-overlay absolute inset-0 opacity-10"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Current_Payload</span>
                <span className="text-[10px] text-kinetik-lime font-mono">STEP: {currentIndex >= 0 ? currentIndex + 1 : completedCount} / {chatNames.length}</span>
              </div>
              
              {currentIndex >= 0 ? (
                <div className="relative z-10">
                  <div className="text-sm text-on-surface font-mono truncate mb-4 p-3 bg-surface-container-low border border-outline-variant/30">
                    {chatNames[currentIndex] || `TARGET_DATA_STREAM_${currentIndex + 1}`}
                  </div>
                  <div className="w-full h-1 bg-surface-bright relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-kinetik-lime shadow-[0_0_10px_#CCFF00]" 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              ) : isDone ? (
                <div className="text-center py-4 relative z-10">
                  <CheckCircle2 className="w-12 h-12 text-kinetik-lime mx-auto mb-3 glow-primary" />
                  <span className="text-sm text-kinetik-lime uppercase font-black tracking-[0.2em]">Extraction_Protocol_Complete</span>
                </div>
              ) : (
                <div className="text-center py-4 relative z-10">
                  <span className="text-xs text-on-surface-variant uppercase font-bold animate-pulse tracking-widest">Awaiting_Uplink...</span>
                </div>
              )}
            </div>

            {/* THE SPONSOR TERMINAL */}
            <div className="relative flex-1 min-h-[280px] bg-surface-container-lowest border border-outline-variant flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full bg-surface-container-high px-3 py-1.5 border-b border-outline-variant flex justify-between items-center">
                <span className="text-[9px] text-on-surface-variant font-black tracking-[0.3em] uppercase">Sponsor_Stream_v2.4</span>
                <div className="w-1.5 h-1.5 bg-kinetik-lime rounded-full animate-pulse"></div>
              </div>
              <div className="w-full flex items-center justify-center p-4">
                <div className="scale-90 md:scale-110">
                  <AdBanner refreshInterval={20} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: REFINED ASSETS */}
          <div className="lg:w-1/4 flex flex-col bg-surface-container-lowest border border-outline-variant">
            <div className="p-3 bg-surface-container-high border-b border-outline-variant">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-on-surface uppercase tracking-widest font-black">Refined</span>
                <span className="text-[10px] text-kinetik-lime font-mono">[{completedCount}]</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[400px] p-2 space-y-1 scrollbar-hide">
              {chatNames.map((name, idx) => (
                batchProgress[idx] === 'COMPLETE' && (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-kinetik-lime/5 border border-kinetik-lime/20">
                    <CheckCircle2 className="w-3 h-3 text-kinetik-lime" />
                    <span className="text-[10px] text-kinetik-lime truncate font-mono font-bold">{name || `ASSET_${String(idx+1).padStart(2,'0')}`}</span>
                  </div>
                )
              ))}
              {completedCount === 0 && <div className="text-center py-8 text-[10px] text-on-surface-variant/20 uppercase font-black tracking-widest">No_Assets_Yet</div>}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="relative z-20 p-6 border-t border-surface-bright bg-surface-container-low">
          {isDone ? (
            <button 
              onClick={onDownload} 
              className="w-full py-5 bg-kinetik-lime text-surface-container-lowest font-headline font-black text-xl uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-[1.01] transition-all glow-primary"
            >
              <Download className="w-7 h-7" /> COLLECT_PAYLOAD
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-[10px] text-on-surface-variant text-center uppercase tracking-[0.2em] font-bold">WARNING: Manual termination will cause data fragmentation</p>
              <button 
                onClick={() => { if (!showConfirmAbort) { setShowConfirmAbort(true); setTimeout(() => setShowConfirmAbort(false), 3000); } else { onAbort(); } }} 
                className={`flex items-center gap-3 px-10 py-3 text-xs font-black uppercase tracking-[0.3em] transition-all border-2 ${showConfirmAbort ? 'bg-error-container border-error text-error animate-pulse' : 'border-outline-variant text-on-surface-variant hover:border-error hover:text-error'}`}
              >
                <XCircle className="w-4 h-4" />
                {showConfirmAbort ? 'CONFIRM_TERMINATION' : 'Abort_Sequence'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingGateModal;
