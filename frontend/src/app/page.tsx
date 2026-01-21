"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Zap, Download, RefreshCcw,
  ShieldAlert, CheckCircle2, Terminal,
  Layers, Lock, Unlock, ArrowRight
} from 'lucide-react';
import axios from 'axios';
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://save-aichats-backend.onrender.com');

  const isSiphon = personality === 'SIPHON';

  // --- CONFIG: IDENTITY FETCH ---
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/config`);
        setPersonality(resp.data.personality);
      } catch (e) {
        console.error("IDENTITY_RESTORE_FAILED: Defaulting to TOLL doctrine.");
      }
    };
    fetchConfig();
  }, [API_BASE]);

  // --- TETHERING: REVENUE ENFORCEMENT ---
  React.useEffect(() => {
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

  // --- HANDLERS ---
  const addTelemetry = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
    setTelemetry(prev => [...prev, { msg, type }]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => setFileContent(event.target?.result as string || "");
      reader.readAsText(droppedFile);
      setPhase('CALIBRATION');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => setFileContent(event.target?.result as string || "");
      reader.readAsText(selectedFile);
      setPhase('CALIBRATION');
    }
  };

  const initiateStrike = async () => {
    if (!file) return;
    setPhase('REFINERY');
    setIsProcessing(true);
    setTelemetry([]);
    setProgress(0);
    setTetherError(null);
    setShowAdGate(!isSiphon);

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
      const response = await fetch(`${API_BASE}/refine-stream`, {
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
                if (data.status === 'welded') {
                  addTelemetry(isSiphon ? `[🧪] PROCESSED: ${data.name.toUpperCase()}` : `[🧪] WELDED_CHAT: ${data.name.toUpperCase()}`, "success");
                  allMessages.push(...data.messages);
                  setRefinedMessages([...allMessages]);
                  setProgress(Math.round((data.index / data.total) * 100));
                } else if (data.status === 'complete') {
                  addTelemetry(isSiphon ? "[✔️] ARCHIVAL_COMPLETE" : "[✔️] REFINERY_STRIKE_CONFIRMED", "success");
                  addTelemetry(isSiphon ? "[📦] ASSETS_PERSISTED_IN_VAULT" : "[📦] PAYLOAD_COMPRESSED_AND_DELIVERED", "success");
                  setProgress(100);
                  setShowAdGate(false);
                }
              } catch (e) { console.error("Parse error:", e); }
            }
          }
        }
      }

      setRefinedMessages(allMessages);
      setPhase('EXTRACTION');
      setIsProcessing(false);

      // Trigger Zip download
      const zipResponse = await axios.post(`${API_BASE}/refine`, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([zipResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const downloadName = isSiphon ? `refined_chat_export.zip` : `ULTRADATA_STRIKE_EXTRACT.zip`;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setIsProcessing(false);
        addTelemetry(`[❌] FATAL_ERROR: ${error.message || 'STRIKE_FAILED'}`, "warn");
      }
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

  return (
    <main className={`min-h-screen ${isSiphon ? 'bg-slate-950 text-slate-200' : 'bg-void text-matrix'} font-mono selection:bg-matrix selection:text-void relative overflow-hidden transition-colors duration-1000`}>
      {/* SCANLINE EFFECT - ONLY FOR TOLL */}
      {!isSiphon && <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-10" />}

      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-matrix/20 pb-8">
          <div className="space-y-2">
            {!isSiphon && <div className="text-[10px] text-matrix/40 mb-2 tracking-[0.5em] animate-pulse">[ ESTABLISHED_CONNECTION: 0xFF129 ]</div>}
            <h1 className={`text-5xl md:text-7xl font-black ${isSiphon ? 'text-blue-500' : 'text-matrix'} tracking-tighter glow-text italic`}>
              {isSiphon ? 'RefineAI' : 'THE_WASHHOUSE'}
            </h1>
            <p className={`text-xs ${isSiphon ? 'text-slate-500' : 'text-matrix/60'} tracking-[0.3em] font-bold uppercase`}>
              {isSiphon ? 'PROPRIETARY_LOG_PROCESSOR.v2' : 'OFFICIAL_LOG_REFINERY_AND_EXTRACTION_TOOL'}
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

        <div className={`w-full max-w-5xl mx-auto ${isSiphon ? 'bg-slate-900/40 border-slate-800' : 'bg-void/40 border-matrix/10'} border backdrop-blur-xl rounded-sm shadow-2xl overflow-hidden relative`}>
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
                  className={`border-2 border-dashed ${isSiphon ? 'border-slate-800 bg-slate-950/50 hover:border-blue-500/50' : 'border-matrix/20 bg-matrix/5 hover:border-matrix/40'} p-16 rounded-xl transition-all cursor-pointer group flex flex-col items-center justify-center gap-6`}
                >
                  <Upload className={`w-12 h-12 ${isSiphon ? 'text-blue-500' : 'text-matrix'} opacity-40 group-hover:opacity-100 transition-opacity`} />
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isSiphon ? 'text-slate-300' : 'text-matrix'}`}>{isSiphon ? 'Browse or drop log file' : 'DROP_ENCRYPTED_LOG_HERE'}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Any Format // No Extension Required</p>
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
                      <div className="flex items-center justify-between p-4 bg-void border border-matrix/5">
                        <span className="text-[10px] font-bold text-matrix/60 uppercase">STARTING_INDEX</span>
                        <input type="number" value={startIndex} onChange={(e) => setStartIndex(parseInt(e.target.value) || 0)} className="bg-void border border-matrix/20 text-matrix font-mono text-xs p-1 w-20 text-right" />
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
              <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 flex flex-col gap-8 relative min-h-[500px]">
                {showAdGate && !isSiphon && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-void/90 backdrop-blur-md p-8">
                    <AdBanner />
                    <div className="mt-8 flex flex-col items-center gap-4 p-8 bg-voltage/5 border border-voltage/20 rounded-lg max-w-xl text-center">
                      <p className="text-[10px] text-voltage font-black uppercase tracking-[0.5em]">SYSTEM_COOLDOWN_ACTIVE</p>
                      <a href="https://www.effectivegatecpm.com/hxdn4yhu7?key=53269311ad498a3a6bdf8959b9254348" target="_blank" rel="noopener noreferrer" className="px-12 py-4 bg-voltage text-void font-black text-sm tracking-[0.2em] uppercase hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_50px_rgba(255,215,0,0.2)]">SUPPORT_MISSION</a>
                      <p className="text-[10px] text-matrix/40 italic mt-2">authentication required via sponsor gateway to reveal payload.</p>
                    </div>
                  </motion.div>
                )}

                {tetherError && <div className="bg-hazard/20 border border-hazard/40 p-4 text-hazard font-black text-xs text-center animate-shake uppercase">{tetherError}</div>}

                {phase === 'EXTRACTION' && (
                  <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`p-8 text-center space-y-6 border ${isSiphon ? 'border-blue-500/30' : 'border-matrix/20'}`}>
                    <CheckCircle2 className={`w-12 h-12 mx-auto ${isSiphon ? 'text-blue-500' : 'text-matrix'}`} />
                    <h2 className={`text-2xl font-black italic tracking-tighter ${isSiphon ? 'text-blue-500' : 'text-matrix'}`}>{isSiphon ? 'ARCHIVAL_READY' : 'EXTRACTION_COMPLETE'}</h2>
                    <div className="flex flex-col gap-4 max-w-md mx-auto pt-4">
                      <button onClick={() => window.location.href = `${API_BASE}/refine?options_json=${encodeURIComponent(JSON.stringify({ ...options, base_filename: file?.name.replace(/\.[^/.]+$/, "") }))}&start_index=${startIndex}`}
                        className={`py-6 text-xl font-black tracking-[0.4em] uppercase shadow-2xl transition-all ${isSiphon ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-matrix text-void hover:opacity-90'}`}>
                        <Download className="inline-block mr-4 w-8 h-8" /> DOWNLOAD
                      </button>
                      <button onClick={resetConsole} className="text-xs font-bold opacity-40 hover:opacity-100 uppercase tracking-widest underline decoration-2 underline-offset-8">READY_FOR_NEW_TASK</button>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col flex-grow">
                  <header className="flex justify-between items-center mb-4 text-[9px] font-black opacity-40 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2"><RefreshCcw className={`w-3 h-3 ${phase === 'REFINERY' ? 'animate-spin' : ''}`} /> {phase === 'REFINERY' ? 'PROCESSING' : 'IDLE'}</div>
                    <div className="tabular-nums">{progress}% // 0xAF2</div>
                  </header>

                  <div className={`p-6 border h-[400px] overflow-y-auto relative ${isSiphon ? 'bg-slate-950/50 border-slate-900' : 'bg-void/50 border-matrix/10'}`}>
                    {refinedMessages.length > 0 && phase === 'EXTRACTION' ? (
                      <ConversationDisplay messages={refinedMessages} fileName={file?.name || "payload.json"} selectedPrompt={null} globalOptions={{ includeCode: true, includeThoughts: options.include_thoughts }} />
                    ) : (
                      <div className="space-y-1 font-mono text-[9px]">
                        {telemetry.map((log, i) => (
                          <div key={i} className="flex gap-4">
                            <span className="opacity-20">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                            <p className={log.type === 'warn' ? 'text-hazard' : log.type === 'success' ? (isSiphon ? 'text-blue-400' : 'text-matrix font-bold') : 'opacity-60'}>{log.msg}</p>
                          </div>
                        ))}
                        {phase === 'REFINERY' && <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className={`w-2 h-3 ${isSiphon ? 'bg-blue-500' : 'bg-matrix'} opacity-20`} />}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="fixed bottom-0 w-full p-4 flex justify-between text-[8px] font-bold uppercase opacity-20 pointer-events-none">
        <div>ID: {isSiphon ? 'SILENT_SIPHON_2.1' : 'ASH_UNIT_0.1'}</div>
        <div>{new Date().toISOString()} // STOCKTON_SEC</div>
      </footer>
    </main>
  );
}