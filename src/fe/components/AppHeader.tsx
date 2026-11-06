"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const TABS = [
  { href: "/thong-tin", label: "Thông tin đồ án", title: "Thông tin đồ án" },
  { href: "/", label: "Cấu hình mô hình", title: "Cấu hình mô hình" },
  { href: "/do-truc-tiep", label: "Chạy dò thông số", title: "Chạy dò tham số trực tiếp" },
  { href: "/du-doan", label: "Dự đoán", title: "Dự đoán nguy cơ đột quỵ" },
];

function khopTab(href: string, pathname: string): boolean {
  return pathname === href;
}

export default function AppHeader() {
  const pathname = usePathname();
  const active = TABS.find((t) => khopTab(t.href, pathname)) ?? TABS[0];

  return (
    <div className="shrink-0 bg-[var(--background)] px-6 pt-10">
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3 mb-6">
        <AnimatePresence mode="wait">
          <motion.h1
            key={active.title}
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.25 }}
            className="text-2xl font-semibold"
          >
            {active.title}
          </motion.h1>
        </AnimatePresence>

        <nav className="flex gap-1">
          {TABS.map((tab) => {
            const isActive = khopTab(tab.href, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute left-0 right-0 -bottom-[13px] h-[2px] bg-blue-600 dark:bg-blue-400"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
