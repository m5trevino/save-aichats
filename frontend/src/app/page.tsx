"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Zap, Download, RefreshCcw,
  ShieldAlert, CheckCircle2, Terminal,
  Layers, Lock, Unlock, ArrowRight, FileJson,
  Brain, Cpu, Activity, ShieldCheck, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';
import axios from 'axios';
import Script from 'next/script';
import { TruncatedText } from '@/components/TruncatedText';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { AdBanner } from '@/components/AdBanner';
import { ProcessingGateModal } from '@/components/ProcessingGateModal';
import { useProcessingTime } from '@/hooks/useProcessingTime';
import { Message } from '@/types';

// --- TYPES ---
interface RefineryOptions {
  include_user: boolean;
  include_bot: boolean;
  include_thoughts: boolean;
  output_format: 'md' | 'txt';
  persona_id: string | null;
  base_filename?: string;
}

interface Persona {
  id: string;
  name: string;
  instructions: string;
}

type Phase = 'BREACH' | 'CALIBRATION' | 'REFINERY' | 'EXTRACTION';

const DEFAULT_PERSONAS: Persona[] = [
  { id: 'verbatim', name: 'VERBATIM_EXTRACTOR', instructions: 'Clean, raw extraction with zero alteration.' },
  { id: 'architect', name: 'SYSTEM_ARCHITECT', instructions: 'Focus on code structure, technical debt, and architectural decisions.' },
  { id: 'forensic', name: 'FORENSIC_AUDITOR', instructions: 'Highlight security vulnerabilities, logic gaps, and edge cases.' }
];

