"use client";

import React, { useState, useCallback, useRef } from 'react';
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

  const [batchProgress, setBatchProgress] = useState<('IDLE' | 'PROCESSING' | 'COMPLETE')[]>(Array(20).fill('IDLE'));
  const [processedFileNames, setProcessedFileNames] = useState<string[]>(Array(20).fill(""));
  const [currentFileTimer, setCurrentFileTimer] = useState(15);

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

  // --- TIMER: PER-FILE COUNTDOWN ---
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing && currentFileTimer > 0) {
      interval = setInterval(() => {
        setCurrentFileTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isProcessing, currentFileTimer]);

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

                  // Update batch progress grid
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
                        setCurrentFileTimer(15); // Reset timer for next file
                      }
                    }
                    return next;
                  });

                } else if (data.status === 'complete') {
                  addTelemetry(isSiphon ? "[✔️] ARCHIVAL_COMPLETE" : "[✔️] REFINERY_STRIKE_CONFIRMED", "success");
                  addTelemetry(isSiphon ? "[📦] ASSETS_PERSISTED_IN_VAULT" : "[📦] PAYLOAD_COMPRESSED_AND_DELIVERED", "success");
                  setProgress(100);
                  setBatchProgress(prev => prev.map(s => s === 'PROCESSING' ? 'COMPLETE' : s));
                  // We don't hide the gate yet, wait for user click
                }
              } catch (e) { console.error("Parse error:", e); }
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

  const resetConsole = () => {
    setPhase('BREACH');
    setFile(null);
    setFileContent("");
    setProgress(0);
    addTelemetry(isSiphon ? "[🧹] CACHE_CLEARED" : "[🧹] MEMORY_PURGED");
    setShowAdGate(false);
  };

  return (
    <main className={`min-h-screen ${isSiphon ? 'bg-slate-950 text-slate-200' : 'bg-void text-matrix'} font-mono selection:bg-matrix selection:text-void relative overflow-hidden transition-colors duration-1000 flex flex-col items-center`}>
      {/* SCANLINE EFFECT - ONLY FOR TOLL */}
      {!isSiphon && <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-10" />}

      {/* FLANKING GRIDS - REDESIGNED 2x5 TO PREVENT CUTOFF */}
      {(phase === 'REFINERY' || phase === 'EXTRACTION') && !isSiphon && (
        <>
          {/* LEFT FLANK (2x5 Grid) */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-4 lg:gap-8 z-0 scale-75 xl:scale-100">
            {batchProgress.slice(0, 10).map((state, i) => (
              <TacticalIcon key={i} state={state} index={i} name={processedFileNames[i]} timer={state === 'PROCESSING' ? currentFileTimer : null} isSiphon={isSiphon} />
            ))}
          </div>
          {/* RIGHT FLANK (2x5 Grid) */}
          <div className="fixed right-4 top-1/2 -translate-y-1/2 grid grid-cols-2 gap-4 lg:gap-8 z-0 scale-75 xl:scale-100">
            {batchProgress.slice(10, 20).map((state, i) => (
              <TacticalIcon key={i + 10} state={state} index={i + 10} name={processedFileNames[i + 10]} timer={state === 'PROCESSING' ? currentFileTimer : null} isSiphon={isSiphon} />
            ))}
          </div>
        </>
      )}

      <div className="max-w-7xl w-full mx-auto px-4 py-12 relative z-10 transition-all duration-700">
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-void/40 backdrop-blur-sm p-8">
                    <AdBanner />

                    <div className="mt-8 w-full max-w-2xl bg-voltage/5 border border-voltage/20 rounded-lg p-8 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(255,215,0,0.1)]">
                      <div className="text-center space-y-2">
                        <p className="text-[10px] text-voltage font-black uppercase tracking-[0.5em]">{progress === 100 ? 'MISSION_SUCCESS' : 'SYSTEM_COOLDOWN_ACTIVE'}</p>
                        <p className="text-[9px] text-matrix/40 italic uppercase tracking-widest">{progress === 100 ? 'GATE_UNLOCKED. CLOSE TO DOWNLOAD PAYLOAD.' : 'DO NOT CLOSE GATE. REFINERY STRIKE IN PROGRESS.'}</p>
                      </div>

                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="p-4 bg-void border border-matrix/20 rounded shadow-inner w-full flex justify-center">
                          <AdBanner />
                        </div>

                        <AnimatePresence>
                          {progress === 100 && (
                            <motion.button
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              id="collect-payload-btn"
                              onClick={async () => {
                                // Trigger the Monetag event if available
                                if ((window as any).show_monetag_vignette) {
                                  (window as any).show_monetag_vignette();
                                }

                                setShowAdGate(false);
                                addTelemetry("[🚀] INITIATING_FINAL_DOWNLOAD...");
                                const baseName = file?.name.replace(/\.[^/.]+$/, "") || "payload";
                                const formData = new FormData();
                                formData.append('file', file!);
                                formData.append('options_json', JSON.stringify({ ...options, base_filename: baseName }));
                                formData.append('start_index', startIndex.toString());
                                try {
                                  const zipResponse = await axios.post(`${API_BASE}/refine`, formData, { responseType: 'blob' });
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
                              }}
                              className="px-12 py-5 bg-matrix text-void font-black text-sm tracking-[0.4em] uppercase hover:bg-matrix/90 transition-all border-b-8 border-matrix/50 shadow-2xl active:border-b-0 active:translate-y-2 mt-4"
                            >
                              COLLECT_PAYLOAD
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      <p className="text-[10px] text-matrix/40 italic mt-2 text-center leading-relaxed">
                        mission sustainment provided by A-ADS. sustain the strike by maintaining visibility.<br />
                        * DO NOT CLOSE OR NAVIGATE AWAY. THE STRIKE WILL BE SEVERED.
                      </p>
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

      {/* THE HUSTLE: Monetag SmartTag Integration */}
      {!isSiphon && (
        <Script
          id="monetag-tag"
          strategy="lazyOnload"
          src="https://3nbf4.com/tag.min.js"
          data-zone="10488829"
        />
      )}
    </main>
  );
}

// --- SUB-COMPONENTS ---
function TacticalIcon({ state, index, name, timer, isSiphon }: { state: any, index: number, name: string, timer: number | null, isSiphon: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1 group">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-16 h-16 lg:w-20 lg:h-20 chasing-border border border-matrix/10 flex items-center justify-center shrink-0 transition-shadow duration-500 ${state === 'PROCESSING' ? (isSiphon ? 'chasing-border-active chasing-border-blue shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'chasing-border-active chasing-border-voltage shadow-[0_0_30px_rgba(255,215,0,0.2)]') : state === 'COMPLETE' ? (isSiphon ? 'chasing-border-active chasing-border-blue shadow-[0_0_30px_rgba(37,99,235,0.1)]' : 'chasing-border-active shadow-[0_0_30px_rgba(0,255,65,0.1)]') : 'opacity-10'}`}
      >
        <div className="inner-icon flex items-center justify-center relative bg-void overflow-hidden">
          {/* INTENSIFIED WELDING EFFECT */}
          {state === 'PROCESSING' && (
            <motion.div
              animate={{ y: ["-100%", "100%"] }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-voltage/30 to-transparent z-10 pointer-events-none"
            />
          )}
          {state === 'PROCESSING' && (
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.1, repeat: Infinity }}
              className="absolute inset-x-0 top-0 h-px bg-voltage z-20 shadow-[0_0_10px_#FFD700]"
            />
          )}

          <FileJson className={`w-8 h-8 lg:w-10 lg:h-10 ${state === 'COMPLETE' ? (isSiphon ? 'text-blue-500' : 'text-matrix') : state === 'PROCESSING' ? (isSiphon ? 'text-blue-400' : 'text-voltage') : (isSiphon ? 'text-slate-800' : 'text-matrix/20')}`} />

          {state === 'COMPLETE' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 bg-matrix/10 flex items-center justify-center">
              <CheckCircle2 className={`w-8 h-8 lg:w-10 lg:h-10 ${isSiphon ? 'text-blue-500 shadow-[0_0_15px_#2563eb]' : 'text-matrix shadow-[0_0_15px_#00FF41]'} rounded-full`} />
            </motion.div>
          )}

          {state === 'PROCESSING' && timer !== null && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-void overflow-hidden z-20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((15 - timer) / 15) * 100}%` }}
                className={`h-full ${isSiphon ? 'bg-blue-400' : 'bg-voltage shadow-[0_0_10px_#FFD700]'}`}
              />
            </div>
          )}
          {state === 'PROCESSING' && timer !== null && (
            <div className="absolute top-1 right-1 text-[8px] lg:text-[10px] font-black tabular-nums bg-void/90 px-1 text-voltage z-20 shadow-lg border border-voltage/20">{timer}S</div>
          )}
        </div>
      </motion.div>

      <div className="flex flex-col items-center justify-center overflow-hidden w-full max-w-[80px] lg:max-w-[100px]">
        <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${state === 'PROCESSING' ? (isSiphon ? 'text-blue-400' : 'text-voltage animate-pulse') : 'opacity-20'}`}>UT_{index + 1}</span>
        {state === 'COMPLETE' && name && (
          <motion.div
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`mt-0.5 bg-void border border-matrix/30 px-1 py-0.5 w-full text-center`}
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