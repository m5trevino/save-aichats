"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface TruncatedTextProps {
  text: string;
  limit?: number;
  className?: string;
}

export function TruncatedText({ text, limit = 200, className = "" }: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= limit) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, limit)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-[10px] font-bold text-matrix/60 hover:text-matrix flex items-center gap-1 uppercase tracking-widest transition-colors"
      >
        {isExpanded ? (
          <>COLLAPSE_INTEL <ChevronUp className="w-3 h-3" /></>
        ) : (
          <>EXPAND_INTEL <ChevronDown className="w-3 h-3" /></>
        )}
      </button>
    </div>
  );
}
