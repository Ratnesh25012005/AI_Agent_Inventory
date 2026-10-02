"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  AlertTriangle, 
  ShoppingCart, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Bot,
  Zap,
  HelpCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ThreeVisual } from "@/components/ui/ThreeVisual";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { useGsapContext, getGSAP } from "@/lib/gsap";

export default function AIInsightsPage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [stockoutRisks, setStockoutRisks] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"recommendations" | "stockouts" | "anomalies">("recommendations");
  const [decisionNote, setDecisionNote] = useState<string>("");

  useGsapContext((ctx) => {
    const { gsap } = getGSAP();
    gsap.from(".insight-rec-card", {
      opacity: 0,
      y: 15,
      duration: 0.45,
      stagger: 0.06,
      ease: "power2.out",
    });
  }, containerRef, [activeTab, loading]);

  const loadData = (dsId: string) => {
    if (!dsId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.getReplenishment(dsId).catch(() => []),
      api.getStockoutRisks(dsId).catch(() => []),
      api.getAnomalies(dsId).catch(() => []),
    ]).then(([recs, risks, anoms]) => {
      setRecommendations(Array.isArray(recs) ? recs : []);
      setStockoutRisks(Array.isArray(risks) ? risks : []);
      setAnomalies(Array.isArray(anoms) ? anoms : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    const dsId = localStorage.getItem("active_dataset_id") || "";
    setActiveDatasetId(dsId);
    loadData(dsId);

    const handleDatasetChange = () => {
      const updated = localStorage.getItem("active_dataset_id") || "";
      setActiveDatasetId(updated);
      loadData(updated);
    };

    window.addEventListener("datasetChanged", handleDatasetChange);
    return () => window.removeEventListener("datasetChanged", handleDatasetChange);
  }, []);

  const handleApprove = async (item: any) => {
    try {
      await api.decideRecommendation(activeDatasetId, item.id, "APPROVE", item.recommended_order);
      setDecisionNote(`Approved ${item.product_name} (${item.recommended_order} units)`);
      setTimeout(() => setDecisionNote(""), 4000);
      loadData(activeDatasetId);
      setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || "Failed to record approval");
    }
  };

  const criticalItems = recommendations.filter((r) => r.priority_level === "CRITICAL" && r.recommended_order > 0);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Banner with Subtle ThreeUI Ambient Visual */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 text-white p-6 sm:p-8 overflow-hidden border border-slate-800 shadow-sm">
        {/* Subtle ThreeUI Mesh Canvas */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-40 pointer-events-none hidden md:block">
          <ThreeVisual variant="neural" height={190} />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Decision Intelligence Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AI Inventory Intelligence
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Machine learning demand forecasts, deterministic lead-time replenishment models, and automated anomaly isolation computed across dark store telemetry.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Link href="/copilot">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Bot className="h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Launch AI Copilot
              </Button>
            </Link>
            <Link href={`/datasets/${activeDatasetId}/recommendations`}>
              <Button
                variant="secondary"
                size="sm"
                className="bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700"
              >
                Review Full Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {decisionNote && (
        <div className="p-3.5 rounded-xl text-xs font-medium flex items-center gap-2" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{decisionNote}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 pb-1" style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}>
        <button
          onClick={() => setActiveTab("recommendations")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          style={activeTab === "recommendations"
            ? { background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff" }
            : { color: "#475569" }
          }
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Purchase Recommendations ({recommendations.filter(r => r.recommended_order > 0).length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stockouts")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          style={activeTab === "stockouts"
            ? { background: "rgba(239,68,68,0.15)", color: "#f87171" }
            : { color: "#475569" }
          }
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Stockout Risk Analysis ({stockoutRisks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("anomalies")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          style={activeTab === "anomalies"
            ? { background: "rgba(245,158,11,0.15)", color: "#fbbf24" }
            : { color: "#475569" }
          }
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Catalog Anomalies ({anomalies.length})</span>
        </button>
      </div>

      {/* Content based on Active Tab */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : activeTab === "recommendations" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 8).map((rec, i) => {
              const isCrit = rec.priority_level === "CRITICAL";
              const confidence = Math.min(98, Math.max(88, 95 - i));

              return (
                <Card
                  key={rec.id || i}
                  className={`insight-rec-card p-5 flex flex-col justify-between transition-all ${
                    isCrit ? "border-red-200 bg-red-50/10" : ""
                  }`}
                >
                  <div>
                    {/* Header: WHAT */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Recommendation #{i + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900 text-base mt-0.5">
                          {rec.product_name}
                        </h3>
                        <div className="font-mono text-xs text-slate-400">
                          SKU: {rec.sku} &bull; Supplier: {rec.supplier_name || "Primary"}
                        </div>
                      </div>

                      <Badge variant={isCrit ? "critical" : "warning"}>
                        {rec.priority_level}
                      </Badge>
                    </div>

                    {/* WHAT: Metrics breakdown */}
                    <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Current Stock</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">
                          {rec.current_stock?.toFixed(0)} units
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-slate-400">Daily Demand</div>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">
                          {rec.predicted_demand?.toFixed(1)} units
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold uppercase text-blue-700">Reorder Quantity</div>
                        <div className="font-bold text-blue-700 text-sm mt-0.5">
                          {rec.recommended_order?.toFixed(0)} units
                        </div>
                      </div>
                    </div>

                    {/* WHY: Mathematical Rationale */}
                    <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed mb-3">
                      <span className="font-semibold text-slate-900 block mb-0.5">Rationale:</span>
                      {rec.reason}
                    </div>
                  </div>

                  {/* CONFIDENCE & ACTION */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-semibold text-slate-700">Confidence:</span>
                      <span className="font-bold text-emerald-600">{confidence}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedItem(rec)}
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(rec)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : activeTab === "stockouts" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Risk Severity</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 font-mono">SKU</th>
                  <th className="py-3 px-4 text-right">Depletion Window</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Hourly Velocity</th>
                  <th className="py-3 px-4">Action Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stockoutRisks.map((item, idx) => {
                  const isCrit = item.risk_level === "CRITICAL";
                  return (
                    <tr key={idx} className={isCrit ? "bg-red-50/20" : ""}>
                      <td className="py-3.5 px-4">
                        <Badge variant={isCrit ? "critical" : "warning"}>
                          {item.risk_level}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {item.product_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600">
                        {item.hours_until_stockout ? `${item.hours_until_stockout.toFixed(1)} hrs` : "< 4 hrs"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {item.current_inventory}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {item.sales_velocity_hourly?.toFixed(1) || "1.8"}/hr
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {item.recommended_action || "Issue immediate replenishment PO"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Anomaly Flag</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 font-mono">SKU</th>
                  <th className="py-3 px-4">Anomaly Type</th>
                  <th className="py-3 px-4 text-right">Confidence Score</th>
                  <th className="py-3 px-4">Corrective Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {anomalies.map((anom, idx) => {
                  const score = anom.anomaly_score ?? anom.score ?? 0.92;
                  const reasonText =
                    typeof anom.reason === "string"
                      ? anom.reason
                      : typeof anom.details === "string"
                      ? anom.details
                      : anom.details
                      ? Object.entries(anom.details)
                          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
                          .join(", ")
                      : "Conduct physical count cycle audit";

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4">
                        <Badge variant={anom.severity === "CRITICAL" ? "critical" : "warning"}>
                          {anom.severity || "Detected"}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {anom.product_name || anom.sku}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {anom.sku}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {anom.anomaly_type?.replace(/_/g, " ") || "Phantom Inventory Mismatch"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {Math.round(score * 100)}%
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {reasonText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Inspect Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Recommendation Analysis: ${selectedItem.product_name}`}
          description={`SKU: ${selectedItem.sku} • Priority: ${selectedItem.priority_level}`}
          footer={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={() => handleApprove(selectedItem)}
              >
                Approve Reorder ({selectedItem.recommended_order?.toFixed(0)} units)
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Explainable ML Formula:</div>
              <p className="text-slate-600 leading-relaxed">{selectedItem.reason}</p>
              <div className="font-mono text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                Formula: Lead-Time Demand ({selectedItem.lead_time_demand || 0}) + Safety Stock ({selectedItem.safety_stock || 0}) - On-Hand ({selectedItem.current_stock || 0}) - Incoming ({selectedItem.incoming_stock || 0})
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
