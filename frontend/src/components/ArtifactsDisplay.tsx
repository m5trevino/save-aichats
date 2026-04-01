import React, { useState } from 'react';
import { FileGroup, CommandArtifact } from '../types';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface ArtifactsDisplayProps {
  fileGroups: FileGroup[];
}

export const ArtifactsDisplay: React.FC<ArtifactsDisplayProps> = ({ fileGroups }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [justCopiedId, setJustCopiedId] = useState<number | null>(null);

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleExpand = (filename: string) => {
      const newSet = new Set(expandedFiles);
      if (newSet.has(filename)) newSet.delete(filename); else newSet.add(filename);
      setExpandedFiles(newSet);
  };

  const toggleFileGroupSelection = (group: FileGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    const allSelected = group.commands.every(cmd => selectedIds.has(cmd.id));
    const newSet = new Set(selectedIds);
    if (allSelected) group.commands.forEach(cmd => newSet.delete(cmd.id));
    else group.commands.forEach(cmd => newSet.add(cmd.id));
    setSelectedIds(newSet);
  };

  const handleSingleCopy = (cmd: CommandArtifact) => {
    navigator.clipboard.writeText(cmd.command);
    setJustCopiedId(cmd.id);
    setTimeout(() => setJustCopiedId(null), 2000);
  };

  const handleBulkCopy = () => {
    const allCommands = fileGroups.flatMap(g => g.commands);
    const selectedCommands = allCommands.filter(cmd => selectedIds.has(cmd.id)).sort((a, b) => a.id - b.id);
    const text = selectedCommands.map(c => c.command).join('\n\n');
    navigator.clipboard.writeText(text);
  };

  const totalCommands = fileGroups.reduce((acc, g) => acc + g.commands.length, 0);

  return (
    <div className="w-full flex flex-col bg-surface border border-outline-variant shadow-2xl overflow-hidden h-full">
        <div className="p-4 border-b border-outline-variant bg-surface-container-high flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-kinetik-lime uppercase tracking-tighter font-headline italic flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Artifact_Vault
                </h2>
                <span className="bg-surface-container-lowest text-on-surface-variant px-3 py-1 border border-outline-variant text-[10px] font-mono uppercase tracking-widest">{totalCommands} Registered_Entities</span>
            </div>
            <button 
              onClick={handleBulkCopy} 
              disabled={selectedIds.size === 0} 
              className="px-6 py-2 text-[10px] font-black bg-kinetik-lime text-surface-container-lowest hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] disabled:opacity-20 disabled:grayscale"
            >
              Copy_Selected
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-surface-container-lowest micro-grid">
            {fileGroups.map((group) => (
                <div key={group.filename} className="bg-surface-container border border-outline-variant overflow-hidden">
                    <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center cursor-pointer group" onClick={() => toggleExpand(group.filename)}>
                        <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={group.commands.every(c => selectedIds.has(c.id))} 
                              onClick={(e) => toggleFileGroupSelection(group, e)} 
                              className="w-4 h-4 border-outline-variant bg-surface-container-lowest text-kinetik-lime focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                            />
                            <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-on-surface-variant group-hover:text-kinetik-lime transition-colors" />
                              <h3 className="font-mono text-xs font-black text-on-surface uppercase tracking-wider">{group.filename}</h3>
                            </div>
                        </div>
                        <div className="text-on-surface-variant/40 group-hover:text-kinetik-lime transition-colors">
                          {expandedFiles.has(group.filename) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                    {expandedFiles.has(group.filename) && (
                        <div className="divide-y divide-outline-variant/20 bg-surface-container-low/50">
                            {group.commands.map((cmd) => (
                                <div key={cmd.id} className="p-5 flex items-start gap-6 hover:bg-surface-bright/10 transition-colors">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedIds.has(cmd.id)} 
                                      onChange={() => toggleSelection(cmd.id)} 
                                      className="mt-1 w-4 h-4 border-outline-variant bg-surface-container-lowest text-kinetik-lime focus:ring-0 focus:ring-offset-0" 
                                    />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[9px] font-black uppercase px-3 py-1 border bg-surface-container-lowest border-outline-variant text-on-surface-variant tracking-[0.2em]">{cmd.type}</span>
                                            <button 
                                              onClick={() => handleSingleCopy(cmd)} 
                                              className="text-[9px] font-black text-on-surface-variant hover:text-kinetik-lime transition-colors uppercase tracking-widest flex items-center gap-2"
                                            >
                                              {justCopiedId === cmd.id ? (
                                                <><Check className="w-3 h-3" /> COPIED</>
                                              ) : (
                                                <><Copy className="w-3 h-3" /> COPY</>
                                              )}
                                            </button>
                                        </div>
                                        <div className="relative group/code">
                                          <pre className="text-xs font-mono text-on-surface bg-surface-container-lowest p-5 border border-outline-variant/30 overflow-x-auto scrollbar-hide whitespace-pre-wrap leading-relaxed">
                                            {cmd.command}
                                          </pre>
                                          <div className="absolute inset-0 bg-kinetik-lime/[0.02] pointer-events-none opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {fileGroups.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 border-2 border-dashed border-outline-variant flex items-center justify-center mx-auto mb-4 opacity-20">
                  <Terminal className="w-8 h-8 text-on-surface-variant" />
                </div>
                <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.4em] opacity-40">Artifact_Cache_Empty</p>
              </div>
            )}
        </div>
    </div>
  );
};
