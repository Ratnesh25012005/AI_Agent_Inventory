"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, 
  Plus, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Layers,
  UploadCloud,
  Download
} from "lucide-react";
import { api } from "@/lib/api";
import { DarkPageHeader } from "@/components/ui/DarkPageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";

export default function DatasetsListPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchDatasets = () => {
    api.getDatasets()
      .then((data) => {
        setDatasets(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleLoadSample = async () => {
    setSeeding(true);
    try {
      const sample = await api.createSampleDataset();
      if (sample?.id) {
        localStorage.setItem("active_dataset_id", sample.id);
        window.dispatchEvent(new Event("datasetChanged"));
        window.location.href = `/dashboard`;
      } else {
        fetchDatasets();
      }
    } catch (e) {
      console.error("Failed to load sample dataset:", e);
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <DarkPageHeader
        title="Facility Data Sources"
        description="Dark store dataset connections, DuckDB schemas, data quality metrics, and ML model synchronization."
        actions={
          <div className="flex items-center gap-2">
            <a href="/darkstore_inventory_demo.csv" download="darkstore_inventory_demo.csv" className="dk-btn-ghost">
              <Download className="h-3.5 w-3.5" /> Download Demo CSV
            </a>
            <Link href="/datasets/new">
              <button className="dk-btn-primary">
                <Plus className="h-3.5 w-3.5" /> New Dataset
              </button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={<Database className="h-10 w-10 text-slate-500" />}
          title="No Datasets Connected"
          description="Upload CSV or Parquet files from your ERP or WMS to initialize decision intelligence, or use our demo dataset."
          action={
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-2">
              <Link href="/datasets/new"><button className="dk-btn-primary">Create First Dataset</button></Link>
              <a href="/darkstore_inventory_demo.csv" download><button className="dk-btn-ghost"><Download className="h-3.5 w-3.5" /> Demo CSV</button></a>
              <button className="dk-btn-ghost" onClick={handleLoadSample} disabled={seeding}>
                <Sparkles className="h-3.5 w-3.5" /> {seeding ? "Loading..." : "1-Click Sample Store"}
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map((ds) => (
            <div key={ds.id} className="dark-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-base">{ds.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{ds.description || "Quick-commerce dark store"}</p>
                  </div>
                  <Badge variant={ds.status === "analyzed" ? "success" : "info"}>{ds.status}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-3 rounded-xl mb-4" style={{ background: "rgba(30,41,59,0.5)", border: "1px solid rgba(148,163,184,0.07)" }}>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">Quality</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{ds.quality_score ? `${ds.quality_score}/100` : "--"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">Files</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{ds.files?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-slate-600">Rows</div>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">{Object.values(ds.row_counts || {}).reduce((a: any, b: any) => a + Number(b), 0).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider mb-2">Capabilities:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(ds.capabilities || ["Inventory", "Demand Forecasting", "Replenishment"]).map((c: string, ci: number) => (
                      <span key={ci} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>
                        <CheckCircle2 className="h-3 w-3" />
                        {c.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(148,163,184,0.07)" }}>
                <Link href={`/datasets/${ds.id}/upload`} className="text-[11px] text-slate-500 hover:text-slate-300 font-medium transition-colors">
                  Upload Files
                </Link>
                <button
                  className="dk-btn-primary"
                  onClick={() => {
                    localStorage.setItem("active_dataset_id", ds.id);
                    window.dispatchEvent(new Event("datasetChanged"));
                    window.location.href = `/dashboard`;
                  }}
                >
                  Select Facility <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
