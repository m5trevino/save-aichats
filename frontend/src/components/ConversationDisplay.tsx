import React, { useState, useEffect } from 'react';
import { Message, Prompt } from '../types';
import { formatMessageContent, ExportFormat } from '../utils/exportUtils';
import { Terminal, Download, FileText, ChevronRight } from 'lucide-react';

interface ConversationDisplayProps {
  messages: Message[];
  fileName: string | null;
  selectedPrompt: Prompt | null;
  globalOptions: { includeCode: boolean; includeThoughts: boolean };
}

const UserMessage: React.FC<{ text: string, asciiHeader?: string }> = ({ text, asciiHeader }) => (
  <div className="col-start-1 col-end-13 mb-8">
    <div className="bg-surface-container-high border-l-4 border-on-surface-variant p-5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 border-b border-outline-variant/20 pb-2">
        <h3 className="font-black text-on-surface-variant text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
          <Terminal className="w-3 h-3" /> User_Input_Stream
        </h3>
        <span className="text-[8px] font-mono text-on-surface-variant/40">SOURCE: SESSION_LOCAL</span>
      </div>
      {asciiHeader && (
        <pre className="font-mono text-[9px] whitespace-pre mb-4 p-3 bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant/60 overflow-x-auto scrollbar-hide">
          {asciiHeader}
        </pre>
      )}
      <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed text-on-surface">{text.trim()}</pre>
    </div>
  </div>
);

const ModelMessage: React.FC<{ text: string, isThought?: boolean, asciiHeader?: string }> = ({ text, isThought, asciiHeader }) => (
  <div className="col-start-1 col-end-13 mb-8">
    <div className={`border-l-4 p-5 relative overflow-hidden ${isThought ? 'bg-surface-container-low border-secondary-fixed-dim' : 'bg-surface-container-lowest border-kinetik-lime shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]'}`}>
      <div className="scanline-overlay absolute inset-0 opacity-5 pointer-events-none"></div>
      <div className="flex justify-between items-center mb-4 border-b border-outline-variant/20 pb-2 relative z-10">
        <h3 className={`font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 ${isThought ? 'text-secondary-fixed-dim' : 'text-kinetik-lime'}`}>
          <ChevronRight className="w-3 h-3" /> {isThought ? 'Internal_Reasoning_Engine' : 'Refinery_Output_Buffer'}
        </h3>
        <span className="text-[8px] font-mono text-on-surface-variant/40 uppercase">
          {isThought ? 'STATE: THOUGHT_PROCESS' : 'STATE: VERIFIED_DATA'}
        </span>
      </div>
      {asciiHeader && (
        <pre className="font-mono text-[9px] whitespace-pre mb-4 p-3 bg-surface-container-lowest border border-outline-variant/10 text-on-surface-variant/60 overflow-x-auto scrollbar-hide relative z-10">
          {asciiHeader}
        </pre>
      )}
      <pre className={`whitespace-pre-wrap font-body text-sm leading-relaxed relative z-10 ${isThought ? 'text-on-surface-variant italic' : 'text-on-surface'}`}>
        {text.trim()}
      </pre>
    </div>
  </div>
);

export const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ messages, fileName, selectedPrompt, globalOptions }) => {
  const [exportTitle, setExportTitle] = useState('');

  useEffect(() => {
    setExportTitle(fileName || "extracted_conversation");
  }, [fileName]);

  const handleDownload = (format: ExportFormat) => {
    const content = formatMessageContent(messages, format, {
      ...globalOptions,
      exportTitle,
      selectedPrompt
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const extension = format === 'nexus' ? 'txt' : format;
    link.download = `${exportTitle}.${extension}`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const visibleMessages = messages.filter(msg => globalOptions.includeThoughts || !msg.isThought);

  return (
    <div className="w-full flex flex-col bg-surface border border-outline-variant shadow-2xl overflow-hidden h-full">
      <div className="p-4 border-b border-outline-variant bg-surface-container-high flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <FileText className="w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            value={exportTitle}
            onChange={(e) => setExportTitle(e.target.value)}
            className="flex-1 md:w-80 bg-surface-container-lowest border border-outline-variant px-3 py-2 text-on-surface font-mono text-[10px] uppercase tracking-wider focus:border-kinetik-lime focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {(['json', 'md', 'txt', 'html', 'nexus'] as ExportFormat[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleDownload(fmt)}
              className="px-3 py-1.5 text-[9px] font-black text-on-surface-variant bg-surface-container-lowest border border-outline-variant hover:text-kinetik-lime hover:border-kinetik-lime transition-all uppercase tracking-widest whitespace-nowrap"
            >
              .{fmt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto bg-surface-container-lowest micro-grid">
        <div className="max-w-4xl mx-auto grid grid-cols-12">
          {visibleMessages.length > 0 ? (
            visibleMessages.map((msg, index) => (
              msg.role === 'user' ? (
                <UserMessage key={index} text={msg.text} asciiHeader={msg.ascii_header} />
              ) : (
                <ModelMessage key={index} text={msg.text} isThought={msg.isThought} asciiHeader={msg.ascii_header} />
              )
            ))
          ) : (
            <div className="col-start-1 col-end-13 py-20 text-center">
              <div className="w-16 h-16 border-2 border-dashed border-outline-variant flex items-center justify-center mx-auto mb-4 opacity-20">
                <Terminal className="w-8 h-8 text-on-surface-variant" />
              </div>
              <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.4em] opacity-40">Awaiting_Data_Stream...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
