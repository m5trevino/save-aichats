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
        className="w-full bg-hazard/10 border-b border-hazard/20 px-4 py-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-hazard animate-pulse" />
          <span className="text-[10px] md:text-xs font-bold text-hazard uppercase tracking-tighter">
            OMERTA_PROTOCOL ACTIVE: ALL PROCESSING IS STATELESS. DATA IS PURGED UPON EXTRACTION.
          </span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-hazard/40 hover:text-hazard transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
