"use client";

import React, { useEffect, useState } from 'react';
import { XCircle, Download, CheckCircle2, FileText } from 'lucide-react';
import Script from 'next/script';

interface ChatItem {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed';
}

interface ProcessingGateModalProps {
  isOpen: boolean;
  chatNames: string[];
  onAbort: () => void;
  onComplete?: () => void;
  onDownload?: () => void;
}

const getChatProcessingTime = (index: number): number => {
  if (index === 0) return 60;
  if (index <= 4) return 30;
  return 8;
};

export const ProcessingGateModal: React.FC<ProcessingGateModalProps> = ({
  isOpen,
  chatNames,
  onAbort,
  onComplete,
  onDownload,
}) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [currentChatIndex, setCurrentChatIndex] = useState(0);
  const [currentChatProgress, setCurrentChatProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [showConfirmAbort, setShowConfirmAbort] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const totalChats = chatNames.length;
  
  const totalProcessingTime = (() => {
    let total = 0;
    for (let i = 0; i < totalChats; i++) {
      total += getChatProcessingTime(i);
    }
    return total;
  })();

  useEffect(() => {
    if (!isOpen) return;
    
    const initialChats: ChatItem[] = chatNames.map((name, idx) => ({
      id: idx,
      name: name || 'Chat_' + String(idx + 1).padStart(2, '0'),
      status: idx === 0 ? 'processing' : 'pending',
    }));
    
    setChats(initialChats);
    setCurrentChatIndex(0);
    setCurrentChatProgress(0);
    setOverallProgress(0);
    setIsDone(false);
    setTimeRemaining(totalProcessingTime);
  }, [isOpen, chatNames, totalProcessingTime]);

  useEffect(() => {
    if (!isOpen || isDone) return;

    let elapsedTime = 0;
    let currentIdx = 0;
    let chatStartTime = 0;
    
    const interval = setInterval(() => {
      elapsedTime += 0.1;
      
      let timeAccumulator = 0;
      let newIdx = 0;
      
      for (let i = 0; i < totalChats; i++) {
        const chatTime = getChatProcessingTime(i);
        if (elapsedTime >= timeAccumulator + chatTime) {
          timeAccumulator += chatTime;
          newIdx = i + 1;
        } else {
          break;
        }
      }
      
      if (newIdx !== currentIdx) {
        setChats(prev => prev.map((chat, idx) => {
          if (idx < newIdx) return { ...chat, status: 'completed' };
          if (idx === newIdx) return { ...chat, status: 'processing' };
          return { ...chat, status: 'pending' };
        }));
        currentIdx = newIdx;
        setCurrentChatIndex(newIdx);
        chatStartTime = timeAccumulator;
      }
      
      if (currentIdx < totalChats) {
        const currentChatTime = getChatProcessingTime(currentIdx);
        const timeInCurrentChat = elapsedTime - chatStartTime;
        const progress = Math.min(100, (timeInCurrentChat / currentChatTime) * 100);
        setCurrentChatProgress(progress);
      }
      
      const overall = Math.min(100, (elapsedTime / totalProcessingTime) * 100);
      setOverallProgress(overall);
      setTimeRemaining(Math.max(0, Math.ceil(totalProcessingTime - elapsedTime)));
      
      if (elapsedTime >= totalProcessingTime) {
        setIsDone(true);
        setChats(prev => prev.map(chat => ({ ...chat, status: 'completed' })));
        onComplete?.();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isDone, totalChats, totalProcessingTime, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  };

  const handleAbortClick = () => {
    if (!showConfirmAbort) {
      setShowConfirmAbort(true);
      setTimeout(() => setShowConfirmAbort(false), 3000);
    } else {
      onAbort();
    }
  };

  if (!isOpen) return null;

  const completedCount = chats.filter(c => c.status === 'completed').length;
  const pendingCount = chats.filter(c => c.status === 'pending').length;
  const currentChat = chats[currentChatIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border-2 border-[#00FF41] shadow-[0_0_100px_rgba(0,255,65,0.15)] flex flex-col max-h-[95vh] overflow-hidden">
        
        <div className="relative z-20 flex justify-between items-start border-b-2 border-[#00FF41]/30 p-4 bg-gradient-to-b from-[#00FF41]/5 to-transparent">
          <div>
            <h2 className="text-xl font-black text-[#00FF41] uppercase tracking-tighter flex items-center gap-2">
              <span className="animate-pulse">⚡</span> 
              Refinery Assembly Line
            </h2>
            <p className="text-[#00FF41]/60 font-mono text-[10px] tracking-[0.3em] uppercase">
              [ BATCH_PROCESSING: {totalChats} CHATS_LOCKED ]
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{formatTime(timeRemaining)}</div>
            <div className="text-[8px] text-[#00FF41]/40 uppercase tracking-widest">Time Remaining</div>
          </div>
        </div>

        <div className="relative z-20 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
          
          <div className="lg:w-1/3 flex flex-col bg-black border border-[#00FF41]/20">
            <div className="p-2 bg-[#00FF41]/5 border-b border-[#00FF41]/20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">To Process</span>
                <span className="text-[10px] text-[#00FF41]/60 font-mono">{pendingCount} remaining</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[300px] p-2 space-y-1">
              {chats.filter(c => c.status === 'pending').map((chat) => (
                <div key={chat.id} className="flex items-center gap-2 p-2 bg-[#00FF41]/5 border border-[#00FF41]/10 opacity-50">
                  <FileText className="w-3 h-3 text-[#00FF41]/40" />
                  <span className="text-[10px] text-[#00FF41]/60 truncate font-mono">{chat.name}</span>
                </div>
              ))}
              {pendingCount === 0 && <div className="text-center py-4 text-[10px] text-[#00FF41]/30 uppercase">Queue Empty</div>}
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-black border border-[#00FF41]/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest">Processing Now</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{currentChatIndex + 1} / {totalChats}</span>
              </div>
              
              {currentChat && currentChat.status === 'processing' && (
                <>
                  <div className="text-xs text-white font-mono truncate mb-2">{currentChat.name}</div>
                  <div className="w-full h-2 bg-black border border-[#00FF41]/30 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#00FF41] transition-all duration-100" style={{ width: currentChatProgress + '%' }} />
                  </div>
                  <div className="text-[8px] text-[#00FF41]/40 mt-1 text-right font-mono">{Math.round(currentChatProgress)}%</div>
                </>
              )}
              
              {isDone && (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-8 h-8 text-[#00FF41] mx-auto mb-2" />
                  <span className="text-xs text-[#00FF41] uppercase">All Chats Processed</span>
                </div>
              )}
            </div>

            <div className="bg-black border border-[#00FF41]/30 p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest">Total Progress</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-black border border-[#00FF41]/30 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00FF41]/50 to-[#00FF41] transition-all duration-100" style={{ width: overallProgress + '%' }} />
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col bg-black border border-[#00FF41]/20">
            <div className="p-2 bg-[#00FF41]/10 border-b border-[#00FF41]/20">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">Completed</span>
                <span className="text-[10px] text-[#00FF41] font-mono">{completedCount} done</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[200px] lg:max-h-[300px] p-2 space-y-1">
              {chats.filter(c => c.status === 'completed').map((chat) => (
                <div key={chat.id} className="flex items-center gap-2 p-2 bg-[#00FF41]/10 border border-[#00FF41]/30">
                  <CheckCircle2 className="w-3 h-3 text-[#00FF41]" />
                  <span className="text-[10px] text-[#00FF41] truncate font-mono">{chat.name}</span>
                </div>
              ))}
              {completedCount === 0 && <div className="text-center py-4 text-[10px] text-[#00FF41]/30 uppercase">No completions yet</div>}
            </div>
          </div>
        </div>

        <div className="relative z-20 p-4 border-t border-[#00FF41]/20 bg-gradient-to-t from-black to-[#00FF41]/5">
          {isDone ? (
            <button onClick={onDownload} className="w-full py-4 bg-[#00FF41] text-black font-black text-lg uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#00FF41]/80 transition-all animate-pulse">
              <Download className="w-6 h-6" /> DOWNLOAD ALL CHATS
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] text-[#00FF41]/40 text-center uppercase tracking-widest">Closing this modal will terminate processing</p>
              <button onClick={handleAbortClick} className={`flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-2 ${showConfirmAbort ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'border-[#00FF41]/20 text-[#00FF41]/40 hover:border-red-500/50'}`}>
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
