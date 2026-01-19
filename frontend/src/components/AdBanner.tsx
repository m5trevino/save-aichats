import React from 'react';

export const AdBanner: React.FC = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center my-6 z-10 relative">
      <div className="bg-slate-900/50 border border-sky-900/30 p-2 rounded-lg backdrop-blur-md shadow-lg max-w-full overflow-hidden">
        <p className="text-[9px] text-sky-700 text-center mb-1 uppercase tracking-[0.2em] font-mono">
          System Sponsor
        </p>
        
        {/* A-ADS IFRAME - ADAPTIVE */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <iframe 
            data-aa='2424680' 
            src='//acceptable.a-ads.com/2424680/?size=Adaptive' 
            style={{
              border: 'none', 
              padding: 0, 
              width: '100%', 
              minWidth: '300px', // Minimum width for mobile
              maxWidth: '728px', // Leaderboard max width
              height: '90px',    // Standard height
              overflow: 'hidden',
              display: 'block'
            }}
            title="Sponsor"
          />
        </div>
      </div>
    </div>
  );
};
