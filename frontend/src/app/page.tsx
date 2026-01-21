"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Settings, Zap, Download, RefreshCcw,
  ShieldAlert, FileJson, CheckCircle2, Terminal,
  Layers, Lock, Unlock, Database, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { SecurityBanner } from '@/components/SecurityBanner';
import { TruncatedText } from '@/components/TruncatedText';
import { ConversationDisplay } from '@/components/ConversationDisplay';
import { Message, Prompt } from '@/types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Removed strict type check to handle extensionless files
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
    addTelemetry("[📡] ESTABLISHING_SECURE_UPLINK...");
    addTelemetry("[⚙️] INITIALIZING_REFINERY_ENGINE...");

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const strikeOptions = {
      ...options,
      base_filename: baseName
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('options_json', JSON.stringify(strikeOptions));

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://save-aichats-backend.onrender.com');

      const response = await fetch(`${API_BASE}/refine-stream`, {
        method: 'POST',
        body: formData,
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
                  addTelemetry(`[🧪] WELDED_CHAT: ${data.name.toUpperCase()}`, "success");
                  allMessages.push(...data.messages);
                  setRefinedMessages([...allMessages]);
                  setProgress(Math.round((data.index / data.total) * 100));
                } else if (data.status === 'complete') {
                  addTelemetry("[✔️] REFINERY_STRIKE_CONFIRMED", "success");
                  addTelemetry("[📦] PAYLOAD_COMPRESSED_AND_DELIVERED", "success");
                  setProgress(100);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }

      setRefinedMessages(allMessages);
      setPhase('EXTRACTION');
      setIsProcessing(false);

      // Trigger Zip download for full haul
      const zipResponse = await axios.post(`${API_BASE}/refine`, formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([zipResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WASHHOUSE_${baseName}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error: any) {
      setIsProcessing(false);
      addTelemetry(`[❌] FATAL_ERROR: ${error.message || 'STRIKE_FAILED'}`, "warn");
    }
  };

  const resetConsole = () => {
    setPhase('BREACH');
    setFile(null);
    setFileContent("");
    setProgress(0);
    setTelemetry([]);
  };

  return (
    <div className="min-h-screen bg-void flex flex-col selection:bg-matrix selection:text-void font-mono">
      <SecurityBanner />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 flex flex-col justify-center items-center">

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase glow-text italic italic-shimmer">
              THE WASHHOUSE
            </h1>
          </div>
          <p className="text-matrix/40 text-[9px] tracking-[0.5em] uppercase">
            SECURE_AI_LOG_REFINERY_UNIT // v2.1.0
          </p>
        </motion.div>

        <div className="w-full max-w-5xl bg-void/40 border border-matrix/10 backdrop-blur-xl rounded-sm shadow-[0_0_100px_rgba(0,255,65,0.03)] overflow-hidden relative">

          <AnimatePresence mode="wait">

            {/* PHASE: BREACH */}
            {phase === 'BREACH' && (
              <motion.div
                key="breach"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12"
              >
                <div
                  onDragOver={handleDragOver}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-matrix/10 hover:border-matrix/40 hover:bg-matrix/[0.01] transition-all duration-700 h-80 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden"
                >
                  <Upload className="w-12 h-12 text-matrix/20 group-hover:text-matrix group-hover:scale-110 transition-all duration-500 mb-4 animate-pulse" />
                  <p className="text-lg font-bold text-matrix/60 tracking-[0.2em] uppercase">[ INGEST_PAYLOAD ]</p>
                  <p className="text-matrix/20 text-[9px] uppercase tracking-[0.3em] mt-2">Any Format // No Extension Required</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                </div>
              </motion.div>
            )}

            {/* PHASE: CALIBRATION */}
            {phase === 'CALIBRATION' && (
              <motion.div
                key="calibration"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-8 md:p-10 space-y-8"
              >
                <div className="flex items-center justify-between border-b border-matrix/5 pb-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-matrix/5 border border-matrix/10"><FileJson className="w-6 h-6 text-matrix" /></div>
                    <div>
                      <p className="text-[9px] text-matrix/40 uppercase tracking-[0.3em]">PAYLOAD</p>
                      <p className="text-base font-bold text-matrix truncate max-w-xs">{file?.name || "Unknown_Payload"}</p>
                    </div>
                  </div>
                  <button onClick={resetConsole} className="text-[9px] font-bold text-matrix/20 hover:text-hazard transition-colors uppercase tracking-[0.2em]">[ RESET ]</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-6">
                    <h3 className="text-[9px] font-bold text-voltage uppercase tracking-[0.4em]">PARAMETERS</h3>
                    <div className="space-y-3">
                      {[
                        { id: 'include_user', label: 'USER_INPUT' },
                        { id: 'include_bot', label: 'BOT_RESPONSE' },
                        { id: 'include_thoughts', label: 'THOUGHTS' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setRefineryOptions({ ...options, [t.id]: !(options as any)[t.id] })}
                          className={`w-full flex items-center justify-between p-3 border transition-all ${(options as any)[t.id] ? 'border-matrix/40 bg-matrix/5 text-matrix' : 'border-matrix/5 bg-void text-matrix/20'}`}
                        >
                          <span className="text-[10px] font-bold tracking-widest">{t.label}</span>
                          {(options as any)[t.id] ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3 opacity-20" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[9px] font-bold text-voltage uppercase tracking-[0.4em]">PERSONA_VAULT + EXECUTION</h3>
                      <div className="flex gap-2">
                        {['md', 'txt'].map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setRefineryOptions({ ...options, output_format: fmt as any })}
                            className={`px-4 py-1.5 border text-[9px] font-bold transition-all ${options.output_format === fmt ? 'bg-matrix text-void border-matrix' : 'border-matrix/10 text-matrix/30'}`}
                          >
                            .{fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {DEFAULT_PERSONAS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setRefineryOptions({ ...options, persona_id: p.id })}
                          className={`text-left p-3 border transition-all ${options.persona_id === p.id ? 'border-matrix/60 bg-matrix/[0.03] text-matrix' : 'border-matrix/5 bg-void text-matrix/20 hover:border-matrix/20'}`}
                        >
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span>{p.name}</span>
                            {options.persona_id === p.id && <Zap className="w-3 h-3 text-voltage animate-pulse" />}
                          </div>
                          <p className="text-[9px] opacity-60 leading-tight">{p.instructions}</p>
                        </button>
                      ))}
                    </div>

                    {/* NEW: CHASING LIGHTS BUTTON NEXT TO FORMATS (UPPER RIGHT AREA) */}
                    <div className="relative p-[2px] mt-4 overflow-hidden rounded-sm group">
                      <motion.div
                        className="absolute inset-[-1000%] bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,#00FF41_50%,transparent_60%,transparent_100%)]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />
                      <button
                        onClick={initiateStrike}
                        className="relative w-full py-4 bg-void text-matrix font-black text-sm tracking-[0.5em] hover:bg-matrix/10 transition-all uppercase flex items-center justify-center gap-4"
                      >
                        CLEAN_SWEEP <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-matrix/5">
                  <h3 className="text-[9px] font-bold text-matrix/40 uppercase tracking-[0.4em]">FORENSIC_PREVIEW</h3>
                  <div className="bg-void border border-matrix/5 p-4"><TruncatedText text={fileContent} limit={300} className="text-[10px] text-matrix/20 italic leading-relaxed" /></div>
                </div>
              </motion.div>
            )}

            {/* PHASE: REFINERY & SUCCESS (The dual coolness view) */}
            {(phase === 'REFINERY' || phase === 'EXTRACTION') && (
              <motion.div
                key="telemetry-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 flex flex-col gap-8"
              >
                {/* Extraction Success Header (Shows only when extraction done) */}
                {phase === 'EXTRACTION' && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-matrix/10 border border-matrix/20 p-8 text-center space-y-4"
                  >
                    <div className="flex justify-center mb-2"><CheckCircle2 className="w-12 h-12 text-matrix animate-bounce" /></div>
                    <h2 className="text-2xl font-black text-matrix tracking-tighter uppercase glow-text italic">EXTRACTION_COMPLETE</h2>
                    <p className="text-matrix/60 text-[10px] uppercase tracking-[0.2em]">Payload refined and purged from volatile memory.</p>
                    <div className="flex justify-center gap-4 pt-2">
                      <button onClick={resetConsole} className="px-6 py-2 bg-matrix/5 border border-matrix/20 text-matrix font-bold text-[10px] tracking-widest uppercase hover:bg-matrix/10 transition-all">NEW_INGEST</button>
                      <div className="flex items-center gap-2 px-4 py-2 border border-hazard/20 bg-hazard/5 text-hazard text-[9px] font-bold uppercase"><ShieldAlert className="w-3 h-3" /> DATA_SCRUBBED</div>
                    </div>
                  </motion.div>
                )}

                {/* Always show the cool telemetry log */}
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4 text-[9px] font-bold text-matrix/40 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-3">
                      <RefreshCcw className={`w-3 h-3 ${phase === 'REFINERY' ? 'animate-spin' : ''}`} />
                      <span>{phase === 'REFINERY' ? 'REFINERY_STRIKE_ACTIVE' : 'STRIKE_LOG_ARCHIVE'}</span>
                    </div>
                    <span>STABILITY: 100%</span>
                  </div>

                  {phase === 'EXTRACTION' && refinedMessages.length > 0 ? (
                    <div className="bg-void/80 border border-matrix/5 p-6 h-[400px] overflow-y-auto custom-scrollbar">
                      <ConversationDisplay
                        messages={refinedMessages}
                        fileName={file?.name || "payload.json"}
                        selectedPrompt={null}
                        globalOptions={{ includeCode: true, includeThoughts: options.include_thoughts }}
                      />
                    </div>
                  ) : (
                    <div className="bg-void/80 border border-matrix/5 p-6 font-mono text-[10px] h-[300px] overflow-y-auto space-y-1 shadow-inner custom-scrollbar relative">
                      <div className="absolute top-4 right-6 text-4xl font-black text-matrix/5 select-none">{progress}%</div>
                      {telemetry.map((log, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="opacity-20">[{new Date().toLocaleTimeString()}]</span>
                          <p className={log.type === 'warn' ? 'text-hazard' : log.type === 'success' ? 'text-matrix glow-text' : 'text-matrix/60'}>{log.msg}</p>
                        </div>
                      ))}
                      {phase === 'REFINERY' && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2 h-4 bg-matrix/20" />}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer HUD */}
        <div className="mt-8 w-full max-w-5xl flex justify-between items-end opacity-10 font-mono text-[8px] uppercase tracking-[0.3em]">
          <div>LOC: 127.0.0.1:3000 // NODE: FLINTX</div>
          <div className="text-right italic">THE_WASHHOUSE // OMERTÀ_DISSOLUTION</div>
        </div>

      </main>
    </div>
  );
}