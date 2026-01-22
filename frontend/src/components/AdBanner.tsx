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
    <div className="w-full flex flex-col items-center justify-center my-6 z-10 relative">
      <div className="bg-void border border-matrix/40 p-2 rounded-none backdrop-blur-md max-w-full overflow-hidden w-full">
        <div className="flex justify-between items-center mb-1 px-1">
          <p className="text-[9px] text-matrix/40 uppercase tracking-[0.2em] font-mono">
            System Sponsor
          </p>
          {refreshInterval > 0 && (
            <p className="text-[8px] text-voltage/50 font-mono tracking-widest animate-pulse">
              ENCRYPTION_CYCLE: {timeLeft}s
            </p>
          )}
        </div>

        {/* A-ADS IFRAME - ADAPTIVE */}
        <div id={`frame-${key}`} key={key} style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
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
      </div>
    </div>
  );
};
