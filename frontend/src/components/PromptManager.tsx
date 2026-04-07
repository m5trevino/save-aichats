import React, { useState, useEffect } from 'react';
import { Prompt } from '../types';
import { Cpu, ChevronDown } from 'lucide-react';

const DEFAULT_PROMPTS: Prompt[] = [
  { id: "1", name: "Senior Architect", content: "Act as a Senior Systems Architect..." }
];

interface PromptManagerProps {
  onSelect: (prompt: Prompt | null) => void;
  selectedPromptId: string | null;
}

export const PromptManager: React.FC<PromptManagerProps> = ({ onSelect, selectedPromptId }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('ai_prompts_vault');
    if (saved) setPrompts(JSON.parse(saved));
    else setPrompts(DEFAULT_PROMPTS);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 bg-surface-container-low p-5 border border-outline-variant shadow-lg relative overflow-hidden">
      <div className="scanline-overlay absolute inset-0 opacity-5 pointer-events-none"></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="bg-surface-container-lowest p-2 border border-outline-variant/30">
          <Cpu className="w-5 h-5 text-kinetik-lime" />
        </div>
        
        <div className="flex-1 relative">
          <select 
            className="w-full bg-surface-container-lowest border-2 border-outline-variant px-4 py-3 text-on-surface font-mono text-[10px] uppercase tracking-[0.2em] focus:border-kinetik-lime focus:outline-none transition-all appearance-none cursor-pointer"
            value={selectedPromptId || ''}
            onChange={(e) => {
              const p = prompts.find(p => p.id === e.target.value);
              onSelect(p || null);
            }}
          >
            <option value="" className="bg-surface-container font-mono">CLEAN_EXTRACTION_PROTOCOL</option>
            {prompts.map(p => (
              <option key={p.id} value={p.id} className="bg-surface-container font-mono">{p.name.toUpperCase()}_LOADOUT</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Logic_Bypass</span>
          <div className={`w-12 h-1 bg-surface-bright relative`}>
            <div className={`absolute inset-y-0 left-0 bg-kinetik-lime shadow-[0_0_5px_#CCFF00] transition-all duration-500 ${selectedPromptId ? 'w-full' : 'w-0'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
