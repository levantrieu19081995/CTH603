"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.85, x: -32, y: 24 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, x: 32, y: 24 }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
