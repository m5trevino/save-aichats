import React from 'react';
import { ShieldAlert, Zap } from 'lucide-react';
import { AdBanner } from './AdBanner';

interface EntryAdModalProps {
    onComplete: () => void;
    isOpen: boolean;
}

export const EntryAdModal: React.FC<EntryAdModalProps> = ({ onComplete, isOpen }) => {
    const [canProceed, setCanProceed] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            // Small delay to prevent instant skipping
            const timer = setTimeout(() => setCanProceed(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP */}
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

            {/* MODAL */}
            <div className="relative w-full max-w-lg bg-void border-2 border-matrix p-6 shadow-[0_0_50px_rgba(0,255,65,0.2)]">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-matrix uppercase tracking-tighter mb-2 flex items-center justify-center gap-3">
                        <ShieldAlert className="w-8 h-8 text-matrix animate-pulse" />
                        System Initialization
                    </h2>
                    <p className="text-matrix/60 font-mono text-xs tracking-widest uppercase">
                        Establishing Secure Uplink...
                    </p>
                </div>

                {/* THE AD - ENTRY FEE */}
                <div className="min-h-[250px] bg-black/40 border border-matrix/20 mb-6 flex flex-col justify-center">
                    <AdBanner key="entry-ad" refreshInterval={0} />
                </div>

                <button
                    onClick={onComplete}
                    disabled={!canProceed}
                    className={`w-full py-4 text-center font-black uppercase tracking-[0.2em] transition-all border-2 
            ${canProceed
                            ? 'bg-matrix text-black border-matrix hover:bg-void hover:text-matrix cursor-pointer'
                            : 'bg-black/50 text-matrix/20 border-matrix/20 cursor-not-allowed'}`}
                >
                    {canProceed ? ' initialize_uplink >>' : '... establishing_connection ...'}
                </button>
            </div>
        </div>
    );
};
