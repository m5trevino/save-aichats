"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { XCircle, Shield, Clock, Eye, Lock } from 'lucide-react';
import Script from 'next/script';

interface ProcessingGateModalProps {
  isOpen: boolean;
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  processingTimeRemaining: number; // in seconds
  onAbort: () => void;
  onComplete?: () => void;
}

// Multi-Network Ad Rotator - cycles through Monetag + Adsterra + ExoClick for maximum fill
const AD_NETWORKS = [
  // Monetag Banner Script
  { 
    id: 'monetag-10498614', 
    zone: '10498614', 
    src: 'https://nap5k.com/tag.min.js', 
    type: 'script',
    network: 'Monetag'
  },
  // Adsterra Direct Link (higher CPM for some geos)
  { 
    id: 'adsterra-direct', 
    src: 'https://www.effectivegatecpm.com/hxdn4yhu7?key=53269311ad498a3a6bdf8959b9254348', 
    type: 'iframe',
    network: 'Adsterra'
  },
  // ExoClick Zone
  { 
    id: 'exoclick-zone', 
    zone: 'd8d3b362ab851d5c6a9039018822b225',
    src: 'https://a.exoclick.com/tag.php?zoneid=d8d3b362ab851d5c6a9039018822b225', 
    type: 'iframe',
    network: 'ExoClick'
  },
  // Monetag Direct Zones
  { 
    id: 'monetag-10498603', 
    zone: '10498603', 
    src: 'https://omg10.com/4/10498603', 
    type: 'iframe',
    network: 'Monetag'
  },
  { 
    id: 'monetag-10498618', 
    zone: '10498618', 
    src: 'https://omg10.com/4/10498618', 
    type: 'iframe',
    network: 'Monetag'
  },
];

