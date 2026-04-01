import React, { useState, useEffect, useCallback } from 'react';

// --- MULTI-NETWORK AD PAYLOADS ---
const AD_UNITS = [
  // ExoClick Banner 1 (ID: 5874968)
  `<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script><ins class="eas6a97888e2" data-zoneid="5874968"></ins><script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>`,
  // ExoClick Banner 2 (ID: 5874962)
  `<script async type="application/javascript" src="https://a.magsrv.com/ad-provider.js"></script><ins class="eas6a97888e37" data-zoneid="5874962"></ins><script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>`,
  // ExoClick Banner 3 (ID: 5874950)
  `<script async type="application/javascript" src="https://a.pemsrv.com/ad-provider.js"></script><ins class="eas6a97888e35" data-zoneid="5874950"></ins><script>(AdProvider = window.AdProvider || []).push({"serve": {}});</script>`,
  // A-ADS (Updated with Kinetik Lime)
  `<iframe data-aa='2424680' src='//acceptable.a-ads.com/2424680/?size=Adaptive&background_color=0e0e0e&title_color=CCFF00&text_color=CCFF00&link_color=CCFF00' style='border:0;padding:0;width:100%;height:auto;min-height:90px;overflow:hidden;display:block;margin:auto' title="Sponsor"></iframe>`
];

interface AdBannerProps {
  refreshInterval?: number;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ refreshInterval = 0, className = "" }) => {
  const [adHtml, setAdHtml] = useState('');
  const [key, setKey] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(refreshInterval);

  const selectRandomAd = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * AD_UNITS.length);
    const selectedAd = AD_UNITS[randomIndex];
    setAdHtml(selectedAd);
  }, []);

  useEffect(() => {
    selectRandomAd(); 

    if (!refreshInterval) return;

    setTimeLeft(refreshInterval);
    
    const rotationInterval = setInterval(() => {
      setKey(prev => prev + 1); 
      selectRandomAd();
      setTimeLeft(refreshInterval); 
    }, refreshInterval * 1000);

    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(rotationInterval);
      clearInterval(countdownInterval);
    };
  }, [refreshInterval, selectRandomAd]);


  return (
    <div className={`w-full flex flex-col items-center justify-center z-10 relative group ${className}`}>
      <div className="bg-surface-container-lowest border-2 border-outline-variant p-1 rounded-none backdrop-blur-md max-w-full overflow-hidden w-full transition-all group-hover:border-kinetik-lime shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-outline-variant group-hover:border-kinetik-lime z-20 transition-colors" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-outline-variant group-hover:border-kinetik-lime z-20 transition-colors" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-outline-variant group-hover:border-kinetik-lime z-20 transition-colors" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-outline-variant group-hover:border-kinetik-lime z-20 transition-colors" />
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

        {/* Header with refresh countdown */}
        <div className="flex justify-between items-center mb-1 px-2 py-1 border-b border-outline-variant/20 bg-surface-container-high/50">
          <p className="text-[8px] text-on-surface-variant uppercase tracking-[0.3em] font-mono group-hover:text-kinetik-lime transition-colors font-black">
            System_Sponsor // UPLINK_{key}
          </p>
          {refreshInterval > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-kinetik-lime animate-pulse rounded-full shadow-[0_0_8px_#CCFF00]" />
              <p className="text-[8px] text-kinetik-lime font-mono tracking-widest font-black tabular-nums">
                CYC_{timeLeft.toString().padStart(2, '0')}
              </p>
            </div>
          )}
        </div>

        {/* The Ad Unit is injected here */}
        <div 
          key={key} 
          className="relative z-30 min-h-[90px] w-full flex items-center justify-center bg-black/20"
          dangerouslySetInnerHTML={{ __html: adHtml }} 
        />
        
        <div className="absolute inset-0 pointer-events-none z-20 bg-kinetik-lime/5 mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
    </div>
  );
};
