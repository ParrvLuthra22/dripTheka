"use client";

// ToastStack — small brand-styled confirmation slips, bottom-right.
// Fed by useToastStore.push(message, tone). Self-dismissing, stackable.

import { useHydrated } from "@/lib/theka/hooks";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore, type Toast } from "@/lib/store/toast";
import { cn } from "@/lib/utils/cn";

function ToastItem({ id, message, tone }: Toast) {
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(id), 2600);
    return () => clearTimeout(t);
  }, [id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 32, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.95 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => dismiss(id)}
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.12em] px-4 py-3 border-2 border-black shadow-[3px_3px_0_0_#141518] cursor-default select-none max-w-[260px] pointer-events-auto",
        tone === "blue" ? "bg-(--blue) text-(--cream)" : "bg-(--cream) text-(--ink)"
      )}
    >
      {message}
    </motion.div>
  );
}

export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);
  const mounted = useHydrated();
  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[150] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-3rem)]"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
