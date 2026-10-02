"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingCart, Bot } from "lucide-react";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";

interface TopbarProps {
  onToggleSidebar?: () => void;
}

/* ─── Premium day/night toggle ─────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark/light mode"
      className="relative shrink-0 select-none focus:outline-none"
      style={{ width: 64, height: 32 }}
    >
      {/* Track */}
      <span
        className="absolute inset-0 rounded-full transition-all duration-500"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#1a1a2e,#16213e)"
            : "linear-gradient(135deg,#87ceeb,#fffde7)",
          border: isDark
            ? "1.5px solid rgba(99,102,241,0.35)"
            : "1.5px solid rgba(251,191,36,0.5)",
          boxShadow: isDark
            ? "0 0 12px rgba(99,102,241,0.3), inset 0 1px 2px rgba(0,0,0,0.4)"
            : "0 0 12px rgba(251,191,36,0.4), inset 0 1px 2px rgba(0,0,0,0.1)",
        }}
      />

      {/* Sun icon (left side) */}
      <span
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
        style={{
          left: 9,
          fontSize: 13,
          opacity: isDark ? 0.35 : 1,
          filter: isDark ? "none" : "drop-shadow(0 0 4px #fbbf24)",
        }}
      >
        ☀️
      </span>

      {/* Moon icon (right side) */}
      <span
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
        style={{
          right: 8,
          fontSize: 11,
          opacity: isDark ? 1 : 0.3,
          filter: isDark ? "drop-shadow(0 0 4px #818cf8)" : "none",
        }}
      >
        🌙
      </span>

      {/* Knob */}
      <span
        className="absolute top-[3px] h-[26px] w-[26px] rounded-full transition-all duration-500 flex items-center justify-center text-[13px]"
        style={{
          left: isDark ? "calc(100% - 29px)" : "3px",
          background: isDark
            ? "radial-gradient(circle at 40% 35%, #4f46e5, #1e1b4b)"
            : "radial-gradient(circle at 40% 35%, #fde68a, #f59e0b)",
          boxShadow: isDark
            ? "0 0 10px rgba(99,102,241,0.7), 0 2px 6px rgba(0,0,0,0.5)"
            : "0 0 10px rgba(251,191,36,0.7), 0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}

/* ─── Topbar ───────────────────────────────────────────────────────── */
export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const loadData = () => {
    const dsId = localStorage.getItem("active_dataset_id") || "";
    setActiveDatasetId(dsId);
    if (dsId) {
      api.getReplenishment(dsId).then((recs) => {
        if (Array.isArray(recs)) {
          const needed = recs.filter((r) => r.recommended_order > 0).length;
          setPendingOrdersCount(needed);
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("datasetChanged", loadData);
    return () => window.removeEventListener("datasetChanged", loadData);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 transition-all duration-300"
      style={{
        background: isDark
          ? "rgba(8,13,30,0.95)"
          : "rgba(255,255,255,0.97)",
        borderBottom: isDark
          ? "1px solid rgba(148,163,184,0.08)"
          : "1px solid rgba(226,232,240,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 w-full max-w-md">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg lg:hidden transition-colors"
          style={{ color: isDark ? "#94a3b8" : "#475569" }}
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search
            className="absolute left-3 top-2.5 h-4 w-4"
            style={{ color: isDark ? "#475569" : "#94a3b8" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKUs, products, suppliers, or orders..."
            className="w-full pl-9 pr-12 py-1.5 rounded-lg text-xs transition-all focus:outline-none"
            style={{
              background: isDark ? "rgba(30,41,59,0.5)" : "#f8fafc",
              border: isDark ? "1px solid rgba(148,163,184,0.1)" : "1px solid #e2e8f0",
              color: isDark ? "#e2e8f0" : "#1e293b",
            }}
          />
          <kbd
            className="absolute right-2.5 top-2 text-[10px] rounded px-1.5 py-0.5 font-mono"
            style={{
              background: isDark ? "#1e293b" : "#fff",
              border: isDark ? "1px solid rgba(148,163,184,0.12)" : "1px solid #e2e8f0",
              color: isDark ? "#475569" : "#94a3b8",
            }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Quick actions */}
      <div className="flex items-center gap-2.5">
        {/* System Health pill */}
        <div
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: isDark ? "rgba(16,185,129,0.08)" : "#ecfdf5",
            border: isDark ? "1px solid rgba(16,185,129,0.2)" : "1px solid #d1fae5",
            color: isDark ? "#34d399" : "#059669",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Decision Engine Active</span>
        </div>

        {/* Ask Copilot */}
        <Link
          href="/copilot"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: isDark ? "rgba(30,41,59,0.6)" : "#fff",
            border: isDark ? "1px solid rgba(148,163,184,0.1)" : "1px solid #e2e8f0",
            color: isDark ? "#94a3b8" : "#475569",
          }}
        >
          <Bot className="h-3.5 w-3.5 text-blue-500" />
          <span className="hidden sm:inline">AI Copilot</span>
        </Link>

        {/* Order Queue button */}
        <Link
          href={activeDatasetId ? `/datasets/${activeDatasetId}/recommendations` : "/orders"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
          style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Order Queue</span>
          {pendingOrdersCount > 0 && (
            <span className="ml-0.5 px-1.5 rounded-full bg-white/25 text-white text-[10px] font-bold">
              {pendingOrdersCount}
            </span>
          )}
        </Link>

        {/* ── Theme Toggle ── */}
        <ThemeToggle />
      </div>
    </header>
  );
}
