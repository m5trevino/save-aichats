"use client";

import React, { useState } from 'react';
import { XCircle, Download, CheckCircle2, FileText } from 'lucide-react';
import { AdBanner } from './AdBanner';

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

  // Find current processing chat
  const currentIndex = batchProgress.findIndex(p => p === 'PROCESSING');
  const completedCount = batchProgress.filter(p => p === 'COMPLETE').length;
  const pendingCount = batchProgress.filter(p => p === 'IDLE').length;
  const isDone = !isProcessing && completedCount > 0 && pendingCount === 0;

  // Calculate time remaining (estimate)
  const remainingChats = batchProgress.filter(p => p !== 'COMPLETE').length;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border-2 border-[#00FF41] shadow-[0_0_100px_rgba(0,255,65,0.15)] flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="relative z-20 flex justify-between items-start border-b-2 border-[#00FF41]/30 p-4 bg-gradient-to-b from-[#00FF41]/5 to-transparent">
          <div>
            <h2 className="text-xl font-black text-[#00FF41] uppercase tracking-tighter flex items-center gap-2">
              <span className="animate-pulse">⚡</span> 
              Refinery Assembly Line
            </h2>
            <p className="text-[#00FF41]/60 font-mono text-[10px] tracking-[0.3em] uppercase">
              [ BATCH_PROCESSING: {chatNames.length} CHATS_LOCKED ]
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{Math.round(overallProgress)}%</div>
            <div className="text-[8px] text-[#00FF41]/40 uppercase tracking-widest">Complete</div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-20 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
          
          {/* LEFT: TODO LIST */}
          <div className="lg:w-1/3 flex flex-col bg-black border border-[#00FF41]/20">
            <div className="p-2 bg-[#00FF41]/5 border-b border-[#00FF41]/20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">To Process</span>
                <span className="text-[10px] text-[#00FF41]/60 font-mono">{pendingCount} remaining</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[300px] p-2 space-y-1">
              {chatNames.map((name, idx) => (
                batchProgress[idx] === 'IDLE' && (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#00FF41]/5 border border-[#00FF41]/10 opacity-50">
                    <FileText className="w-3 h-3 text-[#00FF41]/40" />
                    <span className="text-[10px] text-[#00FF41]/60 truncate font-mono">{name || 'Chat_' + String(idx+1).padStart(2,'0')}</span>
                  </div>
                )
              ))}
              {pendingCount === 0 && <div className="text-center py-4 text-[10px] text-[#00FF41]/30 uppercase">Queue Empty</div>}
            </div>
          </div>

          {/* CENTER: PROGRESS & AD */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            {/* Current Chat */}
            <div className="bg-black border border-[#00FF41]/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest">Processing Now</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{currentIndex >= 0 ? currentIndex + 1 : completedCount} / {chatNames.length}</span>
              </div>
              
              {currentIndex >= 0 && (
                <>
                  <div className="text-xs text-white font-mono truncate mb-2">{chatNames[currentIndex] || 'Chat_' + String(currentIndex+1).padStart(2,'0')}</div>
                  <div className="w-full h-2 bg-black border border-[#00FF41]/30 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#00FF41] animate-pulse" style={{ width: '60%' }} />
                  </div>
                </>
              )}
              
              {isDone && (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-8 h-8 text-[#00FF41] mx-auto mb-2" />
                  <span className="text-xs text-[#00FF41] uppercase">All Chats Processed</span>
                </div>
              )}
            </div>

            {/* Overall Progress */}
            <div className="bg-black border border-[#00FF41]/30 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest">Total Progress</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-black border border-[#00FF41]/30 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00FF41]/50 to-[#00FF41] transition-all duration-300" style={{ width: overallProgress + '%' }} />
              </div>
            </div>

            {/* Ad Space - THE REVENUE ZONE */}
            <div className="relative min-h-[250px] bg-black border border-[#00FF41]/30 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute top-0 left-0 w-full bg-[#00FF41]/10 px-2 py-0.5 border-b border-[#00FF41]/20">
                <span className="text-[8px] text-[#00FF41]/60 font-black tracking-[0.3em] uppercase">Secure_Sponsor_Uplink</span>
              </div>
              <div className="w-full scale-90 md:scale-100">
                <AdBanner refreshInterval={15} />
              </div>
            </div>
          </div>

          {/* RIGHT: COMPLETED */}
          <div className="lg:w-1/3 flex flex-col bg-black border border-[#00FF41]/20">
            <div className="p-2 bg-[#00FF41]/10 border-b border-[#00FF41]/20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">Completed</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{completedCount} done</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[300px] p-2 space-y-1">
              {chatNames.map((name, idx) => (
                batchProgress[idx] === 'COMPLETE' && (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-[#00FF41]/10 border border-[#00FF41]/30">
                    <CheckCircle2 className="w-3 h-3 text-[#00FF41]" />
                    <span className="text-[10px] text-[#00FF41] truncate font-mono">{name || 'Chat_' + String(idx+1).padStart(2,'0')}</span>
                  </div>
                )
              ))}
              {completedCount === 0 && <div className="text-center py-4 text-[10px] text-[#00FF41]/30 uppercase">No completions yet</div>}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="relative z-20 p-4 border-t border-[#00FF41]/20 bg-gradient-to-t from-black to-[#00FF41]/5">
          {isDone ? (
            <button onClick={onDownload} className="w-full py-4 bg-[#00FF41] text-black font-black text-lg uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#00FF41]/80 transition-all animate-pulse">
              <Download className="w-6 h-6" /> DOWNLOAD ALL CHATS
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] text-[#00FF41]/40 text-center uppercase tracking-widest">Closing this modal will terminate processing</p>
              <button onClick={() => { if (!showConfirmAbort) { setShowConfirmAbort(true); setTimeout(() => setShowConfirmAbort(false), 3000); } else { onAbort(); } }} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-2 ${showConfirmAbort ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'border-[#00FF41]/20 text-[#00FF41]/40 hover:border-red-500/50'}`}>
                <XCircle className="w-4 h-4" />
                {showConfirmAbort ? 'CLICK AGAIN TO CONFIRM' : 'Abort'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingGateModal;
