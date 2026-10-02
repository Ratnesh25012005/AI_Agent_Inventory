"use client";

import React, { useState, useEffect } from "react";
import { History, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";

export default function ActionHistoryPage() {
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dsId = localStorage.getItem("active_dataset_id");
    if (dsId) {
      setActiveDatasetId(dsId);
      api.getActionHistory(dsId)
        .then((items) => { setHistory(items || []); setLoading(false); })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <DarkPageHeader
        title="Audit & Governance Log"
        description="Immutable record of purchase approvals, order rejections, and quantity overrides by human operators."
        eyebrow={`${history.length} Actions Logged`}
      />

      {loading ? (
        <div className="dark-card p-6 space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History className="h-10 w-10 text-slate-500" />}
          title="No Decisions Recorded Yet"
          description="Approve or reject replenishment orders in the Order Queue — decisions will be logged here with timestamps."
        />
      ) : (
        <div className="dark-card">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Product & SKU</th>
                  <th className="text-right">AI Recommended</th>
                  <th className="text-right">Approved Qty</th>
                  <th>Operator / Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const isApproved = h.action === "APPROVE";
                  return (
                    <tr key={h.id}>
                      <td className="font-mono text-slate-500 whitespace-nowrap">
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : "Just now"}
                      </td>
                      <td>
                        <Badge variant={isApproved ? "success" : "critical"}>
                          {isApproved ? "Approved" : "Rejected"}
                        </Badge>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-200">{h.product_name || h.sku}</div>
                        <div className="font-mono text-[11px] text-slate-500">{h.sku}</div>
                      </td>
                      <td className="text-right font-mono text-slate-400">{h.original_quantity || 0}</td>
                      <td className="text-right font-mono font-bold text-slate-200">{h.approved_quantity || 0}</td>
                      <td>
                        <div className="font-medium text-slate-300">{h.performed_by || "Human Operator"}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{h.reason}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
