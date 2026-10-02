"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Truck, 
  Search, 
  Boxes, 
  ShoppingCart, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";

interface SupplierSummary {
  id: string;
  name: string;
  skuCount: number;
  skus: any[];
  avgLeadTime: number;
  pendingOrdersCount: number;
  totalCatalogValue: number;
}

export default function SuppliersPage() {
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummary | null>(null);

  const loadData = (dsId: string) => {
    if (!dsId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.all([
      api.getInventory(dsId).catch(() => ({ items: [] })),
      api.getReplenishment(dsId).catch(() => [])
    ]).then(([invRes, recsRes]) => {
      const items = invRes?.items || [];
      const recs = Array.isArray(recsRes) ? recsRes : [];

      // Group items by supplier
      const map: Record<string, SupplierSummary> = {};

      items.forEach((item: any) => {
        const supId = item.supplier_id || "SUP-DEFAULT";
        const matchingRec = recs.find((r) => r.sku === item.sku);
        const leadTime = matchingRec?.lead_time_days || item.lead_time_days || 2;
        const supName = matchingRec?.supplier_name || `Supplier ${supId}`;

        if (!map[supId]) {
          map[supId] = {
            id: supId,
            name: supName,
            skuCount: 0,
            skus: [],
            avgLeadTime: leadTime,
            pendingOrdersCount: 0,
            totalCatalogValue: 0,
          };
        }

        map[supId].skuCount += 1;
        map[supId].skus.push(item);
        map[supId].totalCatalogValue +=
          Number(item.current_inventory || 0) * Number(item.unit_price || 0);

        if (matchingRec && matchingRec.recommended_order > 0) {
          map[supId].pendingOrdersCount += 1;
        }
      });

      setSuppliers(Object.values(map));
      setLoading(false);
    }).catch(() => {
      setSuppliers([]);
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

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DarkPageHeader
        title="Supplier Directory"
        description="Fulfillment performance, lead times, SKU coverage, and active replenishment orders across primary vendors."
        eyebrow={`${suppliers.length} Vendors Active`}
      />

      {/* Search */}
      <div className="dark-card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name or ID..."
            className="dark-input w-full pl-9"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={<Truck className="h-10 w-10 text-slate-500" />}
          title="No Suppliers Found"
          description={search ? "No vendors match your search." : "No supplier records found in the current dataset."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="dark-card p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => setSelectedSupplier(s)}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-200 text-sm leading-snug">{s.name}</h4>
                      <span className="font-mono text-[10px] text-slate-500">{s.id}</span>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-3 rounded-xl" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(148,163,184,0.07)" }}>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">SKUs</div>
                    <div className="font-bold text-slate-200 text-sm mt-0.5">{s.skuCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">Lead</div>
                    <div className="font-bold text-slate-200 text-sm mt-0.5">{s.avgLeadTime}d</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">POs</div>
                    <div className="font-bold text-indigo-400 text-sm mt-0.5">{s.pendingOrdersCount}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px]" style={{ borderTop: "1px solid rgba(148,163,184,0.07)", paddingTop: "0.75rem" }}>
                <span className="text-slate-500">Value: ${s.totalCatalogValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                  View SKUs <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={!!selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          title={`Supplier: ${selectedSupplier.name}`}
          description={`ID: ${selectedSupplier.id} · ${selectedSupplier.skuCount} products`}
          maxWidth="xl"
          footer={
            <button className="dk-btn-primary" onClick={() => setSelectedSupplier(null)}>Done</button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Lead Time", value: `${selectedSupplier.avgLeadTime} Days` },
                { label: "Active POs", value: selectedSupplier.pendingOrdersCount, color: "#6366f1" },
                { label: "Catalog Value", value: `$${selectedSupplier.totalCatalogValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              ].map(({ label, value, color }) => (
                <div key={label} className="dark-stat-mini text-center items-center">
                  <div className="stat-label">{label}</div>
                  <div className="stat-value text-lg" style={color ? { color } : {}}>{value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(148,163,184,0.08)" }}>
              <div className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500" style={{ background: "rgba(30,41,59,0.7)", borderBottom: "1px solid rgba(148,163,184,0.07)" }}>
                Supplied Products Catalog
              </div>
              <div className="max-h-60 overflow-y-auto">
                {selectedSupplier.skus.map((skuItem: any, i: number) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(148,163,184,0.05)" }}>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{skuItem.product_name}</div>
                      <div className="font-mono text-[10px] text-slate-500">{skuItem.sku}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-slate-300">Stock: {skuItem.current_inventory}</div>
                      <div className="text-[10px] text-slate-500">${Number(skuItem.unit_price || 0).toFixed(2)}/unit</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
