import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ConversationDisplay } from './components/ConversationDisplay';
import { ArtifactsDisplay } from './components/ArtifactsDisplay';
import { PromptManager } from './components/PromptManager';
import { AdBanner } from './components/AdBanner'; // IMPORT AD
import { Message, JsonData, Prompt, BatchItem } from './types';
import { parseCommands } from './utils/commandParser';
import { formatMessageContent, ExportFormat } from './utils/exportUtils';

declare var JSZip: any;

const App: React.FC = () => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'artifacts'>('chat');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // Global Export Settings
  const [includeCode, setIncludeCode] = useState(true);
  const [includeThoughts, setIncludeThoughts] = useState(false);
  const [personality, setPersonality] = useState<'SIPHON' | 'TOLL'>('TOLL');
  const [apiBase, setApiBase] = useState("");

  React.useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://save-aichats-backend.onrender.com');
    setApiBase(base);

    const fetchConfig = async () => {
      try {
        const axios = (await import('axios')).default;
        const resp = await axios.get(`${base}/config`);
        setPersonality(resp.data.personality);
      } catch (e) {
        console.error("IDENTITY_RESTORE_FAILED: Defaulting to TOLL doctrine.");
        setPersonality('TOLL'); // ACTUALLY SET IT
      }
    };
    fetchConfig();
  }, []);

  const isSiphon = personality === 'SIPHON';

  const sanitizeFileName = (name: string): string => {
    let clean = name.toLowerCase().replace(/\.[^/.]+$/, "");
    clean = clean.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return clean;
  };

  const processFileContent = (content: string): Message[] => {
    const data: JsonData = JSON.parse(content);
    // Support Google chunkedPrompt OR standard chat structures (adapters logic)
    // This uses your existing logic logic for chunkedPrompt as priority
    let chunks = data?.chunkedPrompt?.chunks;

    // Quick adapter for ChatGPT/Claude if chunkedPrompt is missing
    if (!chunks) {
      // Simple fallback to prevent crash if wrong file type
      // In a full prod version we would add the specific parsers here
      // For now, we assume the user uploads the correct Google format or your backend handles conversion
      // But since this is client-side React, we stick to the provided logic:
      if (!chunks || !Array.isArray(chunks)) throw new Error("Invalid structure. (Requires JSON with chunkedPrompt)");
    }

    const extracted: Message[] = [];
    chunks.forEach(chunk => {
      if (chunk.role !== 'user' && chunk.role !== 'model') return;
      const pushOrMerge = (text: string, isThought: boolean) => {
        if (!text) return;
        const last = extracted[extracted.length - 1];
        if (last && last.role === chunk.role && !!last.isThought === isThought) {
          last.text += text;
        } else {
          extracted.push({ role: chunk.role, text, isThought });
        }
      };
      if (chunk.isThought && chunk.text) pushOrMerge(chunk.text, true);
      else if (!chunk.isThought && chunk.text) pushOrMerge(chunk.text, false);
      if (chunk.parts) {
        chunk.parts.forEach(p => { if (p.text) pushOrMerge(p.text, p.thought || false); });
      }
    });
    return extracted;
  };

  const handleFilesSelect = (files: File[]) => {
    const newItems: BatchItem[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      originalName: f.name,
      sanitizedName: sanitizeFileName(f.name),
      status: 'pending'
    }));
    setBatchItems(newItems);
    startBatch(files, newItems);
  };

  const startBatch = async (files: File[], items: BatchItem[]) => {
    setIsProcessing(true);
    for (let i = 0; i < files.length; i++) {
      setBatchItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));
      try {
        const content = await files[i].text();
        const messages = processFileContent(content);
        setBatchItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'completed', messages } : item));
      } catch (err) {
        setBatchItems(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', error: 'Failed' } : item));
      }
    }
    setIsProcessing(false);
  };

  const handleBatchDownload = async (format: ExportFormat) => {
    const completed = batchItems.filter(b => b.status === 'completed' && b.messages);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach(item => {
      const content = formatMessageContent(item.messages!, format, {
        includeCode,
        includeThoughts,
        exportTitle: item.sanitizedName,
        selectedPrompt
      });
      zip.file(`${item.sanitizedName}.${format}`, content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `save-aichats_export_${format}_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setBatchItems([]);
    setIsProcessing(false);
    setActiveFileIndex(null);
  };

  const activeItem = activeFileIndex !== null ? batchItems[activeFileIndex] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col p-4 md:p-8">

      {/* HEADER SECTION */}
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-6xl font-bold text-sky-400 tracking-tighter uppercase mb-2">Save-AI Chats</h1>
        <p className="text-slate-500 font-mono text-sm tracking-[0.2em] uppercase">Humanize & Extract Your Logs</p>
      </div>

      {/* AD SLOT 1 */}
      {!isSiphon && (
        <div className="max-w-4xl mx-auto w-full mb-8">
          <AdBanner placeholderId={101} refreshInterval={60} />
        </div>
      )}

      <PromptManager selectedPromptId={selectedPrompt?.id || null} onSelect={setSelectedPrompt} />
      <FileUpload onFilesSelect={handleFilesSelect} onClear={handleClear} isProcessing={isProcessing} hasFiles={batchItems.length > 0} />

      {batchItems.length > 0 && (
        <div className="w-full max-w-4xl mx-auto mb-8 bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Queue: {batchItems.length} Logs
            </h2>

            <div className="flex items-center gap-4">
              {/* Batch Toggles */}
              <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
                <input type="checkbox" checked={includeThoughts} onChange={(e) => setIncludeThoughts(e.target.checked)} id="bt-thought" className="w-3 h-3 text-sky-600 rounded bg-slate-800 border-slate-600" />
                <label htmlFor="bt-thought" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">Thoughts</label>
                <div className="w-px h-3 bg-slate-700 mx-1"></div>
                <input type="checkbox" checked={includeCode} onChange={(e) => setIncludeCode(e.target.checked)} id="bt-code" className="w-3 h-3 text-sky-600 rounded bg-slate-800 border-slate-600" />
                <label htmlFor="bt-code" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">Code</label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1">
                {(['json', 'md', 'txt', 'html'] as ExportFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => handleBatchDownload(fmt)}
                    disabled={isProcessing || !batchItems.some(i => i.status === 'completed')}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white rounded-lg font-bold text-[10px] tracking-widest transition-all uppercase"
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/50">
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => !isProcessing && item.status === 'completed' && setActiveFileIndex(idx)}
                className={`flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors cursor-pointer ${activeFileIndex === idx ? 'bg-sky-900/20' : ''}`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' : item.status === 'error' ? 'bg-red-500' : item.status === 'processing' ? 'bg-sky-500 animate-pulse' : 'bg-slate-600'}`} />
                  <p className="font-mono text-xs text-slate-400 truncate">{item.sanitizedName}</p>
                </div>
                {item.status === 'completed' && <span className="text-[10px] font-bold text-green-400 uppercase">Verbatim Ready</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AD SLOT 2 */}
      {!isSiphon && (
        <div className="max-w-4xl mx-auto w-full mb-8">
          <AdBanner placeholderId={102} refreshInterval={30} />
        </div>
      )}

      {activeItem?.messages && (
        <div className="space-y-6">
          <div className="w-full max-w-4xl mx-auto flex justify-center space-x-3">
            <button onClick={() => setViewMode('chat')} className={`px-8 py-2 rounded-xl font-bold border ${viewMode === 'chat' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Inspect</button>
            <button onClick={() => setViewMode('artifacts')} className={`px-8 py-2 rounded-xl font-bold border ${viewMode === 'artifacts' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Artifacts</button>
          </div>
          <div className={viewMode === 'chat' ? 'block' : 'hidden'}>
            <ConversationDisplay
              messages={activeItem.messages!}
              fileName={activeItem.sanitizedName}
              selectedPrompt={selectedPrompt}
              globalOptions={{ includeCode, includeThoughts }}
            />
          </div>
          <div className={viewMode === 'artifacts' ? 'block' : 'hidden'}>
            <ArtifactsDisplay fileGroups={parseCommands(activeItem.messages!)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
