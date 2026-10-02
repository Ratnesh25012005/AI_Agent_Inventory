"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart, Check, X, AlertTriangle, Sparkles,
  TrendingUp, History, Search, SlidersHorizontal, Bot, ArrowUpRight
} from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";

export default function ReplenishmentRecommendationsPage() {
  const params = useParams();
  const datasetId = params?.datasetId as string;

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [overrideQuantity, setOverrideQuantity] = useState<number>(0);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [itemToOverride, setItemToOverride] = useState<any>(null);

  const loadData = () => {
    api.getReplenishment(datasetId)
      .then((data) => { setRecommendations(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [datasetId]);

  const handleDecision = async (recId: string, action: "APPROVE" | "REJECT", qty?: number, reason?: string) => {
    try {
      await api.decideRecommendation(datasetId, recId, action, qty, reason);
      setActionSuccess(`Recorded ${action} decision successfully.`);
      setTimeout(() => setActionSuccess(""), 4000);
      loadData();
      if (selectedProduct?.id === recId) setSelectedProduct(null);
      setIsOverrideModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to record decision");
    }
  };

  const openOverrideDialog = (item: any) => {
    setItemToOverride(item);
    setOverrideQuantity(item.recommended_order || 0);
    setOverrideReason(`Adjusted by store manager for ${item.product_name}`);
    setIsOverrideModalOpen(true);
  };

  const filtered = recommendations.filter((r) => {
    const matchesPriority = filterPriority === "ALL" || r.priority_level === filterPriority;
    const matchesSearch =
      (r.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.supplier_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const criticalCount = recommendations.filter((r) => r.priority_level === "CRITICAL").length;
  const highCount = recommendations.filter((r) => r.priority_level === "HIGH").length;
  const totalRecommendedUnits = recommendations.reduce((sum, r) => sum + (r.recommended_order || 0), 0);

  const priorityColor = (level: string) => {
    if (level === "CRITICAL") return "#ef4444";
    if (level === "HIGH") return "#f59e0b";
    if (level === "MEDIUM") return "#6366f1";
    return "#10b981";
  };

  return (
    <div className="space-y-6">
      <DarkPageHeader
        title="Purchase Orders & Replenishment"
        description="Deterministic reorder queue ranked by stockout probability, lead-time velocity, and supplier constraints."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Orders & Reorders" },
        ]}
        actions={
          <>
            <Link href="/actions">
              <button className="dk-btn-ghost">
                <History className="h-3.5 w-3.5" /> Audit Log
              </button>
            </Link>
            <Link href="/copilot">
              <button className="dk-btn-ghost">
                <Bot className="h-3.5 w-3.5 text-blue-400" /> Ask Copilot
              </button>
            </Link>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical */}
        <div className="relative rounded-2xl p-5 overflow-hidden flex items-center justify-between"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "#ef4444" }} />
          <div>
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Critical Depletion</div>
            <div className="text-3xl font-bold text-red-400">{criticalCount} <span className="text-lg font-semibold">SKUs</span></div>
          </div>
          <AlertTriangle className="h-8 w-8 text-red-500 opacity-60" />
        </div>

        {/* High */}
        <div className="relative rounded-2xl p-5 overflow-hidden flex items-center justify-between"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "#f59e0b" }} />
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">High Urgency</div>
            <div className="text-3xl font-bold text-amber-400">{highCount} <span className="text-lg font-semibold">SKUs</span></div>
          </div>
          <TrendingUp className="h-8 w-8 text-amber-500 opacity-60" />
        </div>

        {/* Total units */}
        <div className="relative rounded-2xl p-5 overflow-hidden flex items-center justify-between"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "#6366f1" }} />
          <div>
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Recommended Units</div>
            <div className="text-3xl font-bold text-indigo-200">{totalRecommendedUnits.toLocaleString()} <span className="text-lg font-semibold text-indigo-400">units</span></div>
          </div>
          <ShoppingCart className="h-8 w-8 text-indigo-400 opacity-60" />
        </div>
      </div>

      {/* Success toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl text-xs font-medium flex items-center gap-2"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
          <Check className="h-4 w-4 shrink-0" />
          <span>{actionSuccess} Saved to immutable audit log.</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="dark-card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by product name, SKU, or supplier..."
              className="dark-input w-full pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((lvl) => {
              const colors: Record<string, { active: string; text: string }> = {
                ALL: { active: "linear-gradient(135deg,#4f46e5,#6366f1)", text: "#fff" },
                CRITICAL: { active: "rgba(239,68,68,0.2)", text: "#f87171" },
                HIGH: { active: "rgba(245,158,11,0.2)", text: "#fbbf24" },
                MEDIUM: { active: "rgba(99,102,241,0.2)", text: "#818cf8" },
                LOW: { active: "rgba(16,185,129,0.2)", text: "#34d399" },
              };
              const isActive = filterPriority === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setFilterPriority(lvl)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  style={isActive
                    ? { background: colors[lvl].active, color: colors[lvl].text }
                    : { color: "#475569" }
                  }
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dark-card p-6 space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10 text-slate-500" />}
          title="No Replenishment Orders Found"
          description="No recommendations match your active filter criteria."
          action={
            <button className="dk-btn-ghost" onClick={() => { setFilterPriority("ALL"); setSearch(""); }}>
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="dark-card">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Product & SKU</th>
                  <th className="text-right">On-Hand</th>
                  <th className="text-right">24H Forecast</th>
                  <th className="text-right">Pipeline</th>
                  <th className="text-right" style={{ color: "#818cf8" }}>Recommended</th>
                  <th>Supplier</th>
                  <th>Mathematical Rationale</th>
                  <th className="text-center">Status / Decision</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => {
                  const isCrit = item.priority_level === "CRITICAL";
                  const isApproved = item.status === "APPROVED";
                  const isRejected = item.status === "REJECTED";
                  const pColor = priorityColor(item.priority_level);

                  return (
                    <tr
                      key={item.id}
                      className="cursor-pointer"
                      style={isCrit ? { background: "rgba(239,68,68,0.03)" } : {}}
                      onClick={() => setSelectedProduct(item)}
                    >
                      {/* Priority badge with rank number */}
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                            style={{ background: pColor }}>
                            {item.priority_rank || idx + 1}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: pColor }}>
                            {item.priority_level}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="font-semibold text-slate-200 text-xs leading-snug">{item.product_name}</div>
                        <div className="font-mono text-slate-500 text-[10px] mt-0.5">
                          {item.sku} · {item.category || "General"}
                        </div>
                      </td>

                      <td className="text-right font-mono text-slate-300">{item.current_stock?.toFixed(0)}</td>
                      <td className="text-right font-mono text-slate-400">{item.predicted_demand?.toFixed(1)}</td>
                      <td className="text-right font-mono text-slate-500">{item.incoming_stock || 0}</td>

                      <td className="text-right font-mono font-bold" style={{ color: "#818cf8" }}>
                        {item.recommended_order?.toFixed(0)}
                      </td>

                      <td>
                        <div className="text-slate-300 text-xs">{item.supplier_name || "Primary Vendor"}</div>
                        <div className="text-[10px] text-slate-500">{item.lead_time_days || 2}d lead time</div>
                      </td>

                      <td className="text-slate-400 max-w-xs" style={{ maxWidth: 240 }}>
                        <span className="line-clamp-2 text-[11px] leading-relaxed" title={item.reason}>
                          {item.reason}
                        </span>
                      </td>

                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        {isApproved ? (
                          <Badge variant="success">Approved</Badge>
                        ) : isRejected ? (
                          <Badge variant="critical">Rejected</Badge>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90"
                              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
                              onClick={() => handleDecision(item.id, "APPROVE", item.recommended_order)}
                            >
                              Approve
                            </button>
                            <button
                              className="h-6 w-6 rounded-lg flex items-center justify-center transition-all"
                              style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}
                              onClick={() => openOverrideDialog(item)}
                              title="Modify quantity"
                            >
                              <SlidersHorizontal className="h-3 w-3" />
                            </button>
                            <button
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
                              onClick={() => handleDecision(item.id, "REJECT", 0)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 flex items-center justify-between text-[11px] text-slate-500"
            style={{ borderTop: "1px solid rgba(148,163,184,0.06)" }}>
            <span>Showing {filtered.length} recommendations</span>
            <span className="hidden sm:block font-mono">Reorder = Lead-Time Demand + Safety Stock − On-Hand − Pipeline</span>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Order Recommendation: ${selectedProduct.product_name}`}
          description={`SKU: ${selectedProduct.sku} · Store: ${selectedProduct.store_code || "Active Facility"}`}
          footer={
            <div className="flex items-center gap-2">
              <button className="dk-btn-ghost" onClick={() => setSelectedProduct(null)}>Close</button>
              <button
                className="dk-btn-ghost"
                style={{ color: "#f87171", borderColor: "rgba(239,68,68,0.2)" }}
                onClick={() => { handleDecision(selectedProduct.id, "REJECT", 0); setSelectedProduct(null); }}
              >
                Reject
              </button>
              <button
                className="dk-btn-primary"
                onClick={() => { handleDecision(selectedProduct.id, "APPROVE", selectedProduct.recommended_order); setSelectedProduct(null); }}
              >
                Approve {selectedProduct.recommended_order?.toFixed(0)} Units
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Physical Stock", value: selectedProduct.current_stock?.toFixed(0) },
                { label: "Daily Forecast", value: selectedProduct.predicted_demand?.toFixed(1) },
                { label: "Recommended", value: selectedProduct.recommended_order?.toFixed(0), accent: "#818cf8" },
              ].map(({ label, value, accent }) => (
                <div key={label} className="dark-stat-mini text-center items-center">
                  <div className="stat-label">{label}</div>
                  <div className="stat-value text-xl" style={accent ? { color: accent } : {}}>{value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl space-y-2 text-xs"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Explainable Decision Breakdown
              </div>
              <p className="text-slate-400 leading-relaxed">{selectedProduct.reason}</p>
              <div className="font-mono text-[11px] text-slate-500 pt-2" style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}>
                Calc: Lead-Time Demand ({selectedProduct.lead_time_demand || 0}) + Safety Stock ({selectedProduct.safety_stock || 0}) − On-Hand ({selectedProduct.current_stock || 0}) − Pipeline ({selectedProduct.incoming_stock || 0})
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Override Modal */}
      {isOverrideModalOpen && itemToOverride && (
        <Modal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          title={`Modify Order Quantity: ${itemToOverride.product_name}`}
          description={`AI Recommended: ${itemToOverride.recommended_order?.toFixed(0)} units`}
          footer={
            <div className="flex items-center gap-2">
              <button className="dk-btn-ghost" onClick={() => setIsOverrideModalOpen(false)}>Cancel</button>
              <button className="dk-btn-primary"
                onClick={() => handleDecision(itemToOverride.id, "APPROVE", overrideQuantity, overrideReason)}>
                Confirm {overrideQuantity} Units
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Approved Order Units
              </label>
              <input
                type="number" min="0" value={overrideQuantity}
                onChange={(e) => setOverrideQuantity(Number(e.target.value))}
                className="dark-input w-full text-lg font-bold font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Reason / Operator Audit Note
              </label>
              <input
                type="text" value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Reason for manual adjustment..."
                className="dark-input w-full"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
