import React from 'react';

export const AdBanner: React.FC = () => {
  // THE HUSTLE: Adsterra / PopAds / Monetag Integration
  React.useEffect(() => {
    // BOSSY_LOGIC: Paste your Vignette/Interstitial scripts here
    // Example: (window as any).popMetadata = { id: '...' };

    console.log("[💰] AD_ENGINE: INTERSTITIAL_PAYLOAD_READY");
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center my-6 z-10 relative">
      <div className="bg-void border border-matrix/40 p-2 rounded-none backdrop-blur-md max-w-full overflow-hidden">
        <p className="text-[9px] text-matrix/40 text-center mb-1 uppercase tracking-[0.2em] font-mono">
          System Sponsor
        </p>

        {/* A-ADS IFRAME - ADAPTIVE */}
        <div id="frame" style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 99998 }}>
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
