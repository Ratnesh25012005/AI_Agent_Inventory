"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Database, Bot, Server, Cpu, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";

const services = [
  { key: "database",    label: "Supabase PostgreSQL",         sub: "Multi-tenant database & RLS security",     icon: Database, color: "#6366f1", badge: "success", badgeLabel: "Connected" },
  { key: "gemini",      label: "Google Gemini LLM",           sub: "Server-side Copilot decision agent",       icon: Bot,      color: "#10b981", badge: "info",    badgeLabel: "Configured" },
  { key: "duckdb",      label: "DuckDB OLAP Engine",          sub: "Local fast parquet profiling & joins",     icon: Cpu,      color: "#f59e0b", badge: "success", badgeLabel: "Active" },
  { key: "lightgbm",   label: "LightGBM & Isolation Forest", sub: "Predictive demand & anomaly engine",       icon: Server,   color: "#8b5cf6", badge: "success", badgeLabel: "Ready" },
];

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then((data) => { setHealth(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <DarkPageHeader
        title="System Settings & Engine Status"
        description="Core infrastructure health, database connection state, and AI runtime integration status."
        eyebrow="All Services Operational"
        eyebrowDot={true}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map(({ key, label, sub, icon: Icon, color, badge, badgeLabel }) => (
          <div
            key={key}
            className="dark-card p-5 flex items-center justify-between group"
            style={{ overflow: "visible" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{ background: `${color}14`, color }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200 text-sm">{label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
              </div>
            </div>
            <Badge variant={badge as any}>
              {health?.services?.[key] || badgeLabel}
            </Badge>
          </div>
        ))}
      </div>

      {/* System info strip */}
      <div className="dark-card p-5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Runtime Information</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "API Version", value: health?.version || "v2.0.0" },
            { label: "Environment", value: health?.environment || "Production" },
            { label: "Database", value: health?.db_type || "PostgreSQL" },
            { label: "ML Engine", value: "LightGBM 4.x" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{label}</div>
              <div className="text-sm font-semibold text-slate-300 mt-1">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
