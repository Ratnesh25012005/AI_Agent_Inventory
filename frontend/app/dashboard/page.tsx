"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  ShoppingCart,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Bot,
  Activity,
  ArrowUpRight,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
  Area,
  Sector
} from "recharts";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/StatCard";
import { Skeleton } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useGsapContext, getGSAP } from "@/lib/gsap";

const RISK_COLORS = ["#ec4899", "#f97316", "#eab308", "#06b6d4"];

const renderCustomShape = (props: any) => {
  const { cx, cy, innerRadius, startAngle, endAngle, fill, payload } = props;
  
  let customOuterRadius = 70;
  if (payload.name === "Critical") customOuterRadius = 92;
  else if (payload.name === "High") customOuterRadius = 82;
  else if (payload.name === "Medium") customOuterRadius = 74;
  else if (payload.name === "Low") customOuterRadius = 66;

  const RADIAN = Math.PI / 180;
  const midAngle = startAngle + (endAngle - startAngle) / 2;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const dotRadius = customOuterRadius - 10;
  const cxDot = cx + dotRadius * cos;
  const cyDot = cy + dotRadius * sin;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={customOuterRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {(payload.name === "Critical" || payload.name === "High") && (
        <g>
          <circle cx={cxDot} cy={cyDot} r={6} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
          <circle cx={cxDot} cy={cyDot} r={2.5} fill="#fff" />
        </g>
      )}
      {payload.name === "Medium" && (
        <circle cx={cxDot} cy={cyDot} r={2.5} fill="#fff" opacity={0.8} />
      )}
    </g>
  );
};

