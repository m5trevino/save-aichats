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
      <div className="bg-void border border-matrix/40 p-1 rounded-none backdrop-blur-md max-w-full overflow-hidden w-full transition-all group-hover:border-[#00FF41]">
        {showSystemSponsor && (
          <div className="flex justify-between items-center mb-1 px-1 border-b border-matrix/10 pb-1">
            <p className="text-[9px] text-matrix/40 uppercase tracking-[0.2em] font-mono group-hover:text-matrix/80 transition-colors">
              System Sponsor :: ID_{placeholderId}
            </p>
            {refreshInterval > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-voltage animate-pulse rounded-full" />
                <p className="text-[8px] text-voltage/50 font-mono tracking-widest">
                  CYC_{timeLeft.toString().padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* EZOIC PLACEHOLDER */}
        <div
          id={`ezoic-pub-ad-placeholder-${placeholderId}`}
          className="flext items-center justify-center min-h-[90px] w-full bg-black/20"
        />
      </div>
    </div>
  );
};
