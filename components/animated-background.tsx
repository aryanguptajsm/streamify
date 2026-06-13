"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <motion.div
        aria-hidden
        animate={{ y: [0, 16, 0], x: [0, 8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-6rem] top-16 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-8rem] left-1/4 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
      />
    </div>
  );
}
