"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Zap, Download, RefreshCcw,
  ShieldAlert, CheckCircle2, Terminal,
  Layers, Lock, Unlock, ArrowRight, FileJson
} from 'lucide-react';
import axios from 'axios';
import Script from 'next/script';
import { SecurityBanner } from '@/components/SecurityBanner';
import { TruncatedText } from '@/components/TruncatedText';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { AdBanner } from '@/components/AdBanner';
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
  const [showAdGate, setShowAdGate] = useState(false);
  const [personality, setPersonality] = useState<'SIPHON' | 'TOLL'>('TOLL');
  const [mountedTime, setMountedTime] = useState("");
  const [batchRanges, setBatchRanges] = useState<{ start: number, end: number }[]>([]);

  const [batchProgress, setBatchProgress] = useState<('IDLE' | 'PROCESSING' | 'COMPLETE')[]>(Array(20).fill('IDLE'));
  const [processedFileNames, setProcessedFileNames] = useState<string[]>(Array(20).fill(""));
  const [batchNames, setBatchNames] = useState<string[]>(Array(20).fill("AWAITING_TAG..."));
  const [currentFileTimer, setCurrentFileTimer] = useState(15);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Use a state for API_BASE to avoid hydration mismatch
  const [apiBase, setApiBase] = useState("");

  useEffect(() => {
    setMounted(true);
    setMountedTime(new Date().toISOString());
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

  // --- TIMER: PER-FILE COUNTDOWN (INTERNAL ONLY NOW) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && currentFileTimer > 0) {
      interval = setInterval(() => {
        setCurrentFileTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, currentFileTimer]);

  // --- SCROLL LOGS ---
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [telemetry]);

  // --- HANDLERS ---
  const addTelemetry = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setTelemetry(prev => [...prev, { msg, type }]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const calculateBatchRanges = (jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent);
      let count = 0;
      if (Array.isArray(data)) count = data.length;
      else if (data.chunkedPrompt) count = 1;

      const ranges = [];
      for (let i = 0; i < Math.min(count, 500); i += 20) {
        ranges.push({ start: i, end: Math.min(i + 20, count) });
      }
      setBatchRanges(ranges);
      setStartIndex(0);
    } catch (e) {
      setBatchRanges([{ start: 0, end: 20 }]);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || "";
        setFileContent(content);
        calculateBatchRanges(content);
      };
      reader.readAsText(droppedFile);

      if ((window as any).show_monetag_vignette && !isSiphon) {
        (window as any).show_monetag_vignette();
      }
      setPhase('CALIBRATION');
    }
  }, [isSiphon]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || "";
        setFileContent(content);
        calculateBatchRanges(content);
      };
      reader.readAsText(selectedFile);

      if ((window as any).show_monetag_vignette && !isSiphon) {
        (window as any).show_monetag_vignette();
      }
      setPhase('CALIBRATION');
    }
  };

  const initiateStrike = async () => {
    if (!file || !apiBase) return;
    setPhase('REFINERY');
    setIsProcessing(true);
    setTelemetry([]);
    setProgress(0);
    setTetherError(null);
    setShowAdGate(!isSiphon);

    setCurrentFileTimer(15);
    setProcessedFileNames(Array(20).fill(""));
    setBatchProgress(prev => {
      const next = [...prev];
      next[0] = 'PROCESSING';
      return next;
    });

    abortControllerRef.current = new AbortController();

    addTelemetry(isSiphon ? "[📡] UPLINK_ESTABLISHED..." : "[📡] ESTABLISHING_SECURE_UPLINK...");
    addTelemetry(isSiphon ? "[⚙️] PREPARING_ARCHIVAL_STREAM..." : "[⚙️] INITIALIZING_REFINERY_ENGINE...");

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const strikeOptions = { ...options, base_filename: baseName };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('options_json', JSON.stringify(strikeOptions));
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
                  setBatchNames(data.batch_names || []);
                  addTelemetry(isSiphon ? `[📡] EXTRACTION_STARTED: ${data.total} ASSETS` : `[📡] REFINERY_STRIKE_CONFIRMED: ${data.total} TARGETS_LOCKED`, "success");
                } else if (data.status === 'welded') {
                  const msg = isSiphon ? `PROCESSED: ${data.name.toUpperCase()}` : `WELDED: [${data.name.toUpperCase()}] // MSGS: ${data.msg_count}`;
                  addTelemetry(msg, "success");
                  allMessages.push(...data.messages);
                  setRefinedMessages([...allMessages]);
                  setProgress(Math.round((data.index / data.total) * 100));

                  setBatchProgress(prev => {
                    const next = [...prev];
                    const idx = data.index - 1;
                    if (idx >= 0 && idx < 20) {
                      next[idx] = 'COMPLETE';
                      setProcessedFileNames(prevNames => {
                        const nextNames = [...prevNames];
                        nextNames[idx] = data.name;
                        return nextNames;
                      });
                      if (idx + 1 < 20) {
                        next[idx + 1] = 'PROCESSING';
                        setCurrentFileTimer(15);
                      }
                    }
                    return next;
                  });

                } else if (data.status === 'complete') {
                  addTelemetry(isSiphon ? "[✔️] ARCHIVAL_COMPLETE" : "[✔️] REFINERY_STRIKE_SUCCESSFUL", "success");
                  addTelemetry(isSiphon ? "[📦] ASSETS_PERSISTED_IN_VAULT" : "[📦] PAYLOAD_COMPRESSED_AND_DELIVERED", "success");
                  setProgress(100);
                  setBatchProgress(prev => prev.map(s => s === 'PROCESSING' ? 'COMPLETE' : s));
                } else if (data.status === 'error') {
                  addTelemetry(`[❌] REFINERY_MALFUNCTION: ${data.message.toUpperCase()}`, "warn");
                  setIsProcessing(false);
                }
              } catch (e) {
                console.error("Parse error:", e);
                addTelemetry("[⚠️] FRAGMENTED_PACKET_DROPPED", "warn");
              }
            }
          }
        }
      }

      setRefinedMessages(allMessages);
      setPhase('EXTRACTION');
      setIsProcessing(false);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setIsProcessing(false);
        addTelemetry(`[❌] FATAL_ERROR: ${error.message || 'STRIKE_FAILED'}`, "warn");
      }
    }
  };

  const executePayloadDownload = async () => {
    if (!file || !apiBase) return;
    addTelemetry("[🚀] INITIATING_FINAL_DOWNLOAD...");
    const baseName = file.name.replace(/\.[^/.]+$/, "") || "payload";
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options_json', JSON.stringify({ ...options, base_filename: baseName }));
    formData.append('start_index', startIndex.toString());
    try {
      const zipResponse = await axios.post(`${apiBase}/refine`, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([zipResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', isSiphon ? `refined_chat_export.zip` : `ULTRADATA_STRIKE_EXTRACT.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addTelemetry("[🏁] MISSION_COMPLETE", "success");
    } catch (e) {
      addTelemetry("[❌] DOWNLOAD_FAILED", "warn");
    }
  };

  const resetConsole = () => {
    setPhase('BREACH');
    setFile(null);
    setFileContent("");
    setProgress(0);
    addTelemetry(isSiphon ? "[🧹] CACHE_CLEARED" : "[🧹] MEMORY_PURGED");
    setShowAdGate(false);
  };

  if (!mounted) return <div className="min-h-screen bg-void" />;

  return (
    <main className={`min-h-screen ${isSiphon ? 'bg-slate-950 text-slate-200' : 'bg-void text-matrix'} font-mono selection:bg-matrix selection:text-void relative overflow-hidden transition-colors duration-1000 flex flex-col items-center`}>
      {!isSiphon && <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-10" />}

      <div className="max-w-7xl w-full mx-auto px-4 py-12 relative z-10 transition-all duration-700">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-matrix/20 pb-8">
          <div className="space-y-2">
            {!isSiphon && <div className="text-[10px] text-matrix/40 mb-2 tracking-[0.5em] animate-pulse">[ ESTABLISHED_CONNECTION: 0xFF129 ]</div>}
            <h1 className={`text-5xl md:text-7xl font-black ${isSiphon ? 'text-blue-500' : 'text-matrix'} tracking-tighter glow-text italic`}>
              {isSiphon ? 'RefineAI' : 'save-aichats.com'}
            </h1>
            <p className={`text-xs ${isSiphon ? 'text-slate-500' : 'text-matrix/60'} tracking-[0.3em] font-bold uppercase`}>
              {isSiphon ? 'PROPRIETARY_LOG_PROCESSOR.v2' : 'OFFICIAL_LOG_REFINERY_AND_EXTRACTION_TOOL // THE_WASHHOUSE'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <SecurityBanner />
            <div className={`h-12 w-[1px] ${isSiphon ? 'bg-slate-800' : 'bg-matrix/20'}`} />
            <div className="text-right">
              <div className={`text-[10px] ${isSiphon ? 'text-slate-500' : 'text-matrix/40'} tracking-widest font-black mb-1`}>{isSiphon ? 'SYSTEM_UPLINK' : 'SYSTEM_NODE'}</div>
              <div className={`text-sm ${isSiphon ? 'text-blue-500' : 'text-matrix'} font-black tabular-nums`}>{isSiphon ? 'STABLE' : 'VOID_ALPHA_0.1'}</div>
            </div>
          </div>
        </header>

        <div className={`w-full max-w-7xl mx-auto ${isSiphon ? 'bg-slate-900/40 border-slate-800' : 'bg-void/40 border-matrix/10'} border backdrop-blur-xl rounded-sm shadow-2xl overflow-hidden relative`}>
          <AnimatePresence mode="wait">
            {phase === 'BREACH' && (
              <motion.div key="breach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-12">
                <div className="flex items-center gap-4 mb-8">
                  <Terminal className={`w-8 h-8 ${isSiphon ? 'text-blue-500' : 'text-matrix'}`} />
                  <div>
                    <h2 className={`text-2xl font-black ${isSiphon ? 'text-slate-100' : 'text-matrix'} tracking-tighter uppercase`}>{isSiphon ? 'UPLINK_PROTOCOL' : 'BREACH_INITIALIZED'}</h2>
                    <p className={`text-xs ${isSiphon ? 'text-slate-500' : 'text-matrix/40'} font-bold uppercase tracking-widest`}>{isSiphon ? 'Awaiting source file...' : 'AWAITING_JSON_PAYLOAD...'}</p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDrop={onDrop}
                  className={`border-2 border-dashed ${isSiphon ? 'border-slate-800 bg-slate-950/50 hover:border-blue-500/50' : 'border-matrix/20 bg-matrix/5 hover:border-matrix/40'} p-16 rounded-xl transition-all cursor-pointer group flex flex-col items-center justify-center gap-6 shadow-inner mb-12`}
                >
                  <Upload className={`w-12 h-12 ${isSiphon ? 'text-blue-500' : 'text-matrix'} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isSiphon ? 'text-slate-300' : 'text-matrix'}`}>{isSiphon ? 'Browse or drop log file' : 'DROP_JSON_OR_ZIP_PAYLOAD_HERE'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Validated Extraction for ChatGPT, Claude, Gemini</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-matrix/10 pb-2">
                    <h3 className="text-[10px] font-black text-matrix/40 uppercase tracking-[0.4em]">SUPPORTED_ASSET_REGISTRY</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full" /><span className="text-[8px] font-bold opacity-40">LIVE</span></div>
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-voltage rounded-full" /><span className="text-[8px] font-bold opacity-40">PIPELINE</span></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {[
                      { name: 'ChatGPT', status: 'LIVE' },
                      { name: 'Claude', status: 'LIVE' },
                      { name: 'Gemini', status: 'LIVE' },
                      { name: 'Perplexity', status: 'DEV' },
                      { name: 'DeepSeek', status: 'DEV' },
                      { name: 'Grok', status: 'DEV' },
                      { name: 'Mistral', status: 'DEV' },
                      { name: 'Copilot', status: 'DEV' },
                      { name: 'Poe', status: 'DEV' },
                      { name: 'Kimi', status: 'DEV' }
                    ].map((asset) => (
                      <div key={asset.name} className={`p-3 border ${asset.status === 'LIVE' ? 'border-[#00FF41]/20 bg-[#00FF41]/5 text-[#00FF41]' : 'border-voltage/10 bg-voltage/5 text-voltage opacity-40'} rounded flex flex-col items-center gap-1 transition-all hover:scale-105`}>
                        <span className="text-[10px] font-black tracking-tighter">{asset.name.toUpperCase()}</span>
                        <span className="text-[7px] font-bold opacity-60 tracking-widest">{asset.status === 'LIVE' ? 'OPERATIONAL' : 'IN_PRODUCTION'}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              </motion.div>
            )}

            {phase === 'CALIBRATION' && (
              <motion.div key="calibration" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="p-8 md:p-10 space-y-8">
                <div className="flex items-center justify-between border-b border-matrix/10 pb-6">
                  <div className="flex items-center gap-4">
                    <Layers className={`w-8 h-8 ${isSiphon ? 'text-blue-500' : 'text-matrix'}`} />
                    <h2 className={`text-2xl font-black tracking-tighter uppercase ${isSiphon ? 'text-slate-100' : 'text-matrix'}`}>{isSiphon ? 'PARAMETERS' : 'COMMAND_DECK'}</h2>
                  </div>
                  <button onClick={resetConsole} className="text-[10px] font-black underline uppercase opacity-40 hover:opacity-100">[ RESET ]</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className={`text-[9px] font-bold tracking-[0.4em] ${isSiphon ? 'text-blue-400' : 'text-voltage'}`}>OP_CONFIG</h3>
                    <div className="space-y-3">
                      {[{ id: 'include_user', label: 'USER_INPUT' }, { id: 'include_bot', label: 'BOT_RESPONSE' }, { id: 'include_thoughts', label: 'THOUGHTS' }].map((t) => (
                        <button key={t.id} onClick={() => setRefineryOptions({ ...options, [t.id]: !(options as any)[t.id] })}
                          className={`w-full flex items-center justify-between p-3 border transition-all ${(options as any)[t.id] ? (isSiphon ? 'border-blue-500/40 bg-blue-500/5 text-blue-400' : 'border-matrix/40 bg-matrix/5 text-matrix') : (isSiphon ? 'border-slate-800 text-slate-600' : 'border-matrix/5 text-matrix/20')}`}
                        >
                          <span className="text-[10px] font-bold tracking-widest">{t.label}</span>
                          {(options as any)[t.id] ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 opacity-20" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-[9px] font-bold tracking-[0.4em] ${isSiphon ? 'text-blue-400' : 'text-voltage'}`}>PERSONA_LOADOUT</h3>
                      <div className="flex gap-2">
                        {['md', 'txt'].map((fmt) => (
                          <button key={fmt} onClick={() => setRefineryOptions({ ...options, output_format: fmt as any })}
                            className={`px-4 py-1.5 border text-[9px] font-bold ${options.output_format === fmt ? (isSiphon ? 'bg-blue-600 border-blue-600' : 'bg-matrix text-void border-matrix') : (isSiphon ? 'border-slate-800 text-slate-500' : 'border-matrix/10 text-matrix/30')}`}
                          >
                            .{fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!isSiphon && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-[9px] font-bold tracking-[0.4em] text-voltage uppercase">BATCH_SELECTOR</h3>
                          <span className="text-[8px] text-matrix/40 font-bold uppercase tracking-widest hidden md:inline">20_TARGETS_PER_STRIKE</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                          {batchRanges.map((range, idx) => (
                            <button
                              key={idx}
                              onClick={() => setStartIndex(range.start)}
                              className={`p-2 border text-[10px] font-black tracking-tighter transition-all ${startIndex === range.start ? 'bg-matrix text-void border-matrix' : 'bg-void border-matrix/10 text-matrix/40 hover:border-matrix/40 hover:text-matrix'}`}
                            >
                              {range.start + 1}-{range.end}
                            </button>
                          ))}
                        </div>
                        <div className="text-[8px] text-hazard font-bold uppercase tracking-widest italic opacity-60">
                          * STRIKE RANGE LOCKED: {startIndex + 1} TO {startIndex + 20}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      {DEFAULT_PERSONAS.map((p) => (
                        <button key={p.id} onClick={() => setRefineryOptions({ ...options, persona_id: p.id })}
                          className={`text-left p-3 border transition-all ${options.persona_id === p.id ? (isSiphon ? 'border-blue-500/60 bg-blue-500/5 text-blue-400' : 'border-matrix/60 bg-matrix/[0.03] text-matrix') : (isSiphon ? 'border-slate-800 hover:border-slate-700 text-slate-600' : 'border-matrix/5 text-matrix/20')}`}
                        >
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span>{p.name}</span>
                            {options.persona_id === p.id && <Zap className={`w-3 h-3 ${isSiphon ? 'text-blue-500' : 'text-voltage'} animate-pulse`} />}
                          </div>
                          <p className="text-[9px] opacity-60 leading-tight">{p.instructions}</p>
                        </button>
                      ))}
                    </div>

                    <div className="mt-8">
                      <button onClick={initiateStrike} disabled={isProcessing} className={`w-full py-4 font-black text-sm tracking-[0.4em] flex items-center justify-center gap-3 transition-all ${isSiphon ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-900/40' : 'bg-void border-2 border-matrix/50 text-matrix hover:bg-matrix/10'}`}>
                        {isSiphon ? 'EXECUTE_UPLINK' : 'CLEAN_SWEEP'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-matrix/5">
                  <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">INGEST_PREVIEW</h3>
                  <div className={`p-4 ${isSiphon ? 'bg-slate-950 border-slate-900' : 'bg-void border-matrix/5'} border`}><TruncatedText text={fileContent} limit={400} className="text-[10px] opacity-40 italic" /></div>
                </div>
              </motion.div>
            )}

            {(phase === 'REFINERY' || phase === 'EXTRACTION') && (
              <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6 relative min-h-[850px] w-full p-4 md:p-8 overflow-hidden bg-void">

                {/* 🟢 THE GREEN BOX: FIXED SIDEBAR (FORENSIC STACK) */}
                <div className="w-full lg:w-[320px] shrink-0 bg-void/50 border border-matrix/20 overflow-hidden flex flex-col shadow-2xl z-10">
                  <div className="p-4 border-b border-matrix/20 bg-matrix/5 flex justify-between items-center font-black text-[12px] tracking-widest text-matrix/40">
                    <span>TARGET_BATCH</span>
                    <span>STATUS</span>
                  </div>
                  <div className="flex-grow overflow-y-auto scrollbar-hide">
                    {batchNames.map((name, i) => (
                      <div key={i} className={`relative p-4 border-b border-matrix/10 transition-colors ${batchProgress[i] === 'PROCESSING' ? 'bg-voltage/5' : batchProgress[i] === 'COMPLETE' ? 'bg-matrix/10' : ''}`}>
                        {batchProgress[i] === 'PROCESSING' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((15 - currentFileTimer) / 15) * 100}%` }}
                            className="absolute inset-0 bg-voltage/10 z-0"
                          />
                        )}
                        <div className="relative z-10 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className={`text-[12px] font-black tabular-nums ${batchProgress[i] === 'COMPLETE' ? 'text-matrix' : batchProgress[i] === 'PROCESSING' ? 'text-voltage' : 'text-matrix/20'}`}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className={`text-[11px] font-black uppercase tracking-tighter truncate max-w-[150px] ${batchProgress[i] === 'COMPLETE' ? 'text-matrix font-bold' : batchProgress[i] === 'PROCESSING' ? 'text-voltage animate-pulse' : 'text-matrix/40'}`}>
                              {name}
                            </span>
                          </div>
                          {batchProgress[i] === 'COMPLETE' && <CheckCircle2 className="w-4 h-4 text-matrix drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🔴 THE RED BOX: MAIN INTERSTITIAL HUB (THE SANDWICH) */}
                <div className="flex-grow relative bg-matrix/5 border border-matrix/20 shadow-2xl overflow-hidden flex flex-col">
                  {showAdGate && !isSiphon && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex flex-col bg-void/90 backdrop-blur-2xl">

                      {/* TOP SLICE: MASSIVE AD */}
                      <div className="w-full bg-void border-b border-matrix/20 p-6 flex justify-center items-center">
                        <div className="scale-110 md:scale-[1.6] origin-center">
                          <AdBanner />
                        </div>
                      </div>

                      {/* MEAT: FORENSIC TERMINAL */}
                      <div className="flex-grow relative overflow-hidden flex flex-col group bg-void/40">
                        <div className="absolute top-4 right-6 text-[11px] text-matrix/20 font-black animate-pulse uppercase tracking-[0.3em] flex items-center gap-3 z-20">
                          <div className="w-2.5 h-2.5 bg-voltage rounded-full shadow-[0_0_15px_#FFD700]" /> LIVE_UPLINK_DATA
                        </div>
                        <div ref={logContainerRef} className="flex-grow overflow-y-auto font-mono text-base md:text-xl space-y-4 p-8 scrollbar-hide pt-12">
                          {telemetry.slice(-30).map((log, i) => (
                            <div key={i} className="flex gap-4 leading-relaxed border-l-4 border-transparent hover:border-matrix/40 pl-4 transition-all hover:bg-matrix/5">
                              <span className="text-matrix/20 text-[10px] whitespace-nowrap pt-1 bg-void/20 px-1.5 rounded font-black">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                              <p className={`${log.type === 'warn' ? 'text-hazard font-black' : log.type === 'success' ? 'text-[#00FF41] font-bold drop-shadow-[0_0_15px_rgba(0,255,65,0.5)]' : 'text-matrix/50'}`}>
                                {log.msg.toUpperCase()}
                              </p>
                            </div>
                          ))}
                          {progress < 100 && (
                            <div className="flex items-center gap-4 pt-4">
                              <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-6 bg-matrix opacity-40 shadow-[0_0_10px_rgba(0,255,65,0.4)]" />
                              <span className="text-base text-matrix/20 animate-pulse font-black tracking-widest uppercase">Syncing_with_refinery...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* BOTTOM SLICE: AD + STATUS */}
                      <div className="w-full bg-void border-t border-matrix/20 p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-voltage tracking-widest uppercase mb-1">BATCH_REFINEMENT</span>
                              <span className="text-4xl font-black text-matrix tabular-nums tracking-tighter shadow-matrix/20">
                                {Math.floor((progress / 100) * 20)} / 20
                              </span>
                            </div>
                            <div className="w-[1px] h-16 bg-matrix/20" />
                            <div className="scale-75 origin-center">
                              <AnalogCycle progress={progress < 100 ? (15 - currentFileTimer) * (100 / 15) : 100} />
                            </div>
                          </div>

                          <div className="flex-1 max-w-[400px]">
                            <AdBanner />
                          </div>

                          <AnimatePresence>
                            {progress === 100 && (
                              <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                id="collect-payload-btn"
                                onClick={async () => {
                                  if ((window as any).show_monetag_vignette) {
                                    (window as any).show_monetag_vignette();
                                  }
                                  setShowAdGate(false);
                                  executePayloadDownload();
                                }}
                                className="px-16 py-8 bg-matrix text-void font-black text-xl tracking-[0.4em] uppercase hover:bg-[#00FF41] transition-all border-b-[8px] border-matrix/50 shadow-2xl active:border-b-0 active:translate-y-2 whitespace-nowrap"
                              >
                                COLLECT_PAYLOAD
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* Fallback display for Extraction phase when gate is closed */}
                  {phase === 'EXTRACTION' && !showAdGate && (
                    <div className="flex-grow flex flex-col overflow-hidden bg-void/20">
                      <header className="p-4 border-b border-matrix/10 flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-[0.3em] bg-matrix/5">
                        <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-matrix" /> DATA_VAULT_OPEN</div>
                        <div className="tabular-nums">STRIKE_SUCCESS // {startIndex + 1}-{startIndex + 20}</div>
                      </header>
                      <div className="flex-grow overflow-y-auto p-4 scrollbar-hide">
                        <ConversationDisplay messages={refinedMessages} fileName={file?.name || "payload.json"} selectedPrompt={null} globalOptions={{ includeCode: true, includeThoughts: options.include_thoughts }} />
                      </div>
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-8 border-t border-matrix/20 bg-matrix/5 backdrop-blur-md">
                        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                          <div className="space-y-4 text-left">
                            <h2 className="text-3xl font-black italic tracking-tighter text-matrix uppercase">Refined_Payload_Ready</h2>
                            <div className="bg-void border border-matrix/20 p-4 rounded shadow-inner">
                              <p className="text-[11px] text-matrix/60 font-bold uppercase tracking-widest leading-loose">
                                BATCH_SUCCESS: {startIndex + 1} TO {startIndex + 20}<br />
                                TOTAL_CAPACITY: {batchRanges.length * 20}+ CHATS DETECTED.<br />
                                <span className="text-voltage mt-1 block">PROTOCOL: SELECT BATCH {Math.floor(startIndex / 20) + 2} IN COMMAND_DECK.</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-4 min-w-[300px]">
                            <button onClick={executePayloadDownload}
                              className="py-6 bg-matrix text-void font-black text-xl tracking-[0.5em] uppercase hover:bg-[#00FF41] shadow-[0_0_30px_rgba(0,255,65,0.2)] transition-all">
                              <Download className="inline-block mr-3 w-8 h-8" /> DOWNLOAD
                            </button>
                            <button onClick={resetConsole} className="text-[10px] font-black opacity-40 hover:opacity-100 uppercase tracking-[0.5em] underline underline-offset-8">INIT_NEW_MISSION</button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>

                {tetherError && <div className="fixed inset-0 z-[200] bg-void/90 flex items-center justify-center p-10"><div className="bg-hazard/20 border-2 border-hazard/40 p-12 text-hazard font-black text-2xl text-center animate-shake uppercase shadow-[0_0_100px_rgba(255,36,0,0.3)]">{tetherError}</div></div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="fixed bottom-0 w-full p-4 flex justify-between text-[8px] font-bold uppercase opacity-20 pointer-events-none">
        <div>ID: {isSiphon ? 'SILENT_SIPHON_2.1' : 'ASH_UNIT_0.1'}</div>
        <div>{mountedTime} // STOCKTON_SEC</div>
      </footer>

      {
        !isSiphon && (
          <>
            <Script
              id="monetag-in-page-push"
              strategy="lazyOnload"
              src="https://nap5k.com/tag.min.js"
              data-zone="10498610"
              onError={(e) => console.warn("MONETAG_PUSH_LOAD_FAILED")}
            />
            <Script
              id="monetag-vignette"
              strategy="lazyOnload"
              src="https://gizokraijaw.net/vignette.min.js"
              data-zone="10498617"
              onError={(e) => console.warn("MONETAG_VIGNETTE_LOAD_FAILED")}
            />
          </>
        )
      }
    </main >
  );
}

function AnalogCycle({ progress }: { progress: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="64" cy="64" r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-matrix/5"
        />
        <circle
          cx="64" cy="64" r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
          className="text-voltage shadow-[0_0_15px_#FFD700]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[8px] font-black text-matrix/40 uppercase tracking-tighter">CYCLE</span>
        <span className="text-lg font-black text-voltage tabular-nums">{Math.ceil((progress / 100) * 15)}S</span>
      </div>
    </div>
  );
}

function TacticalIcon({ state, index, name, timer, isSiphon }: { state: any, index: number, name: string, timer: number | null, isSiphon: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-16 h-16 lg:w-20 lg:h-20 chasing-border border border-matrix/10 flex items-center justify-center shrink-0 transition-shadow duration-500 ${state === 'PROCESSING' ? (isSiphon ? 'chasing-border-active chasing-border-blue shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'chasing-border-active chasing-border-voltage shadow-[0_0_30px_rgba(255,215,0,0.3)]') : state === 'COMPLETE' ? (isSiphon ? 'chasing-border-active chasing-border-blue shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'chasing-border-active shadow-[0_0_30px_rgba(0,255,65,0.1)]') : 'opacity-10'}`}
      >
        <div className="inner-icon flex items-center justify-center relative bg-void overflow-hidden">
          {state === 'PROCESSING' && (
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-voltage/20 to-transparent z-10 pointer-events-none"
            />
          )}

          <FileJson className={`w-8 h-8 lg:w-10 lg:h-10 ${state === 'COMPLETE' ? (isSiphon ? 'text-blue-500' : 'text-matrix') : state === 'PROCESSING' ? (isSiphon ? 'text-blue-400' : 'text-voltage') : (isSiphon ? 'text-slate-800' : 'text-matrix/20')}`} />

          {state === 'COMPLETE' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-matrix/20 flex items-center justify-center">
              <CheckCircle2 className={`w-8 h-8 lg:w-10 lg:h-10 ${isSiphon ? 'text-blue-500 shadow-[0_0_15px_#2563eb]' : 'text-matrix shadow-[0_0_15px_#00FF41]'} rounded-full`} />
            </motion.div>
          )}

          {state === 'PROCESSING' && timer !== null && (
            <div className="absolute inset-x-2 bottom-2 h-1.5 bg-void border border-matrix/20 overflow-hidden z-20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((15 - timer) / 15) * 100}%` }}
                className={`h-full ${isSiphon ? 'bg-blue-400' : 'bg-voltage shadow-[0_0_10px_#FFD700]'}`}
              />
            </div>
          )}

          {state === 'PROCESSING' && (
            <div className="absolute top-1 left-2 text-[7px] font-black uppercase tracking-tighter text-voltage z-20 animate-pulse">WELDING...</div>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col items-center justify-center overflow-hidden w-full max-w-[80px] lg:max-w-[100px]">
        <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${state === 'PROCESSING' ? (isSiphon ? 'text-blue-400' : 'text-voltage animate-pulse') : 'opacity-20'}`}>UT_{index + 1}</span>
        {state === 'COMPLETE' && name && (
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`mt-0.5 bg-matrix/5 border border-matrix/30 px-1 py-0.5 w-full text-center`}
          >
            <span className={`text-[8px] font-black ${isSiphon ? 'text-blue-300' : 'text-matrix'} truncate block tracking-tighter`}>
              {name.toUpperCase()}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}