export const ProcessingGateModal: React.FC<ProcessingGateModalProps> = ({
  isOpen,
  currentFileIndex,
  totalFiles,
  currentFileName,
  processingTimeRemaining,
  onAbort,
  onComplete,
}) => {
  const [adRefreshKey, setAdRefreshKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(processingTimeRemaining);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [showConfirmAbort, setShowConfirmAbort] = useState(false);
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [privacyMessageIndex, setPrivacyMessageIndex] = useState(0);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Privacy tax messages that rotate
  const privacyMessages = [
    { icon: Lock, text: "WE DON'T SELL YOUR DATA. WE SELL THIS AD SPACE." },
    { icon: Eye, text: "YOUR PRIVACY IS FUNDED BY THIS WAIT. NO LOGS. NO TRACKING." },
    { icon: Shield, text: "100% STATELESS PROCESSING. ADS KEEP US ZERO-KNOWLEDGE." },
    { icon: Clock, text: "THE COST OF PRIVACY IS PATIENCE. NOT YOUR DATA." },
  ];

  // Check for ad blocker
  useEffect(() => {
    if (!isOpen) return;
    
    const checkAdBlock = async () => {
      try {
        // Try to fetch a known ad script
        const testUrls = [
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
          'https://nap5k.com/tag.min.js',
        ];
        
        for (const url of testUrls) {
          try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            // If we get here, ad might not be blocked (but no-cors hides real status)
          } catch (e) {
            setAdBlockDetected(true);
            return;
          }
        }
        
        // Additional check: see if our ad container is hidden
        setTimeout(() => {
          if (adContainerRef.current) {
            const rect = adContainerRef.current.getBoundingClientRect();
            if (rect.height === 0 || rect.width === 0) {
              setAdBlockDetected(true);
            }
          }
        }, 2000);
      } catch (e) {
        console.log("Ad block check failed:", e);
      }
    };

    checkAdBlock();
  }, [isOpen, adRefreshKey]);

  // Auto-refresh ads every 30 seconds
  useEffect(() => {
    if (!isOpen) return;

    // Reset timer when opened
    setTimeLeft(processingTimeRemaining);
    setAdRefreshKey(0);
    setCurrentAdIndex(0);
    setAdBlockDetected(false);
    setShowConfirmAbort(false);

    // 30-second ad refresh cycle
    refreshIntervalRef.current = setInterval(() => {
      setAdRefreshKey(prev => prev + 1);
      setCurrentAdIndex(prev => (prev + 1) % AD_NETWORKS.length);
      const nextIndex = (currentAdIndex + 1) % AD_NETWORKS.length;
      console.log("[💰] AD_REFRESH: Loading", AD_NETWORKS[nextIndex].network, "-", AD_NETWORKS[nextIndex].id);
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isOpen, processingTimeRemaining]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, onComplete]);

  // Rotate privacy messages every 10 seconds
  useEffect(() => {
    if (!isOpen) return;

    const msgInterval = setInterval(() => {
      setPrivacyMessageIndex(prev => (prev + 1) % privacyMessages.length);
    }, 10000);

    return () => clearInterval(msgInterval);
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercent = Math.min(100, ((processingTimeRemaining - timeLeft) / processingTimeRemaining) * 100);

  // Handle abort with confirmation
  const handleAbortClick = () => {
    if (!showConfirmAbort) {
      setShowConfirmAbort(true);
      setTimeout(() => setShowConfirmAbort(false), 3000); // Reset after 3s
    } else {
      onAbort();
    }
  };

  if (!isOpen) return null;

  const CurrentMessage = privacyMessages[privacyMessageIndex].icon;
  const currentAd = AD_NETWORKS[currentAdIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop - darker to force focus */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border-2 border-[#00FF41] shadow-[0_0_100px_rgba(0,255,65,0.15)] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
        
        {/* HEADER */}
        <div className="relative z-20 flex justify-between items-start border-b-2 border-[#00FF41]/30 p-6 bg-gradient-to-b from-[#00FF41]/5 to-transparent">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#00FF41] uppercase tracking-tighter flex items-center gap-3">
              <span className="animate-pulse">⚡</span> 
              Refinery Strike Active
            </h2>
            <p className="text-[#00FF41]/60 font-mono text-[10px] tracking-[0.3em] uppercase">
              [ SYSTEM_LOCK: PROCESSING_PAYLOAD ]
            </p>
          </div>

          {/* Tactical Counter */}
          <div className="flex flex-col items-end">
            <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
              {String(currentFileIndex + 1).padStart(2, '0')}
              <span className="text-[#00FF41]/40 text-lg">/{totalFiles}</span>
            </span>
            <span className="text-[8px] font-bold text-[#00FF41]/40 uppercase tracking-[0.3em]">Payload Index</span>
          </div>
        </div>

        {/* PROGRESS SECTION */}
        <div className="relative z-20 p-6 space-y-4 border-b border-[#00FF41]/20">
          {/* Main Progress Bar */}
          <div className="w-full h-4 bg-black border border-[#00FF41]/30 relative overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-[#00FF41]/30 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#000_4px,#000_8px)] opacity-30" />
            {/* Animated pulse on progress */}
            <div 
              className="absolute inset-y-0 w-2 bg-[#00FF41] animate-pulse transition-all duration-1000"
              style={{ left: `${progressPercent}%`, transform: 'translateX(-100%)' }}
            />
          </div>

          {/* Time Display */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#00FF41] animate-pulse" />
              <span className="text-[#00FF41] font-mono text-sm tracking-widest">
                TIME_REMAINING: <span className="font-bold text-xl">{formatTime(timeLeft)}</span>
              </span>
            </div>
            <div className="text-[10px] text-[#00FF41]/40 font-mono">
              {Math.floor(progressPercent)}% COMPLETE
            </div>
          </div>

          {/* Current File */}
          <div className="bg-[#00FF41]/5 p-3 border-l-4 border-[#00FF41]">
            <p className="text-[10px] text-[#00FF41]/60 uppercase tracking-widest mb-1">Processing_Target</p>
            <p className="text-sm font-mono text-white truncate">{currentFileName || "ANALYZING_STREAM..."}</p>
          </div>
        </div>

        {/* AD SECTION - THE REVENUE ENGINE */}
        <div className="relative z-20 p-6 bg-black">
          {/* Privacy Tax Message */}
          <div className="flex items-center gap-3 mb-4 text-[10px] text-[#00FF41]/70 uppercase tracking-wider">
            <CurrentMessage className="w-4 h-4" />
            <span className="animate-pulse">{privacyMessages[privacyMessageIndex].text}</span>
          </div>

          {/* Ad Block Warning */}
          {adBlockDetected && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 text-red-400 text-[10px] font-mono uppercase tracking-wider animate-pulse">
              <span className="font-bold">⚠️ WARNING:</span> Ad blocker detected. Disable to support zero-log infrastructure.
            </div>
          )}

          {/* Ad Container - Refreshes every 30s */}
          <div 
            ref={adContainerRef}
            className="relative min-h-[250px] bg-[#050505] border-2 border-[#00FF41]/30 flex flex-col items-center justify-center overflow-hidden"
            key={`ad-${adRefreshKey}`}
          >
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px]" />
            
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00FF41] z-30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FF41] z-30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FF41] z-30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00FF41] z-30" />

            {/* Network Label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 text-[8px] text-[#00FF41]/40 uppercase tracking-[0.3em]">
              {currentAd.network} // {currentAd.id} // Refresh_{String(adRefreshKey).padStart(2, '0')}
            </div>

            {/* The Actual Ad */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {currentAd.type === 'script' ? (
                <Script
                  id={`ad-script-${currentAd.id}`}
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: `(function(s){s.dataset.zone='${currentAd.zone}',s.src='${currentAd.src}'})(document.body.appendChild(document.createElement('script')))`
                  }}
                />
              ) : (
                <iframe
                  src={currentAd.src}
                  width="300"
                  height="250"
                  style={{ border: 'none', maxWidth: '100%' }}
                  title="Sponsor"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              )}
            </div>

            {/* Refresh Timer Indicator */}
            <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse" />
              <span className="text-[8px] text-[#00FF41]/60 font-mono">
                Auto-refresh active
              </span>
            </div>
          </div>
        </div>

        {/* FOOTER / ABORT SECTION */}
        <div className="relative z-20 p-6 border-t border-[#00FF41]/20 bg-gradient-to-t from-black to-[#00FF41]/5">
          <div className="flex flex-col items-center gap-4">
            {/* Warning Text */}
            <p className="text-[10px] text-[#00FF41]/40 text-center uppercase tracking-widest max-w-md">
              Closing this modal will terminate the refinement process. 
              Your files will not be processed.
            </p>

            {/* Abort Button */}
            <button
              onClick={handleAbortClick}
              className={`group flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-2
                ${showConfirmAbort 
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                  : 'border-[#00FF41]/20 text-[#00FF41]/40 hover:border-red-500/50 hover:text-red-400/60'
                }`}
            >
              <XCircle className="w-4 h-4" />
              {showConfirmAbort ? 'CLICK AGAIN TO CONFIRM ABORT' : 'Abort Sequence'}
            </button>

            {showConfirmAbort && (
              <p className="text-[10px] text-red-400 animate-pulse">
                ⚠️ WARNING: All progress will be lost
              </p>
            )}
          </div>
        </div>

        {/* Background noise effect */}
        <div className="absolute inset-0 pointer-events-none z-[5] opacity-[0.02]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
};

export default ProcessingGateModal;
