import React, { useState } from 'react';
import { FileGroup, CommandArtifact } from '../types';

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
    alert(`Copied ${selectedCommands.length} commands to clipboard.`);
  };

  const totalCommands = fileGroups.reduce((acc, g) => acc + g.commands.length, 0);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col flex-grow mt-8 bg-slate-800 rounded-lg border border-slate-700 shadow-2xl overflow-hidden" style={{maxHeight: '75vh'}}>
        <div className="p-4 border-b border-slate-600 bg-slate-800 flex justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
                <h2 className="text-xl font-bold text-sky-400">Artifacts</h2>
                <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-mono">{totalCommands} Found</span>
            </div>
            <button onClick={handleBulkCopy} disabled={selectedIds.size === 0} className="px-4 py-2 text-sm font-bold bg-sky-600 hover:bg-sky-500 text-white rounded disabled:opacity-50">Copy Selected</button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {fileGroups.map((group) => (
                <div key={group.filename} className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="p-4 bg-slate-800 flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(group.filename)}>
                        <div className="flex items-center space-x-4">
                            <input type="checkbox" checked={group.commands.every(c => selectedIds.has(c.id))} onClick={(e) => toggleFileGroupSelection(group, e)} className="w-5 h-5 rounded border-slate-500 text-sky-600 bg-slate-700 cursor-pointer" />
                            <h3 className="font-mono text-base font-bold text-slate-200">{group.filename}</h3>
                        </div>
                    </div>
                    {expandedFiles.has(group.filename) && (
                        <div className="divide-y divide-slate-800 bg-slate-900/30">
                            {group.commands.map((cmd) => (
                                <div key={cmd.id} className="p-4 flex items-start space-x-4">
                                    <input type="checkbox" checked={selectedIds.has(cmd.id)} onChange={() => toggleSelection(cmd.id)} className="mt-1 w-4 h-4 rounded border-slate-600 text-sky-600 bg-slate-800" />
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border bg-purple-900/30 border-purple-700 text-purple-300">{cmd.type}</span>
                                            <button onClick={() => handleSingleCopy(cmd)} className="text-xs font-bold text-slate-300 hover:text-sky-400">{justCopiedId === cmd.id ? 'Copied!' : 'Copy'}</button>
                                        </div>
                                        <pre className="text-xs font-mono text-slate-300 bg-black/40 p-4 rounded border border-slate-700/50 overflow-x-auto">{cmd.command}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};
