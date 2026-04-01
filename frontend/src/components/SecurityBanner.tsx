"use client";

import { ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function SecurityBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="w-full bg-error-container/10 border-b border-error/20 px-4 py-2 flex items-center justify-between z-[60]"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-error animate-pulse" />
          <span className="text-[9px] md:text-[10px] font-black text-error uppercase tracking-[0.2em] font-mono">
            Omerta_Protocol Active: Stateless_Processing // Data_Purge_On_Exit
          </span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-error/40 hover:text-error transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
