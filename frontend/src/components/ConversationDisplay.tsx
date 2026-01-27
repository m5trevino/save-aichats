import React, { useState, useEffect } from 'react';
import { Message, Prompt } from '../types';
import { formatMessageContent, ExportFormat } from '../utils/exportUtils';

interface ConversationDisplayProps {
  messages: Message[];
  fileName: string | null;
  selectedPrompt: Prompt | null;
  globalOptions: { includeCode: boolean; includeThoughts: boolean };
}

const UserMessage: React.FC<{ text: string, asciiHeader?: string }> = ({ text, asciiHeader }) => (
  <div className="col-start-1 col-end-12 md:col-start-3 rounded-lg mb-6">
    <div className="bg-sky-700 text-white p-4 rounded-xl border border-sky-600/50 shadow-lg">
      <h3 className="font-bold text-sky-200 border-b border-sky-500/50 pb-2 mb-2 text-xs uppercase tracking-widest">--- START OF USER MESSAGE ---</h3>
      {asciiHeader && (
        <pre className="font-mono text-[10px] whitespace-pre mb-4 p-2 bg-black/20 rounded border border-white/5 opacity-80 overflow-x-auto custom-scrollbar">
          {asciiHeader}
        </pre>
      )}
      <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{text.trim()}</pre>
      <h3 className="font-bold text-sky-200 border-t border-sky-500/50 pt-2 mt-2 text-xs uppercase tracking-widest text-right">--- END OF USER MESSAGE ---</h3>
    </div>
  </div>
);

const ModelMessage: React.FC<{ text: string, isThought?: boolean, asciiHeader?: string }> = ({ text, isThought, asciiHeader }) => (
  <div className="col-start-1 col-end-12 md:col-end-11 rounded-lg mb-6">
    <div className={`${isThought ? 'bg-purple-950/50 border-purple-700/50' : 'bg-slate-800 border-slate-700/50'} text-slate-200 p-4 rounded-xl shadow-lg border`}>
      <h3 className={`font-bold ${isThought ? 'text-purple-300' : 'text-slate-400'} border-b pb-2 mb-2 text-xs uppercase tracking-widest`}>
        {isThought ? '--- START OF MODEL THOUGHT ---' : '--- START OF CHATBOT MESSAGE ---'}
      </h3>
      {asciiHeader && (
        <pre className="font-mono text-[10px] whitespace-pre mb-4 p-2 bg-black/40 rounded border border-white/5 opacity-80 overflow-x-auto custom-scrollbar">
          {asciiHeader}
        </pre>
      )}
      <pre className={`whitespace-pre-wrap font-sans text-base leading-relaxed ${isThought ? 'text-purple-200/80 italic' : ''}`}>{text.trim()}</pre>
      <h3 className={`font-bold ${isThought ? 'text-purple-300' : 'text-slate-400'} border-t pt-2 mt-2 text-xs uppercase tracking-widest text-right`}>
        {isThought ? '--- END OF MODEL THOUGHT ---' : '--- END OF CHATBOT MESSAGE ---'}
      </h3>
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
    <div className="w-full max-w-4xl mx-auto flex flex-col mt-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden" style={{ maxHeight: '80vh' }}>
      <div className="p-4 border-b border-slate-700 bg-slate-800/90 flex flex-col md:flex-row justify-between items-center gap-4">
        <input
          type="text"
          value={exportTitle}
          onChange={(e) => setExportTitle(e.target.value)}
          className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs"
        />
        <div className="flex gap-2">
          {(['json', 'md', 'txt', 'html', 'nexus'] as ExportFormat[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => handleDownload(fmt)}
              className="px-4 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-700 rounded-lg hover:text-white hover:border-sky-500 transition-all uppercase"
            >
              .{fmt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-grow p-6 overflow-y-auto bg-slate-900/40">
        <div className="grid grid-cols-12">
          {visibleMessages.map((msg, index) => (
            msg.role === 'user' ? (
              <UserMessage key={index} text={msg.text} asciiHeader={msg.ascii_header} />
            ) : (
              <ModelMessage key={index} text={msg.text} isThought={msg.isThought} asciiHeader={msg.ascii_header} />
            )
          ))}
        </div>
      </div>
    </div>
  );
};