export default function OverviewDashboardPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Subtle dashboard entrance animation (Priority: Productivity)
  useGsapContext((ctx) => {
    const { gsap } = getGSAP();
    gsap.from(".dash-header", { opacity: 0, y: -10, duration: 0.35, ease: "power2.out" });
    gsap.from(".kpi-stat-card", { opacity: 0, y: 15, duration: 0.4, stagger: 0.06, ease: "power2.out" });
    gsap.from(".dash-chart-section", { opacity: 0, y: 15, duration: 0.45, delay: 0.15, ease: "power2.out" });
  }, containerRef, [containerRef]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [activeDatasetName, setActiveDatasetName] = useState<string>("");
  const [inventoryData, setInventoryData] = useState<any>({ items: [], total_skus: 0, total_inventory_value: 0 });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stockoutRisks, setStockoutRisks] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = (dsId: string) => {
    if (!dsId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getInventory(dsId).catch(() => ({ items: [], total_skus: 0, total_inventory_value: 0 })),
      api.getReplenishment(dsId).catch(() => []),
      api.getStockoutRisks(dsId).catch(() => []),
      api.getAnomalies(dsId).catch(() => []),
      api.getDataset(dsId).catch(() => null)
    ]).then(([inv, recs, risks, anoms, ds]) => {
      setInventoryData(inv || { items: [], total_skus: 0, total_inventory_value: 0 });
      setRecommendations(Array.isArray(recs) ? recs : []);
      setStockoutRisks(Array.isArray(risks) ? risks : []);
      setAnomalies(Array.isArray(anoms) ? anoms : []);
      if (ds && ds.name) setActiveDatasetName(ds.name);
      setLoading(false);
    });
  };

  useEffect(() => {
    const dsId = localStorage.getItem("active_dataset_id");
    api.getDatasets().then((list) => {
      if (list && list.length > 0) {
        const match = list.find((d: any) => d.id === dsId);
        const selected = match || list[0];
        setActiveDatasetId(selected.id);
        setActiveDatasetName(selected.name);
        localStorage.setItem("active_dataset_id", selected.id);
        loadAll(selected.id);
      } else {
        setActiveDatasetId("");
        setActiveDatasetName("");
        localStorage.removeItem("active_dataset_id");
        setLoading(false);
      }
    }).catch(() => {
      setActiveDatasetId("");
      localStorage.removeItem("active_dataset_id");
      setLoading(false);
    });

    const handleDatasetChanged = () => {
      const updated = localStorage.getItem("active_dataset_id") || "";
      setActiveDatasetId(updated);
      loadAll(updated);
    };

    window.addEventListener("datasetChanged", handleDatasetChanged);
    return () => window.removeEventListener("datasetChanged", handleDatasetChanged);
  }, []);

  const criticalStockouts = stockoutRisks.filter((r) => r.risk_level === "CRITICAL").length;
  const highStockouts = stockoutRisks.filter((r) => r.risk_level === "HIGH").length;
  const pendingOrders = recommendations.filter((r) => r.recommended_order > 0).length;

  // Chart data: Top 6 Replenishment Products
  const topReplenishmentData = recommendations
    .filter((r) => r.recommended_order > 0)
    .slice(0, 6)
    .map((r) => ({
      name: r.product_name?.length > 14 ? r.product_name.slice(0, 14) + "..." : r.product_name,
      orderQty: r.recommended_order,
      stock: r.current_stock,
      demand: r.predicted_demand
    }));

  // Risk Distribution Data
  const riskDistData = [
    { name: "Critical", value: criticalStockouts },
    { name: "High", value: highStockouts },
    { name: "Medium", value: stockoutRisks.filter((r) => r.risk_level === "MEDIUM").length },
    { name: "Low", value: stockoutRisks.filter((r) => r.risk_level === "LOW").length },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  const handleLoadSample = async () => {
    setLoading(true);
    try {
      const sample = await api.createSampleDataset();
      if (sample?.id) {
        setActiveDatasetId(sample.id);
        setActiveDatasetName(sample.name);
        localStorage.setItem("active_dataset_id", sample.id);
        loadAll(sample.id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load sample dataset:", e);
      setLoading(false);
    }
  };

  if (!activeDatasetId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-4">
        <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
          <Boxes className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Your Store Workspace is Ready</h2>
        <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
          You are signed in to your personal store workspace. Connect your dark store inventory CSV or import sample quick-commerce data to explore.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/datasets/new">
            <Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>
              Connect Your Store CSV
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLoadSample} leftIcon={<Layers className="h-4 w-4" />}>
            Load Sample Store Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-7">

      {/* ── PAGE HEADER ── */}
      <div className="dash-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Facility
            </span>
            <span className="text-slate-700 text-[11px]">·</span>
            <span className="text-[11px] text-slate-500 font-medium">{activeDatasetName || "Active Dataset"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-snug">
            Inventory Decision Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400 max-w-xl leading-relaxed">
            Real-time stock health, replenishment intelligence, and depletion risk for your active facility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/copilot">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
              <Bot className="h-3.5 w-3.5 text-blue-500" />
              Ask Copilot
            </button>
          </Link>
          <Link href={`/datasets/${activeDatasetId}/recommendations`}>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Review Reorders
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">{pendingOrders}</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-stat-card">
          <StatCard
            label="Total Inventory"
            value={(inventoryData.total_inventory_units || 0).toLocaleString()}
            supportingText={`${inventoryData.total_skus || 0} SKUs`}
            trend={{ value: "Stable", isNeutral: true }}
            icon={<Boxes className="h-4 w-4" />}
          />
        </div>
        <div className="kpi-stat-card">
          <StatCard
            label="Inventory Valuation"
            value={`$${(inventoryData.total_inventory_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            supportingText="Asset value"
            trend={{ value: "+2.4% vs last cycle", isPositive: true }}
            icon={<DollarSign className="h-4 w-4" />}
            variant="success"
          />
        </div>
        <div className="kpi-stat-card">
          <StatCard
            label="Critical Depletions"
            value={criticalStockouts}
            supportingText="< 4h to stockout"
            trend={{ value: criticalStockouts > 0 ? "Immediate Action" : "Healthy", isPositive: criticalStockouts === 0 }}
            icon={<AlertTriangle className="h-4 w-4" />}
            variant={criticalStockouts > 0 ? "critical" : "default"}
          />
        </div>
        <div className="kpi-stat-card">
          <StatCard
            label="Pending Orders"
            value={pendingOrders}
            supportingText={`${recommendations.length} SKUs evaluated`}
            trend={{ value: pendingOrders > 0 ? "Needs Approval" : "Clear", isNeutral: pendingOrders === 0, isPositive: pendingOrders === 0 }}
            icon={<ShoppingCart className="h-4 w-4" />}
            variant={pendingOrders > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="dash-chart-section grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── PREMIUM DARK BAR CHART ── */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0d1535 0%, #0f172a 60%, #10183a 100%)",
            border: "1px solid rgba(99,102,241,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header row */}
          <div className="px-5 pt-5 pb-3 flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-slate-100 tracking-tight">Reorder / Demand Forecast</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-600/80 text-white">Reorder Qty</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300">Predicted Demand</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Reorder</p>
                <p className="text-xl font-bold text-cyan-400 mt-0.5">
                  {topReplenishmentData.reduce((s, d) => s + (d.orderQty || 0), 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Avg Stock</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">
                  {topReplenishmentData.length > 0
                    ? Math.round(topReplenishmentData.reduce((s, d) => s + (d.stock || 0), 0) / topReplenishmentData.length).toLocaleString()
                    : 0}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Coverage</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {topReplenishmentData.length > 0
                    ? Math.round((topReplenishmentData.filter(d => d.stock > 0).length / topReplenishmentData.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="px-2 pb-5">
            <div className="h-64 w-full">
              {topReplenishmentData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  All inventory healthy — no replenishments required.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={topReplenishmentData} barGap={2} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="barGradHighlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.08)" />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(148,163,184,0.4)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis
                      stroke="rgba(148,163,184,0.4)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#64748b" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(99,102,241,0.06)" }}
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.96)",
                        borderColor: "rgba(99,102,241,0.2)",
                        borderRadius: "10px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                        fontSize: "12px",
                        color: "#cbd5e1",
                        backdropFilter: "blur(8px)",
                      }}
                      labelStyle={{ color: "#64748b", marginBottom: 6, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}
                      itemStyle={{ color: "#cbd5e1" }}
                    />
                    <Bar
                      dataKey="orderQty"
                      name="Recommended Reorder"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={36}
                      color="#818cf8"
                    >
                      {topReplenishmentData.map((entry, index) => {
                        const maxQty = Math.max(...topReplenishmentData.map(d => d.orderQty));
                        return (
                          <Cell
                            key={`bar-${index}`}
                            fill={entry.orderQty === maxQty ? "url(#barGradHighlight)" : "url(#barGradBlue)"}
                          />
                        );
                      })}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="demand"
                      name="Predicted Demand"
                      stroke="#a5b4fc"
                      strokeWidth={2}
                      color="#a5b4fc"
                      dot={{ r: 4, fill: "#a5b4fc", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#a5b4fc", stroke: "rgba(165,180,252,0.3)", strokeWidth: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Footer link */}
          <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
            <p className="text-[11px] text-slate-500">Reorder volume vs predicted demand — top {topReplenishmentData.length} SKUs</p>
            <Link
              href={`/datasets/${activeDatasetId}/recommendations`}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View Full Queue</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* ── PREMIUM DARK DONUT CHART ── */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-2"
          style={{
            background: "linear-gradient(135deg, #0d1535 0%, #0f172a 60%, #10183a 100%)",
            border: "1px solid rgba(99,102,241,0.18)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="px-5 pt-5 pb-2">
            <p className="text-base font-semibold text-slate-100 tracking-tight">Catalog Stockout Urgency</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Risk severity across active SKUs</p>
          </div>

          <div className="flex-1 flex items-center justify-center px-4 py-2 relative">
            {riskDistData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <span className="text-3xl font-bold text-white tracking-tight leading-none" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                  {riskDistData.reduce((acc, d) => acc + d.value, 0)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  Alerts
                </span>
              </div>
            )}
            <div className="h-48 w-full relative z-10">
              {riskDistData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No stockout risks detected.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {RISK_COLORS.map((color, i) => (
                        <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={riskDistData}
                      activeIndex={riskDistData.map((_, i) => i)}
                      activeShape={renderCustomShape}
                      innerRadius={46}
                      outerRadius={92}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                    >
                      {riskDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % RISK_COLORS.length})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15,23,42,0.96)",
                        borderColor: "rgba(99,102,241,0.3)",
                        borderRadius: "10px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        fontSize: "12px",
                        color: "#e2e8f0",
                        backdropFilter: "blur(8px)",
                      }}
                      itemStyle={{ color: "#cbd5e1", fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3">
            {[
              { color: "#dc2626", label: "Critical", value: criticalStockouts },
              { color: "#ea580c", label: "High", value: highStockouts },
              { color: "#d97706", label: "Medium", value: stockoutRisks.filter((r) => r.risk_level === "MEDIUM").length },
              { color: "#059669", label: "Low", value: stockoutRisks.filter((r) => r.risk_level === "LOW").length },
            ].map(({ color, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
                <span className="text-[11px] text-slate-400">{label}:</span>
                <span className="text-[11px] font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRIORITY ACTION QUEUE ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(15,23,42,0.97)",
          border: "1px solid rgba(148,163,184,0.08)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Priority Replenishment Queue</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Top AI-ranked recommendations awaiting approval</p>
            </div>
          </div>
          <Link
            href={`/datasets/${activeDatasetId}/recommendations`}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all"
          >
            Full Queue
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Cards */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((r, i) => {
            const isCritical = r.priority_level === "CRITICAL";
            const rankColors = ["#ef4444", "#f59e0b", "#6366f1"];
            const rankColor = rankColors[i] || "#6366f1";
            return (
              <div
                key={r.id || i}
                className="relative rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "rgba(30,41,59,0.6)",
                  border: "1px solid rgba(148,163,184,0.08)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {/* Left urgency strip */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                  style={{ background: rankColor }}
                />

                <div className="px-4 pt-4 pb-3 pl-5">
                  {/* Rank + priority */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: rankColor }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: rankColor }}
                      >
                        {r.priority_level}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Stock: {r.current_stock?.toFixed(0)}
                    </span>
                  </div>

                  {/* Product name */}
                  <h4 className="font-semibold text-slate-100 text-sm leading-snug">{r.product_name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{r.reason}</p>
                </div>

                {/* Footer row */}
                <div
                  className="px-5 py-3 flex items-center justify-between"
                  style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}
                >
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Reorder</span>
                    <p className="text-sm font-bold" style={{ color: rankColor }}>
                      {r.recommended_order?.toFixed(0)} units
                    </p>
                  </div>
                  <Link
                    href={`/datasets/${activeDatasetId}/recommendations`}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
                  >
                    Approve
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
