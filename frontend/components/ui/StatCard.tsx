"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { clsx } from "clsx";

export interface StatCardProps {
  label: string;
  value: string | number;
  supportingText?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  variant?: "default" | "critical" | "warning" | "success";
}

const accentMap = {
  default:  { bar: "#6366f1", glow: "rgba(99,102,241,0.15)",  iconBg: "rgba(99,102,241,0.08)",  iconColor: "#6366f1" },
  success:  { bar: "#10b981", glow: "rgba(16,185,129,0.15)",  iconBg: "rgba(16,185,129,0.08)",  iconColor: "#10b981" },
  warning:  { bar: "#f59e0b", glow: "rgba(245,158,11,0.15)",  iconBg: "rgba(245,158,11,0.08)",  iconColor: "#f59e0b" },
  critical: { bar: "#ef4444", glow: "rgba(239,68,68,0.15)",   iconBg: "rgba(239,68,68,0.08)",   iconColor: "#ef4444" },
};

export function StatCard({
  label,
  value,
  supportingText,
  trend,
  icon,
  variant = "default",
}: StatCardProps) {
  const accent = accentMap[variant];

  const trendColors = trend?.isNeutral
    ? { bg: "rgba(100,116,139,0.1)", text: "#94a3b8" }
    : trend?.isPositive
    ? { bg: "rgba(16,185,129,0.1)", text: "#10b981" }
    : { bg: "rgba(239,68,68,0.1)", text: "#ef4444" };

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 transition-all duration-200 group"
      style={{
        background: "rgba(15,23,42,0.97)",
        border: "1px solid rgba(148,163,184,0.08)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {/* Subtle top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: accent.bar }}
      />

      {/* Ambient glow behind icon */}
      <div
        className="absolute top-4 right-4 h-16 w-16 rounded-full blur-xl pointer-events-none"
        style={{ background: accent.glow }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between relative z-10">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
          {label}
        </span>
        {icon && (
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: accent.iconBg, color: accent.iconColor }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4 relative z-10">
        <div className="text-[28px] font-bold tracking-tight text-white leading-none">
          {value}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: trendColors.bg, color: trendColors.text }}
            >
              {trend.isNeutral ? (
                <Minus className="h-2.5 w-2.5" />
              ) : trend.isPositive ? (
                <ArrowUpRight className="h-2.5 w-2.5" />
              ) : (
                <ArrowDownRight className="h-2.5 w-2.5" />
              )}
              {trend.value}
            </span>
          )}
          {supportingText && (
            <span className="text-[11px] text-slate-500 truncate">{supportingText}</span>
          )}
        </div>
      </div>
    </div>
  );
}
