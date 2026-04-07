import React from 'react';
import { ShieldAlert, Zap, Cpu } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface EntryAdModalProps {
    onComplete: () => void;
    isOpen: boolean;
}

export const EntryAdModal: React.FC<EntryAdModalProps> = ({ onComplete, isOpen }) => {
    const [canProceed, setCanProceed] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setCanProceed(true), 2500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-md" />

            <div className="relative w-full max-w-xl bg-surface-container border-2 border-kinetik-lime p-8 shadow-[0_0_80px_rgba(204,255,0,0.1)] overflow-hidden">
                <div className="scanline-overlay absolute inset-0 opacity-10 pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                    <div className="flex justify-center mb-4">
                        <div className="p-4 bg-kinetik-lime/10 border border-kinetik-lime/30 rounded-full">
                            <Cpu className="w-10 h-10 text-kinetik-lime animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-kinetik-lime uppercase tracking-tighter mb-2 font-headline italic">
                        Uplink_Authorization
                    </h2>
                    <p className="text-on-surface-variant font-mono text-[10px] tracking-[0.4em] uppercase">
                        Establishing secure handshake...
                    </p>
                </div>

                {/* THE AD - ENTRY FEE */}
                <div className="min-h-[280px] bg-surface-container-lowest border border-outline-variant/30 mb-8 flex flex-col justify-center relative z-10">
                    <div className="absolute top-0 left-0 w-full bg-surface-container-high px-2 py-1 border-b border-outline-variant/20">
                        <span className="text-[8px] text-on-surface-variant font-black uppercase tracking-widest">Sponsor_Validation_Required</span>
                    </div>
                    <AdBanner key="entry-ad" refreshInterval={0} />
                </div>

                <button
                    onClick={onComplete}
                    disabled={!canProceed}
                    className={`relative z-10 w-full py-5 text-center font-headline font-black text-lg uppercase tracking-[0.3em] transition-all border-2 
            ${canProceed
                            ? 'bg-kinetik-lime text-surface-container-lowest border-kinetik-lime hover:scale-[1.01] glow-primary cursor-pointer'
                            : 'bg-surface-bright/20 text-on-surface-variant/30 border-outline-variant/20 cursor-not-allowed'}`}
                >
                    {canProceed ? 'GRANT_ACCESS' : 'INITIALIZING_UPLINK...'}
                </button>
            </div>
        </div>
    );
};
