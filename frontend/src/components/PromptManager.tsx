import React, { useState, useEffect, useRef } from 'react';
import { Prompt } from '../types';

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
    <div className="w-full max-w-4xl mx-auto mb-6 bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex gap-2">
        <select 
          className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200"
          value={selectedPromptId || ''}
          onChange={(e) => {
            const p = prompts.find(p => p.id === e.target.value);
            onSelect(p || null);
          }}
        >
          <option value="">Clean Log (No Injected Persona)</option>
          {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );
};
