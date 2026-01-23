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
  { id: 'forensic', name: 'FORENSIC_AUDITOR', instructions: 'Highlight security vulnerabilities, logic gaps, and edge cases.' },
  { id: 'nexus', name: 'NEXUS_INTELLIGENCE', instructions: 'Strategic Blueprint Generation. Distills chat into pure Project DNA for Spark.' }
];

const PEACOCK_ENGINE_URL = "http://localhost:3099/v1/strike";

const GhostTerminal = ({ telemetry }: { telemetry: any[] }) => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden z-0 select-none flex flex-col justify-end p-8">
    <div className="flex flex-col-reverse gap-6">
      {telemetry.slice(-100).map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-matrix whitespace-nowrap font-black tracking-widest uppercase text-9xl leading-none italic blur-[1px]"
        >
          {log.msg.replace(/\[.*?\]/g, '').replace(/[\W_]+/g, ' ').trim()}
        </motion.div>
      ))}
    </div>
  </div>
);

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
  const [showAdGate, setShowAdGate] = useState(false); // DISABLED FOR PERSONAL
  const [personality, setPersonality] = useState<'SIPHON' | 'TOLL'>('TOLL');
  // DEFAULT TO TOLL (PUBLIC)
  const [mountedTime, setMountedTime] = useState("");
  const [batchRanges, setBatchRanges] = useState<{ start: number, end: number }[]>([]);

  const [batchProgress, setBatchProgress] = useState<('IDLE' | 'PROCESSING' | 'COMPLETE')[]>(Array(20).fill('IDLE'));
  const [processedFileNames, setProcessedFileNames] = useState<string[]>(Array(20).fill(""));
  const [batchNames, setBatchNames] = useState<string[]>(Array(20).fill("AWAITING_TAG..."));
  const [currentFileTimer, setCurrentFileTimer] = useState(15);
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [uplinkKey, setUplinkKey] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerifiedOnce, setHasVerifiedOnce] = useState(false);
  const [strikeTargets, setStrikeTargets] = useState<{ path: string, skeleton: string, directives: string }[]>([]);
  const [strikeResults, setStrikeResults] = useState<Record<string, string>>({});
  const [activeStrikePath, setActiveStrikePath] = useState<string | null>(null);

  // THE HUSTLE: Active Engagement Logic
  const verifyUplink = () => {
    setIsVerifying(true);
    // Refresh the ad
    setUplinkKey(prev => prev + 1);

    setTimeout(() => {
      setIsVerifying(false);
      setHasVerifiedOnce(true);
      // Optional: Play a sound or show success toast
    }, 1500);
  };

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
        setPersonality('TOLL');
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
      const batchSize = isSiphon ? 999999 : 20; // Effectively no limit for SIPHON
      for (let i = 0; i < Math.min(count, 5000); i += batchSize) {
        ranges.push({ start: i, end: Math.min(i + batchSize, count) });
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
    setAdModalOpen(!isSiphon);

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
      if (options.persona_id === 'nexus') {
        parseEagleOutput(allMessages);
      }
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
    setStrikeTargets([]);
    setStrikeResults({});
    addTelemetry(isSiphon ? "[🧹] CACHE_CLEARED" : "[🧹] MEMORY_PURGED");
    setShowAdGate(false);
  };

  const parseEagleOutput = (messages: Message[]) => {
    const fullText = messages.map(m => m.text).join("\n");
    const targets: { path: string, skeleton: string, directives: string }[] = [];

    // Simple regex to find EOF blocks. Adjust as needed for EAGLE's specific output style.
    // Expected: cat << 'EOF' > path/to/file\n[SKELETON]\nEOF
    const eofRegex = /cat << 'EOF' > ([\w\/\.-]+)\n([\s\S]*?)\nEOF/g;
    let match;

    // Also look for DIRECTIVES section
    const directiveMatch = fullText.match(/# DIRECTIVES:?([\s\S]*?)(?=cat << 'EOF'|$)/i);
    const globalDirectives = directiveMatch ? directiveMatch[1].trim() : "No specific directives found.";

    while ((match = eofRegex.exec(fullText)) !== null) {
      targets.push({
        path: match[1],
        skeleton: match[2],
        directives: globalDirectives // For now, apply global directives to all. We could refine this to per-file if EAGLE is smarter.
      });
    }
    setStrikeTargets(targets);
  };

  const handlePeacockStrike = async (target: { path: string, skeleton: string, directives: string }) => {
    setActiveStrikePath(target.path);
    addTelemetry(`[🦅] INITIATING_OWL_STRIKE: ${target.path.toUpperCase()}`, "info");

    const owlPrompt = `
Act as OWL, code fixer. Your mission is to flesh out the following skeleton into full, production-ready code.
Follow the EAGLE DIRECTIVES exactly. Output ONLY the EOF overwrite block.

# EAGLE DIRECTIVES:
${target.directives}

# SKELETON:
cat << 'EOF' > ${target.path}
${target.skeleton}
EOF

# OUTPUT REQUIREMENT:
Provide the full code in this format:
cat << 'EOF' > ${target.path}
[FULL CODE HERE]
EOF
`.trim();

    try {
      const response = await axios.post(PEACOCK_ENGINE_URL, {
        modelId: "google/gemini-2.0-flash-001", // Default to high-cap Gemini
        prompt: owlPrompt,
        temp: 0.2 // Lower temp for code precision
      });

      const result = response.data.content || response.data.text || "STRIKE_RESULT_EMPTY";
      setStrikeResults(prev => ({ ...prev, [target.path]: result }));
      addTelemetry(`[✅] OWL_STRIKE_SUCCESS: ${target.path.toUpperCase()}`, "success");
    } catch (e) {
      addTelemetry(`[❌] OWL_STRIKE_FAILED: ${target.path.toUpperCase()}`, "warn");
    } finally {
      setActiveStrikePath(null);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-void" />;

  return (
    <main className={`min-h-screen ${isSiphon ? 'bg-slate-950 text-slate-200' : 'bg-void text-matrix'} font-mono selection:bg-matrix selection:text-void relative overflow-hidden transition-colors duration-1000 flex flex-col items-center`}>
      {!isSiphon && <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none opacity-10" />}

      <div className={`${(phase === 'REFINERY' || phase === 'EXTRACTION') ? 'w-full' : 'max-w-7xl'} w-full mx-auto px-4 py-12 relative z-10 transition-all duration-700`}>
        <header className={`mb-12 flex flex-col ${(phase === 'REFINERY' || phase === 'EXTRACTION') ? 'lg:flex-row' : 'md:flex-row'} md:items-end justify-between gap-6 border-b border-matrix/20 pb-8`}>
          <div className={`space-y-2 ${(phase === 'REFINERY' || phase === 'EXTRACTION') ? 'bg-void border-2 border-matrix/40 p-6 grow-0 shrink-0 min-w-[320px] mb-0' : ''}`}>
            {!isSiphon && <div className="text-[10px] text-matrix/40 mb-2 tracking-[0.5em] animate-pulse">[ ESTABLISHED_CONNECTION: 0xFF129 ]</div>}
            <h1 className={`text-5xl md:text-7xl font-black ${isSiphon ? 'text-blue-500' : 'text-matrix'} tracking-tighter glow-text italic`}>
              {isSiphon ? 'RefineAI' : 'save-aichats.com'}
            </h1>
            <p className={`text-xs ${isSiphon ? 'text-slate-500' : 'text-matrix/60'} tracking-[0.3em] font-bold uppercase`}>
              {isSiphon ? 'PROPRIETARY_LOG_PROCESSOR.v2' : 'OFFICIAL_LOG_REFINERY_AND_EXTRACTION_TOOL // THE_WASHHOUSE'}
            </p>
          </div>

          {(phase === 'REFINERY' || phase === 'EXTRACTION') && (
            <div className="flex-grow flex items-center justify-center border-2 border-matrix/40 bg-void p-4">
              {isSiphon ? (
                <div className="text-matrix/20 font-black uppercase tracking-widest text-xs">SIPHON_MODE: SILENT_INGEST</div>
              ) : (
                <AdBanner placeholderId={101} refreshInterval={60} />
              )}
            </div>
          )}

          {!(phase === 'REFINERY' || phase === 'EXTRACTION') && (
            <div className="flex items-center gap-6">
              {!isSiphon && <AdBanner placeholderId={103} refreshInterval={30} showSystemSponsor={false} />}
              <SecurityBanner />
              <div className={`h-12 w-[1px] ${isSiphon ? 'bg-slate-800' : 'bg-matrix/20'}`} />
              <div className="text-right">
                <div className={`text-[10px] ${isSiphon ? 'text-slate-500' : 'text-matrix/40'} tracking-widest font-black mb-1`}>{isSiphon ? 'SYSTEM_UPLINK' : 'SYSTEM_NODE'}</div>
                <div className={`text-sm ${isSiphon ? 'text-blue-500' : 'text-matrix'} font-black tabular-nums`}>{isSiphon ? 'STABLE' : 'VOID_ALPHA_0.1'}</div>
              </div>
            </div>
          )}
        </header>

        <div className={`w-full ${(phase === 'REFINERY' || phase === 'EXTRACTION') ? '' : 'max-w-7xl mx-auto'} ${isSiphon ? 'bg-slate-900/40 border-slate-800' : 'bg-void/40 border-matrix/10'} border backdrop-blur-xl rounded-sm shadow-2xl overflow-hidden relative`}>
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
                  className={`border-2 border-dashed ${isSiphon ? 'border-slate-800 bg-slate-950/50 hover:border-blue-500/50' : 'border-matrix/20 bg-matrix/5 hover:border-matrix/40'} p-16 rounded-none transition-all cursor-pointer group flex flex-col items-center justify-center gap-6 shadow-inner mb-12`}
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
              <motion.div key="telemetry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-4 relative min-h-[800px] w-full overflow-hidden bg-void p-4">

                {/* GHOST TERMINAL BACKGROUND */}
                <GhostTerminal telemetry={telemetry} />

                {/* LEFT: FILE STACK + BATCH STATUS */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
                  {/* FILE LIST */}
                  <div className="flex-grow bg-void border-2 border-matrix/40 overflow-hidden flex flex-col">
                    <div className="p-3 border-b-2 border-matrix/40 bg-matrix/5 flex justify-between items-center font-black text-[10px] tracking-[0.3em] text-matrix uppercase">
                      <span>Forensic_Stack</span>
                    </div>
                    <div className="flex-grow overflow-y-auto scrollbar-hide bg-black/40">
                      {batchNames.map((name, i) => (
                        <div key={i} className={`relative p-3 border-b border-matrix/10 transition-colors ${batchProgress[i] === 'PROCESSING' ? 'bg-voltage/5' : batchProgress[i] === 'COMPLETE' ? 'bg-matrix/10' : ''}`}>
                          {batchProgress[i] === 'PROCESSING' && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${((15 - currentFileTimer) / 15) * 100}%` }}
                              className="absolute inset-0 bg-voltage/10 z-0"
                            />
                          )}
                          <div className="relative z-10 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-black tabular-nums ${batchProgress[i] === 'COMPLETE' ? 'text-matrix' : batchProgress[i] === 'PROCESSING' ? 'text-voltage' : 'text-matrix/20'}`}>
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-tighter truncate max-w-[150px] ${batchProgress[i] === 'COMPLETE' ? 'text-matrix font-bold' : batchProgress[i] === 'PROCESSING' ? 'text-voltage animate-pulse' : 'text-matrix/40'}`}>
                                {name}
                              </span>
                            </div>
                            {batchProgress[i] === 'COMPLETE' && <CheckCircle2 className="w-3 h-3 text-matrix drop-shadow-[0_0_8px_rgba(0,255,65,0.4)]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BATCH STATUS BOX */}
                  <div className="h-[180px] bg-void border-2 border-matrix/40 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-matrix/40 tracking-[0.2em] uppercase mb-1">Batch_Progress</span>
                        <span className="text-4xl font-black text-matrix tabular-nums tracking-tighter">
                          {Math.floor((progress / 100) * 20)} / 20
                        </span>
                      </div>
                      <div className="scale-[0.5] origin-top-right">
                        <AnalogCycle progress={progress < 100 ? (15 - currentFileTimer) * (100 / 15) : 100} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {progress === 100 && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          id="collect-payload-btn"
                          onClick={async () => {
                            if ((window as any).show_monetag_vignette) {
                              (window as any).show_monetag_vignette();
                            }
                            setShowAdGate(false);
                            executePayloadDownload();
                          }}
                          className="w-full py-3 bg-matrix text-void font-black text-xs tracking-[0.4em] uppercase hover:bg-[#00FF41] transition-all border-b-4 border-matrix/50 active:border-b-0 active:translate-y-1"
                        >
                          COLLECT_STRIKE
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-between items-center text-[8px] font-black opacity-30 tracking-widest uppercase mt-2">
                      <span>Status: {progress === 100 ? 'SUCCESS' : 'ACTIVE_REFINEMENT'}</span>
                      <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-matrix' : 'bg-voltage animate-pulse'}`} />
                    </div>
                  </div>
                </div>

                {/* RIGHT: TERMINAL AREA + FOOTER AD */}
                <div className="flex-grow flex flex-col gap-4 overflow-hidden relative">
                  <AnimatePresence>
                    {adModalOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8"
                      >
                        <div className="bg-void border-2 border-matrix p-6 max-w-md w-full shadow-[0_0_50px_rgba(0,255,65,0.1)] flex flex-col items-center gap-6 relative overflow-hidden">
                          {/* BG EFFECTS */}
                          <div className="absolute inset-0 bg-matrix/5 pointer-events-none" />
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-matrix/20 animate-scanline" />

                          <div className="z-10 text-center space-y-2">
                            <h3 className="text-2xl font-black text-matrix uppercase tracking-widest drop-shadow-[0_0_10px_rgba(0,255,65,0.6)]">
                              Security Warning
                            </h3>
                            <p className="text-[10px] text-matrix/60 font-bold uppercase tracking-[0.2em]">
                              Unverified Uplink Detected
                            </p>
                          </div>

                          {/* 300x250 VIDEO CONTAINER PLACEHOLDER */}
                          <div className="w-[300px] h-[250px] bg-black border-2 border-matrix/30 shadow-inner relative flex items-center justify-center group overflow-hidden">
                            {/* SCANLINES */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 pointer-events-none background-size-[100%_2px,3px_100%]" />

                            {/* THE AD UNIT - Controlled by uplinkKey for forced refresh */}
                            <div className="w-full h-full relative z-10">
                              <AdBanner placeholderId={103} key={uplinkKey} refreshInterval={0} showSystemSponsor={false} />
                            </div>

                            {/* CORNER MARKERS */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-matrix z-20" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-matrix z-20" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-matrix z-20" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-matrix z-20" />
                          </div>

                          <div className="z-10 flex flex-col items-center gap-4 w-full">
                            <p className="text-[9px] text-matrix/40 uppercase tracking-widest text-center max-w-[280px]">
                              Establish visual confirmation of sponsor transmission to enable secure tunnel.
                            </p>

                            <button
                              onClick={verifyUplink}
                              className="group relative px-8 py-4 bg-void border border-matrix text-matrix font-black text-xs tracking-[0.3em] uppercase transition-all hover:bg-matrix hover:text-void shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:shadow-[0_0_40px_rgba(0,255,65,0.6)] active:scale-95"
                            >
                              <span className={isVerifying ? "animate-pulse" : ""}>
                                {isVerifying ? "VERIFYING_SIGNAL..." : "VERIFY_UPLINK"}
                              </span>
                              {/* Button Glitch Effect */}
                              <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            </button>

                            {hasVerifiedOnce && (
                              <button onClick={() => setAdModalOpen(false)} className="text-[9px] text-matrix/30 hover:text-matrix/80 uppercase tracking-widest underline decoration-dotted underline-offset-4">
                                Dismiss Warning (Unsafe)
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showAdGate && !isSiphon ? (
                    <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                      {/* THE TERMINAL */}
                      <div className="flex-grow relative bg-black/40 backdrop-blur-md border-2 border-matrix/40 flex flex-col overflow-hidden z-10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="p-3 border-b border-matrix/10 bg-matrix/5 flex justify-between items-center z-20">
                          <div className="text-[10px] text-matrix font-black uppercase tracking-[0.3em]">
                            Terminal_Location
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-matrix rounded-full animate-pulse shadow-[0_0_8px_#00FF41]" />
                            <span className="text-[8px] font-bold text-matrix/40 uppercase tracking-widest">Live_Feed_Active</span>
                          </div>
                        </div>

                        <div ref={logContainerRef} className="flex-grow overflow-y-auto font-mono text-base md:text-xl space-y-4 p-8 scrollbar-hide">
                          {telemetry.slice(-30).map((log, i) => (
                            <div key={i} className="flex gap-4 leading-relaxed border-l-4 border-transparent hover:border-matrix/40 pl-4 transition-all">
                              <span className="text-matrix/20 text-[10px] whitespace-nowrap pt-1 bg-void/20 px-1.5 rounded font-black">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                              <p className={`${log.type === 'warn' ? 'text-hazard font-black' : log.type === 'success' ? 'text-[#00FF41] font-bold drop-shadow-[0_0_15px_rgba(0,255,65,0.5)]' : 'text-matrix/50'}`}>
                                {log.msg.toUpperCase()}
                              </p>
                            </div>
                          ))}
                          {progress < 100 && (
                            <div className="flex items-center gap-4 pt-4">
                              <motion.div animate={{ opacity: [0, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-4 h-6 bg-matrix opacity-40 shadow-[0_0_100px_rgba(255,36,0,0.4)]" />
                              <span className="text-base text-matrix/20 animate-pulse font-black tracking-widest uppercase">Syncing...</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SYSTEM SPONSOR */}
                      {!isSiphon && (
                        <div className="h-[100px] bg-void border-2 border-matrix/40 flex items-center justify-center">
                          <AdBanner placeholderId={102} refreshInterval={30} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                      {/* Fallback display for Extraction phase when gate is closed */}
                      {phase === 'EXTRACTION' && (
                        <div className="flex-grow flex flex-col overflow-hidden bg-void border-2 border-matrix/40">
                          <header className="p-4 border-b border-matrix/10 flex justify-between items-center text-[10px] font-black opacity-30 uppercase tracking-[0.3em] bg-matrix/5">
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-matrix" /> DATA_VAULT_OPEN</div>
                            <div className="tabular-nums">STRIKE_SUCCESS // {isSiphon ? 'FULL_ARCHIVE' : `${startIndex + 1}-${startIndex + 20}`}</div>
                          </header>

                          <div className="flex-grow overflow-y-auto p-4 scrollbar-hide bg-black/20">
                            {options.persona_id === 'nexus' && strikeTargets.length > 0 ? (
                              <div className="space-y-8 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {strikeTargets.map((target, i) => (
                                    <div key={i} className={`p-6 border-2 transition-all relative group shadow-[0_0_15px_rgba(0,0,0,0.5)] ${activeStrikePath === target.path ? 'border-voltage animate-pulse' : strikeResults[target.path] ? 'border-matrix shadow-[0_0_20px_rgba(0,255,65,0.1)]' : 'border-matrix/20 bg-void/40'}`}>
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2 text-matrix/60">
                                          <FileJson className="w-4 h-4" />
                                          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{target.path.split('/').pop()}</span>
                                        </div>
                                        {strikeResults[target.path] ? <CheckCircle2 className="w-4 h-4 text-matrix" /> : activeStrikePath === target.path ? <RefreshCcw className="w-4 h-4 text-voltage animate-spin" /> : <div className="w-4 h-4 border border-matrix/20 rounded-full" />}
                                      </div>

                                      <p className="text-[9px] text-matrix/40 font-bold uppercase mb-6 truncate">{target.path}</p>

                                      <div className="space-y-3">
                                        <button
                                          onClick={() => handlePeacockStrike(target)}
                                          disabled={!!activeStrikePath}
                                          className={`w-full py-2 font-black text-[10px] tracking-[0.3em] uppercase transition-all ${strikeResults[target.path] ? 'bg-matrix text-void hover:bg-[#00FF41]' : 'border-2 border-matrix/50 text-matrix hover:bg-matrix/10'}`}
                                        >
                                          {strikeResults[target.path] ? 'RE-STRIKE' : 'INIT_STRIKE'}
                                        </button>

                                        {strikeResults[target.path] && (
                                          <button
                                            onClick={() => {
                                              const el = document.createElement('textarea');
                                              el.value = strikeResults[target.path];
                                              document.body.appendChild(el);
                                              el.select();
                                              document.execCommand('copy');
                                              document.body.removeChild(el);
                                              addTelemetry(`[📋] COPIED_OVERWRITE: ${target.path.toUpperCase()}`, "success");
                                            }}
                                            className="w-full py-2 bg-void border border-matrix/20 text-matrix/60 font-black text-[9px] tracking-[0.2em] uppercase hover:border-matrix/60 hover:text-matrix transition-all"
                                          >
                                            COPY_OVERWRITE
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {Object.keys(strikeResults).length > 0 && (
                                  <div className="mt-12 p-8 border-2 border-matrix/40 bg-void shadow-2xl">
                                    <h3 className="text-xl font-black text-matrix uppercase tracking-widest mb-6 glow-text italic">Active_Payload_Vault</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                      {Object.entries(strikeResults).map(([path, code]) => (
                                        <div key={path} className="space-y-2">
                                          <div className="flex justify-between items-center text-[10px] font-black text-matrix/40 uppercase tracking-widest">
                                            <span>{path}</span>
                                            <span className="text-matrix">OVERWRITE_BUFFER</span>
                                          </div>
                                          <pre className="p-4 bg-black border border-matrix/10 text-matrix text-xs overflow-x-auto selection:bg-matrix selection:text-void font-mono">
                                            <code>{code}</code>
                                          </pre>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <ConversationDisplay messages={refinedMessages} fileName={file?.name || "payload.json"} selectedPrompt={null} globalOptions={{ includeCode: true, includeThoughts: options.include_thoughts }} />
                            )}
                          </div>

                          <div className="p-8 border-t border-matrix/20 bg-matrix/5 backdrop-blur-md">
                            <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
                              <div className="space-y-4 text-left">
                                <h2 className="text-3xl font-black italic tracking-tighter text-matrix uppercase">Payload_Extracted</h2>
                                <div className="bg-void border border-matrix/20 p-4 rounded shadow-inner">
                                  <p className="text-[11px] text-matrix/60 font-bold uppercase tracking-widest leading-loose">
                                    {isSiphon ? 'SIPHON_MISSION: FULL_DATA_RECOVERY_SUCCESSFUL' : `BATCH_SUCCESS: ${startIndex + 1} TO ${startIndex + 20}`}<br />
                                    {isSiphon ? `TOTAL_ASSETS: ${refinedMessages.length} ENTRIES` : `TOTAL_CAPACITY: ${batchRanges.length * 20}+ CHATS DETECTED.`}<br />
                                    <span className="text-voltage mt-1 block">PROTOCOL: {options.persona_id === 'nexus' ? 'EXECUTE_OWL_STRIKES_FOR_CODE_FLESH_OUT.' : 'SELECT NEXT BATCH IN COMMAND_DECK.'}</span>
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
                          </div>
                        </div>
                      )}
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