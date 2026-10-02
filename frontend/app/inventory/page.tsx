"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Boxes, Search, Download, Plus, AlertTriangle, CheckCircle2, Sparkles, X } from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";

export default function InventoryPage() {
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const loadData = (dsId: string) => {
    if (!dsId) { setLoading(false); return; }
    setLoading(true);
    api.getInventory(dsId)
      .then((data) => { setInventoryItems(data?.items || []); setLoading(false); })
      .catch(() => { setInventoryItems([]); setLoading(false); });
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

  const categories = Array.from(new Set(inventoryItems.map((i) => i.category || "General").filter(Boolean)));

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      (item.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || (item.category || "General") === categoryFilter;
    let matchesStatus = true;
    const stock = Number(item.current_inventory || 0);
    if (statusFilter === "OUT") matchesStatus = stock <= 0;
    else if (statusFilter === "LOW") matchesStatus = stock > 0 && stock <= 15;
    else if (statusFilter === "NORMAL") matchesStatus = stock > 15;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockBadge = (stock: number) => {
    if (stock <= 0) return <Badge variant="critical">Out of Stock</Badge>;
    if (stock <= 15) return <Badge variant="warning">Low ({stock})</Badge>;
    return <Badge variant="success">In Stock ({stock})</Badge>;
  };

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    const headers = ["Product Name", "SKU", "Category", "Current Stock", "Unit Price", "Supplier"];
    const rows = filteredItems.map((i) => [
      `"${i.product_name || ""}"`, `"${i.sku || ""}"`, `"${i.category || "General"}"`,
      i.current_inventory || 0, i.unit_price || 0, `"${i.supplier_id || "Primary"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <DarkPageHeader
        title="Inventory Catalog"
        description="On-hand inventory levels, unit valuation, categories, and SKU replenishment status."
        eyebrow={`${inventoryItems.length} Total SKUs`}
        actions={
          <>
            <button className="dk-btn-ghost" onClick={handleExportCSV} disabled={filteredItems.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <Link href="/datasets">
              <button className="dk-btn-primary">
                <Plus className="h-3.5 w-3.5" /> Ingest Data
              </button>
            </Link>
          </>
        }
      />

      {/* Filter Bar */}
      <div className="dark-card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, or category..."
              className="dark-input w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="dark-select">
              <option value="ALL">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="dark-select">
              <option value="ALL">All Statuses</option>
              <option value="NORMAL">In Stock (&gt; 15)</option>
              <option value="LOW">Low Stock (≤ 15)</option>
              <option value="OUT">Out of Stock (0)</option>
            </select>
            {(search || categoryFilter !== "ALL" || statusFilter !== "ALL") && (
              <button className="dk-btn-ghost" onClick={() => { setSearch(""); setCategoryFilter("ALL"); setStatusFilter("ALL"); }}>
                <X className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="dark-card p-6 space-y-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Boxes className="h-10 w-10 text-slate-500" />}
          title="No Inventory Items Found"
          description={search || categoryFilter !== "ALL" || statusFilter !== "ALL"
            ? "No items match your filters. Try resetting." : "No inventory ingested yet for this facility."}
          action={<Link href="/datasets"><button className="dk-btn-primary">Upload Inventory Files</button></Link>}
        />
      ) : (
        <div className="dark-card">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th className="font-mono">SKU</th>
                  <th>Category</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Valuation</th>
                  <th>Supplier</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const stock = Number(item.current_inventory || 0);
                  const price = Number(item.unit_price || 0);
                  const valuation = stock * price;
                  return (
                    <tr key={item.sku || idx} className="cursor-pointer" onClick={() => setSelectedProduct(item)}>
                      <td className="font-medium text-slate-200">{item.product_name || "Unnamed Item"}</td>
                      <td className="font-mono text-slate-400">{item.sku}</td>
                      <td className="text-slate-400">{item.category || "General"}</td>
                      <td className="text-right font-mono font-semibold text-slate-200">{stock.toLocaleString()}</td>
                      <td>{getStockBadge(stock)}</td>
                      <td className="text-right font-mono text-slate-400">${price.toFixed(2)}</td>
                      <td className="text-right font-mono font-semibold text-slate-200">
                        ${valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="text-slate-500">{item.supplier_id || "Primary"}</td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button className="dk-btn-ghost py-1 px-2 text-[11px]" onClick={() => setSelectedProduct(item)}>Details</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 flex items-center justify-between text-[11px] text-slate-500"
            style={{ borderTop: "1px solid rgba(148,163,184,0.06)" }}>
            <span>Showing {filteredItems.length} of {inventoryItems.length} products</span>
            <span>Sorted by default SKU order</span>
          </div>
        </div>
      )}

      {/* SKU Details Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)}
          title={selectedProduct.product_name}
          description={`SKU: ${selectedProduct.sku} · Category: ${selectedProduct.category || "General"}`}
          footer={<button className="dk-btn-primary" onClick={() => setSelectedProduct(null)}>Done</button>}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "On-Hand Stock", value: selectedProduct.current_inventory || 0 },
                { label: "Unit Price", value: `$${Number(selectedProduct.unit_price || 0).toFixed(2)}` },
                { label: "Asset Value", value: `$${(Number(selectedProduct.current_inventory || 0) * Number(selectedProduct.unit_price || 0)).toFixed(2)}` },
                { label: "Supplier", value: selectedProduct.supplier_id || "Primary" },
              ].map(({ label, value }) => (
                <div key={label} className="dark-stat-mini text-center items-center">
                  <div className="stat-label">{label}</div>
                  <div className="stat-value text-lg">{value}</div>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl text-xs space-y-1" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Replenishment Parameter Inspection
              </div>
              <p className="text-slate-500 leading-relaxed">
                Deterministic replenishment monitors daily sales velocity, supplier delivery lead times, and Poisson safety buffer requirements for this SKU.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
