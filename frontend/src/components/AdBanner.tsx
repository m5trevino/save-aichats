import React from 'react';

interface AdBannerProps {
  refreshInterval?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({ refreshInterval = 0 }) => {
  const [key, setKey] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(refreshInterval);

  React.useEffect(() => {
    if (!refreshInterval) return;

    setTimeLeft(refreshInterval);
    const interval = setInterval(() => {
      setKey(prev => prev + 1);
      setTimeLeft(refreshInterval);
      console.log("[💰] AD_ENGINE: CYCLE_COMPLETE -> REFRESHING_PAYLOAD");
    }, refreshInterval * 1000);

    const countdown = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdown);
    };
  }, [refreshInterval]);

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

        <div className="flex justify-between items-center mb-1 px-2 py-1 border-b border-matrix/10 bg-matrix/5">
          <p className="text-[9px] text-matrix/60 uppercase tracking-[0.3em] font-mono group-hover:text-matrix transition-colors font-black">
            System_Sponsor // REVENUE_UPLINK_{key}
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

        {/* A-ADS IFRAME - ADAPTIVE */}
        <div id={`frame-${key}`} key={key} style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 30 }}>
          <iframe
            data-aa='2424680'
            src='//acceptable.a-ads.com/2424680/?size=Adaptive&background_color=050505&title_color=00FF41&text_color=00FF41&link_color=FFD700'
            style={{
              border: 0,
              padding: 0,
              width: '100%',
              height: 'auto',
              minHeight: '90px',
              overflow: 'hidden',
              display: 'block',
              margin: 'auto'
            }}
            title="Sponsor"
          />
        </div>

        {/* INTERFERENCE OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-20 bg-matrix/5 mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
      </div>
    </div>
  );
};