export default function CommandDeck() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>('BREACH');
  const [file, setFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<File[]>([]);
  const [fileContent, setFileContent] = useState<string>("");
  const [options, setRefineryOptions] = useState<RefineryOptions>({
    include_user: true,
    include_bot: true,
    include_thoughts: false,
    output_format: 'md',
    persona_id: 'verbatim',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [telemetry, setTelemetry] = useState<{ msg: string, type: 'info' | 'warn' | 'success' }[]>([]);
  const [refinedMessages, setRefinedMessages] = useState<Message[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [tetherError, setTetherError] = useState<string | null>(null);
  const [personality, setPersonality] = useState<'SIPHON' | 'TOLL'>('TOLL');
  const [batchRanges, setBatchRanges] = useState<{ start: number, end: number }[]>([]);
  const [batchProgress, setBatchProgress] = useState<('IDLE' | 'PROCESSING' | 'COMPLETE')[]>(Array(20).fill('IDLE'));
  const [batchNames, setBatchNames] = useState<string[]>(Array(20).fill("AWAITING_TAG..."));
  const [processingGateOpen, setProcessingGateOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    setMounted(true);
    const base = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://save-aichats-backend.onrender.com');
    setApiBase(base);
  }, []);

  const isSiphon = personality === 'SIPHON';

  // --- CONFIG: IDENTITY FETCH ---
  useEffect(() => {
    if (!apiBase) return;
    const fetchConfig = async () => {
      try {
        const resp = await axios.get(`${apiBase}/config`);
        setPersonality(resp.data.personality);
      } catch (e) {
        console.error("IDENTITY_RESTORE_FAILED: Defaulting to TOLL doctrine.");
      }
    };
    fetchConfig();
  }, [apiBase]);

  // --- TETHERING: REVENUE ENFORCEMENT ---
  const abortControllerRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isProcessing && !isSiphon) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          setIsProcessing(false);
          setTetherError("STRIKE_SEVERED: ADS MUST REMAIN VISIBLE DURING REFINEMENT.");
          addTelemetry("[🔴] CONNECTION_TERMINATED: AD_TETHER_BROKEN", "warn");
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isProcessing, isSiphon]);

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setProcessingGateOpen(false);
      addTelemetry("[❌] ABORT_SEQUENCE_INITIATED_BY_USER", "warn");
      setTetherError("PROCESS_TERMINATED.");
    }
  };

  const addTelemetry = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setTelemetry(prev => [...prev, { msg, type }]);
  };

  const updateBatchInfo = (totalCount: number, names: string[] = []) => {
    const ranges = [];
    for (let i = 0; i < Math.min(totalCount, 500); i += 20) {
      ranges.push({ start: i, end: Math.min(i + 20, totalCount) });
    }
    const extractedNames = [...names];
    while (extractedNames.length < 20) extractedNames.push("");
    setBatchNames(extractedNames.slice(0, 20));
    setBatchRanges(ranges);
    setStartIndex(0);
  };

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [isSiphon]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    setFile(files[0]);
    setFileList(files);
    let totalChats = 0;
    let allNames: string[] = [];
    for (const f of files) {
      try {
        const text = await f.text();
        if (files.length === 1) setFileContent(text);
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          totalChats += data.length;
          data.forEach((c: any) => allNames.push(c.title || c.name || "Chat"));
        } else if (data.chunkedPrompt) {
          totalChats += 1;
          allNames.push(f.name.replace('.json', '') || "Gemini Chat");
        }
      } catch (e) { console.error("Parse error", e); }
    }
    updateBatchInfo(totalChats, allNames);
    if ((window as any).show_monetag_vignette && !isSiphon) {
      (window as any).show_monetag_vignette();
    }
    setPhase('CALIBRATION');
  };

  const initiateStrike = async () => {
    if (!file || !apiBase) return;
    if ((window as any).show_monetag_vignette && !isSiphon) {
      (window as any).show_monetag_vignette();
    }
    setPhase('REFINERY');
    setIsProcessing(true);
    setTelemetry([]);
    setProgress(0);
    setTetherError(null);
    setProcessingGateOpen(!isSiphon);
    setBatchProgress(prev => {
      const next = [...prev];
      next[0] = 'PROCESSING';
      return next;
    });

    abortControllerRef.current = new AbortController();
    addTelemetry(isSiphon ? "[📡] UPLINK_ESTABLISHED..." : "[📡] ESTABLISHING_SECURE_UPLINK...");
    addTelemetry(isSiphon ? "[⚙️] PREPARING_ARCHIVAL_STREAM..." : "[⚙️] INITIALIZING_REFINERY_ENGINE...");

    const formData = new FormData();
    fileList.forEach(f => formData.append('files', f));
    formData.append('options_json', JSON.stringify({ ...options, base_filename: file.name.replace(/\.[^/.]+$/, "") }));
    formData.append('start_index', startIndex.toString());

    try {
      const response = await fetch(`${apiBase}/refine-stream`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) throw new Error(`STRIKE_FAILED: ${response.statusText}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const allMessages: Message[] = [];
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.status === 'start') {
                  if (data.batch_names) setBatchNames(data.batch_names.concat(Array(20).fill("")).slice(0, 20));
                  addTelemetry(isSiphon ? `[📡] EXTRACTION_STARTED: ${data.total} ASSETS` : `[📡] REFINERY_STRIKE_CONFIRMED: ${data.total} TARGETS_LOCKED`, "success");
                } else if (data.status === 'welded') {
                  addTelemetry(isSiphon ? `PROCESSED: ${data.name.toUpperCase()}` : `WELDED: [${data.name.toUpperCase()}] // MSGS: ${data.msg_count}`, "success");
                  allMessages.push(...data.messages);
                  setRefinedMessages([...allMessages]);
                  const currentProgress = Math.round((data.index / data.total) * 100);
                  setProgress(currentProgress);
                  setBatchProgress(prev => {
                    const next = [...prev];
                    const idx = data.index - 1;
                    if (idx >= 0 && idx < 20) {
                      next[idx] = 'COMPLETE';
                      if (idx + 1 < 20) next[idx + 1] = 'PROCESSING';
                    }
                    return next;
                  });
                } else if (data.status === 'complete') {
                  addTelemetry(isSiphon ? "[✔️] ARCHIVAL_COMPLETE" : "[✔️] REFINERY_STRIKE_SUCCESSFUL", "success");
                  setProgress(100);
                  setBatchProgress(prev => prev.map(s => s === 'PROCESSING' ? 'COMPLETE' : s));
                }
              } catch (e) { console.error("Parse error", e); }
            }
          }
        }
      }
      setRefinedMessages(allMessages);
      setPhase('EXTRACTION');
      setIsProcessing(false);
      setProcessingGateOpen(false);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setIsProcessing(false);
        setProcessingGateOpen(false);
        addTelemetry(`[❌] FATAL_ERROR: ${error.message || 'STRIKE_FAILED'}`, "warn");
      }
    }
  };

  const executePayloadDownload = async () => {
    if (!file || !apiBase) return;
    if ((window as any).show_monetag_vignette && !isSiphon) {
      (window as any).show_monetag_vignette();
    }
    const rawBase = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9.]/g, '.');
    const brandedName = `save-aichats.com-${rawBase}`;
    const formData = new FormData();
    fileList.forEach(f => formData.append('files', f));
    formData.append('options_json', JSON.stringify({ ...options, base_filename: brandedName }));
    formData.append('start_index', startIndex.toString());
    try {
      const resp = await axios.post(`${apiBase}/refine`, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', isSiphon ? `refined_chat_export.zip` : `${brandedName}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addTelemetry("[🏁] MISSION_COMPLETE", "success");
    } catch (e) { addTelemetry("[❌] DOWNLOAD_FAILED", "warn"); }
  };

  const resetConsole = () => {
    setPhase('BREACH');
    setFile(null);
    setFileList([]);
    setFileContent("");
    setProgress(0);
    setBatchProgress(Array(20).fill('IDLE'));
    addTelemetry(isSiphon ? "[🧹] CACHE_CLEARED" : "[🧹] MEMORY_PURGED");
  };

  if (!mounted) return <div className="min-h-screen bg-background" />;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-6 h-16 bg-surface-container-lowest border-b-2 border-surface-bright sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-black text-kinetik-lime tracking-tighter font-headline">KINETIK_EXTRACTION</h1>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => setPhase('BREACH')} className={`font-label uppercase tracking-widest text-sm transition-all duration-75 border-b-2 pb-1 ${phase === 'BREACH' ? 'text-kinetik-lime border-kinetik-lime' : 'text-slate-500 border-transparent hover:text-kinetik-lime'}`}>Engine</button>
            <button onClick={() => setPhase('CALIBRATION')} className={`font-label uppercase tracking-widest text-sm transition-all duration-75 border-b-2 pb-1 ${phase === 'CALIBRATION' ? 'text-kinetik-lime border-kinetik-lime' : 'text-slate-500 border-transparent hover:text-kinetik-lime'}`}>Calibration</button>
            <button className="font-label uppercase tracking-widest text-sm text-slate-500 border-transparent hover:text-kinetik-lime transition-all duration-75">Security</button>
            <button className="font-label uppercase tracking-widest text-sm text-slate-500 border-transparent hover:text-kinetik-lime transition-all duration-75">Protocols</button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase">System_Stable: 99.4%</span>
          <div className="w-2 h-2 bg-kinetik-lime rounded-full animate-pulse glow-primary"></div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* SideNavBar */}
        <aside className="flex flex-col h-full w-64 bg-surface-container border-r border-surface-bright overflow-hidden">
          {/* PAYLOAD_DROP ZONE */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="p-4 border-b border-surface-bright bg-surface-container-low group cursor-pointer"
          >
            <div className={`border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors ${file ? 'border-kinetik-lime bg-kinetik-lime/5' : 'border-outline-variant group-hover:border-primary-fixed'}`}>
              <Terminal className={`w-5 h-5 ${file ? 'text-kinetik-lime' : 'text-on-surface-variant'}`} />
              <span className={`font-mono text-[10px] font-bold ${file ? 'text-kinetik-lime' : 'text-on-surface-variant'}`}>
                {file ? 'PAYLOAD_LOCKED' : 'PAYLOAD_DROP'}
              </span>
              <span className="font-mono text-[8px] text-on-surface-variant uppercase tracking-tighter">
                {file ? file.name : 'DRAG_AND_DROP_ZONE'}
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); initiateStrike(); }}
              disabled={!file || isProcessing}
              className={`w-full mt-3 py-2 font-mono text-[10px] font-bold transition-all ${file && !isProcessing ? 'bg-kinetik-lime text-surface-container-lowest hover:scale-[0.98]' : 'bg-surface-bright text-on-surface-variant opacity-50 cursor-not-allowed'}`}
            >
              INITIATE_STRIKE
            </button>
          </div>

          {/* LOG ENTRIES */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
            <div className="space-y-0.5">
              {batchNames.map((name, i) => (
                <div 
                  key={i} 
                  className={`px-4 py-1.5 flex items-center gap-3 font-mono text-[10px] leading-tight transition-all duration-75 cursor-pointer
                    ${batchProgress[i] === 'COMPLETE' ? 'text-kinetik-lime' : batchProgress[i] === 'PROCESSING' ? 'bg-kinetik-lime text-surface-container-lowest border-l-4 border-kinetik-lime font-bold' : 'text-slate-400 hover:text-kinetik-lime hover:bg-surface-bright'}
                  `}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="truncate">{name || `LOG_IDX_${882 - i}`}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          <div className="p-2 border-t border-surface-bright flex justify-between bg-surface-container-lowest">
            <button className="flex items-center gap-1 text-kinetik-lime font-mono text-[9px] hover:bg-surface-bright px-2 py-1">
              <ChevronLeft className="w-3 h-3" /> [1-20]
            </button>
            <button className="flex items-center gap-1 text-slate-400 font-mono text-[9px] hover:bg-surface-bright px-2 py-1">
              <Menu className="w-3 h-3" /> [21-40]
            </button>
            <button className="flex items-center gap-1 text-slate-400 font-mono text-[9px] hover:bg-surface-bright px-2 py-1">
              <ChevronRight className="w-3 h-3" /> [41-60]
            </button>
          </div>
        </aside>

        {/* Canvas Area */}
        <section className="flex-1 overflow-y-auto p-8 relative scrollbar-hide bg-surface">
          <div className="max-w-6xl mx-auto space-y-8 relative z-10">
            <AnimatePresence mode="wait">
              {phase === 'BREACH' && (
                <motion.div key="breach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <h2 className="font-mono text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-kinetik-lime"></span> ACTIVE_AI_NODES
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { name: 'ChatGPT', version: 'v4.0.1', status: 'IDLE', icon: Brain },
                      { name: 'Claude 3', version: 'v3.5.0', status: 'READY', icon: Cpu, active: true },
                      { name: 'AI Studio', version: 'v2.1.9', status: 'SLEEP', icon: Activity },
                      { name: 'Gemini CLI', version: 'v1.0.4', status: 'LISTENING', icon: Terminal }
                    ].map((node) => (
                      <div key={node.name} className={`bg-surface-container-low border p-5 group transition-all ${node.active ? 'border-kinetik-lime glow-primary' : 'border-outline-variant hover:border-primary-fixed'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <node.icon className={`w-5 h-5 ${node.active ? 'text-kinetik-lime' : 'text-on-surface-variant group-hover:text-primary-fixed'}`} />
                          <span className={`font-mono text-[10px] ${node.active ? 'text-kinetik-lime' : 'text-outline'}`}>{node.version}</span>
                        </div>
                        <h3 className="font-headline font-bold text-lg mb-1">{node.name}</h3>
                        <p className={`font-mono text-[10px] uppercase ${node.active ? 'text-kinetik-lime' : 'text-on-surface-variant'}`}>STATUS: {node.status}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {phase === 'CALIBRATION' && (
                <motion.div key="calibration" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-surface-container-lowest border-l-4 border-kinetik-lime p-6 relative overflow-hidden">
                      <div className="scanline-overlay absolute inset-0 opacity-10"></div>
                      <h2 className="font-mono text-[12px] text-kinetik-lime font-bold mb-6 flex items-center gap-2 uppercase">
                        <Layers className="w-4 h-4" /> REFINERY_CONFIGURATION
                      </h2>
                      <div className="space-y-3 font-mono text-sm">
                        {[{ id: 'include_user', label: 'USER_INPUT' }, { id: 'include_bot', label: 'BOT_RESPONSE' }, { id: 'include_thoughts', label: 'THOUGHTS' }].map((t) => (
                          <div key={t.id} className="flex justify-between border-b border-outline-variant/20 pb-2 items-center">
                            <span className="text-on-surface-variant text-xs">{t.label}:</span>
                            <button 
                              onClick={() => setRefineryOptions({ ...options, [t.id]: !(options as any)[t.id] })}
                              className={`px-3 py-1 text-[10px] font-bold border transition-all ${(options as any)[t.id] ? 'bg-kinetik-lime text-surface-container-lowest border-kinetik-lime' : 'border-outline-variant text-on-surface-variant'}`}
                            >
                              {(options as any)[t.id] ? 'ENABLED' : 'DISABLED'}
                            </button>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-on-surface-variant text-xs">OUTPUT_FORMAT:</span>
                          <div className="flex gap-2">
                            {['md', 'txt'].map((fmt) => (
                              <button key={fmt} onClick={() => setRefineryOptions({ ...options, output_format: fmt as any })}
                                className={`px-3 py-1 text-[10px] font-bold border transition-all ${options.output_format === fmt ? 'bg-kinetik-lime text-surface-container-lowest border-kinetik-lime' : 'border-outline-variant text-on-surface-variant'}`}
                              >
                                {fmt.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest border border-outline-variant p-6">
                      <h2 className="font-mono text-[12px] text-on-surface font-bold mb-4 flex items-center gap-2 uppercase">
                        <Zap className="w-4 h-4 text-kinetik-lime" /> PERSONA_LOADOUT
                      </h2>
                      <div className="space-y-2">
                        {DEFAULT_PERSONAS.map((p) => (
                          <button key={p.id} onClick={() => setRefineryOptions({ ...options, persona_id: p.id })}
                            className={`w-full text-left p-3 border transition-all ${options.persona_id === p.id ? 'border-kinetik-lime bg-kinetik-lime/5 text-kinetik-lime' : 'border-outline-variant text-on-surface-variant hover:bg-surface-bright'}`}
                          >
                            <div className="flex justify-between text-[10px] font-bold mb-1">
                              <span>{p.name}</span>
                              {options.persona_id === p.id && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <p className="text-[9px] opacity-60 leading-tight">{p.instructions}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant p-6">
                    <h2 className="font-mono text-[12px] text-on-surface font-bold mb-4 flex items-center gap-2 uppercase">
                      <Menu className="w-4 h-4 text-kinetik-lime" /> BATCH_SELECTION
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {batchRanges.map((range, idx) => (
                        <button
                          key={idx}
                          onClick={() => setStartIndex(range.start)}
                          className={`p-2 border font-mono text-[10px] font-black transition-all ${startIndex === range.start ? 'bg-kinetik-lime text-surface-container-lowest border-kinetik-lime' : 'border-outline-variant text-on-surface-variant hover:border-kinetik-lime'}`}
                        >
                          [{range.start + 1}-{range.end}]
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={initiateStrike}
                      className="group relative bg-kinetik-lime text-surface-container-lowest px-12 py-4 font-headline font-black text-lg tracking-[0.3em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary"
                    >
                      INITIATE_STRIKE
                      <div className="absolute inset-0 border-2 border-kinetik-lime -m-1 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </motion.div>
              )}

              {phase === 'REFINERY' && (
                <motion.div key="refinery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-surface-container-lowest border-2 border-kinetik-lime p-8 relative overflow-hidden min-h-[400px] flex flex-col">
                    <div className="scanline-overlay absolute inset-0 opacity-20"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <div>
                        <h2 className="text-2xl font-black text-kinetik-lime tracking-tighter uppercase font-headline italic">Refinery_Active</h2>
                        <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest">Processing Data Stream // BATCH_{Math.floor(startIndex/20) + 1}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-kinetik-lime tabular-nums font-mono">{progress}%</div>
                        <div className="w-full bg-surface-bright h-1 mt-2">
                          <motion.div className="bg-kinetik-lime h-full shadow-[0_0_10px_#CCFF00]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>

                    <div ref={logContainerRef} className="flex-1 overflow-y-auto font-mono text-sm space-y-2 relative z-10 scrollbar-hide max-h-[300px] border-t border-outline-variant/20 pt-4">
                      {telemetry.map((log, i) => (
                        <div key={i} className="flex gap-4 items-start py-1 border-l-2 border-transparent hover:border-kinetik-lime/40 pl-3 transition-all">
                          <span className="text-on-surface-variant/30 text-[9px] pt-0.5">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                          <p className={`text-xs ${log.type === 'warn' ? 'text-error font-bold' : log.type === 'success' ? 'text-kinetik-lime font-bold' : 'text-on-surface-variant'}`}>
                            {log.msg.toUpperCase()}
                          </p>
                        </div>
                      ))}
                      {progress < 100 && (
                        <div className="flex items-center gap-3 py-2">
                          <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-2 h-4 bg-kinetik-lime opacity-60" />
                          <span className="text-xs text-kinetik-lime/40 animate-pulse font-black tracking-widest uppercase">Syncing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {phase === 'EXTRACTION' && (
                <motion.div key="extraction" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  <div className="bg-surface-container-lowest border-2 border-kinetik-lime overflow-hidden flex flex-col min-h-[600px]">
                    <header className="p-4 border-b border-surface-bright flex justify-between items-center bg-surface-container-low relative overflow-hidden">
                      <div className="scanline-overlay absolute inset-0 opacity-5"></div>
                      <div className="flex items-center gap-3 relative z-10">
                        <CheckCircle2 className="w-5 h-5 text-kinetik-lime" />
                        <h2 className="text-lg font-black text-kinetik-lime tracking-tighter uppercase font-headline">EXTRACTION_SUCCESSFUL</h2>
                      </div>
                      <div className="font-mono text-[10px] text-on-surface-variant relative z-10">
                        TARGETS: {startIndex + 1}-{startIndex + 20} // SHA256_VERIFIED
                      </div>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-surface-container-lowest">
                      <ConversationDisplay 
                        messages={refinedMessages} 
                        fileName={file?.name || "payload.json"} 
                        selectedPrompt={null} 
                        globalOptions={{ includeCode: true, includeThoughts: options.include_thoughts }} 
                      />
                    </div>

                    <div className="p-8 border-t border-surface-bright bg-surface-container-low">
                      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                          <h3 className="text-3xl font-black italic tracking-tighter text-on-surface uppercase mb-2">Payload_Ready</h3>
                          <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-[0.2em]">Batch secure and formatted for deployment.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={executePayloadDownload}
                            className="bg-kinetik-lime text-surface-container-lowest px-8 py-4 font-headline font-black text-lg tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary flex items-center gap-3"
                          >
                            <Download className="w-6 h-6" /> DOWNLOAD
                          </button>
                          <button onClick={resetConsole} className="px-8 py-4 border border-outline-variant text-on-surface-variant font-mono text-xs font-bold uppercase hover:bg-surface-bright transition-all">
                            NEW_MISSION
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AD_GATED_STRIKE_AREA (Visual placeholder for the aesthetic) */}
            {(phase === 'BREACH' || phase === 'CALIBRATION') && (
              <div className="mt-12 border-t border-surface-bright pt-8 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-[9px] text-on-surface-variant uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> AD_GATED_STRIKE_PROTOCOL
                  </h3>
                  <span className="bg-error-container text-error px-2 py-0.5 font-mono text-[8px] font-bold border border-error uppercase">Restricted</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-32 bg-surface-container-low border border-outline-variant flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                      <span className="font-mono text-[10px] font-bold text-white/40 italic">STRIKE_PATH_BLOCKER: ON</span>
                    </div>
                  </div>
                  <div className="h-32 bg-surface-container-low border border-outline-variant flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                      <span className="font-mono text-[10px] font-bold text-white/40 italic">STRIKE_PATH_BLOCKER: ON</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-surface-container-lowest border-t border-surface-bright flex items-center px-6 justify-between text-[9px] font-mono text-outline-variant z-50">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-kinetik-lime"></span> KINETIK_CORE_STABLE</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-kinetik-lime"></span> ENCRYPTION_ACTIVE</span>
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">MEM: 4.2GB/16.0GB</span>
          <span className="hidden sm:inline">LATENCY: 12ms</span>
          <span className="text-on-surface-variant uppercase">User: ADMIN_STRIKE_AUTH</span>
        </div>
      </footer>

      {/* Hidden processing gate */}
      <ProcessingGateModal
        isOpen={processingGateOpen}
        chatNames={batchNames}
        batchProgress={batchProgress}
        overallProgress={progress}
        isProcessing={isProcessing}
        onAbort={handleAbort}
        onDownload={executePayloadDownload}
      />

      {tetherError && <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-10"><div className="bg-error-container border-2 border-error p-12 text-error font-black text-2xl text-center animate-pulse uppercase shadow-[0_0_100px_rgba(255,0,0,0.3)] font-headline">{tetherError}</div></div>}

      {/* Background Assets */}
      <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
      
      {!isSiphon && (
        <>
          <Script id="monetag-in-page-push" strategy="lazyOnload" src="https://nap5k.com/tag.min.js" data-zone="10498610" />
          <Script id="monetag-vignette" strategy="lazyOnload" src="https://gizokraijaw.net/vignette.min.js" data-zone="10498617" />
        </>
      )}
    </div>
  );
}
