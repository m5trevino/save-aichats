import React, { useEffect, useState } from 'react';

interface AdBannerProps {
  placeholderId: number;
  sizes?: number[]; // Not typically needed for Ezoic placeholders but good for TS
  refreshInterval?: number;
  showSystemSponsor?: boolean;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  placeholderId,
  refreshInterval = 0,
  showSystemSponsor = true
}) => {
  const [timeLeft, setTimeLeft] = useState(refreshInterval);

  useEffect(() => {
    // EZOIC INIT & DISPLAY
    if (typeof window !== 'undefined') {
      const ez = window.ezstandalone;
      if (ez) {
        ez.cmd.push(() => {
          ez.showAds(placeholderId);
        });
      }
    }

    return () => {
      // EZOIC CLEANUP
      if (typeof window !== 'undefined') {
        const ez = window.ezstandalone;
        if (ez) {
          ez.cmd.push(() => {
            ez.destroyPlaceholders(placeholderId);
          });
        }
      }
    };
  }, [placeholderId]);

  // DYNAMIC REFRESH LOGIC
  useEffect(() => {
    if (!refreshInterval) return;

    setTimeLeft(refreshInterval);

    // Interval for the actual ad refresh
    const refreshTimer = setInterval(() => {
      if (typeof window !== 'undefined' && window.ezstandalone) {
        console.log(`[💰] EZOIC_REFRESH: ID_${placeholderId}`);
        window.ezstandalone.cmd.push(() => {
          window.ezstandalone.refreshAds(placeholderId);
        });
        setTimeLeft(refreshInterval);
      }
    }, refreshInterval * 1000);

    // Interval for the UI countdown
    const countdown = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(countdown);
    };
  }, [refreshInterval, placeholderId]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-6 z-10 relative group">
      <div className="bg-void border-2 border-matrix/40 p-1 rounded-none backdrop-blur-md max-w-full overflow-hidden w-full transition-all group-hover:border-[#00FF41] shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
        {/* TACTICAL CORNERS */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-matrix/40 z-20" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-matrix/40 z-20" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-matrix/40 z-20" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-matrix/40 z-20" />

        {/* SCANLINE EFFECT */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

        {showSystemSponsor && (
          <div className="flex justify-between items-center mb-1 px-2 py-1 border-b border-matrix/10 bg-matrix/5">
            <p className="text-[9px] text-matrix/60 uppercase tracking-[0.3em] font-mono group-hover:text-matrix transition-colors font-black">
              System_Sponsor // REVENUE_UPLINK_{placeholderId}
            </p>
            {refreshInterval > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#00FF41] animate-pulse rounded-full shadow-[0_0_8px_#00FF41]" />
                <p className="text-[9px] text-matrix font-mono tracking-widest font-black tabular-nums">
                  CYC_{timeLeft.toString().padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* EZOIC PLACEHOLDER */}
        <div
          id={`ezoic-pub-ad-placeholder-${placeholderId}`}
          className="flext items-center justify-center min-h-[90px] w-full bg-black/40 grayscale group-hover:grayscale-0 transition-all duration-700"
        />

        {/* INTERFERENCE OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-matrix/5 mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
    </div>
  );
};
