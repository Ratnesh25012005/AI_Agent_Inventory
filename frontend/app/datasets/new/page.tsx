"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Warehouse, Building2, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const FACILITY_TYPES = [
  { id: "dark_store", name: "Dark Store", desc: "Quick-commerce 10-20 min fulfillment hubs", icon: Store },
  { id: "warehouse", name: "Warehouse", desc: "Regional central distribution and storage", icon: Warehouse },
  { id: "retail", name: "Retail Store", desc: "Supermarkets and storefront inventory", icon: ShoppingBag },
  { id: "dc", name: "Distribution Center", desc: "Cross-dock logistics and high-velocity transit", icon: Building2 },
];

export default function NewDatasetPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("dark_store");
  const [name, setName] = useState("Downtown Dark Store #05");
  const [description, setDescription] = useState("Quick-commerce dark store operations");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.createDataset(name, description);
      localStorage.setItem("active_dataset_id", res.id);
      router.push(`/datasets/${res.id}/upload`);
    } catch (err: any) {
      alert(err.message || "Failed to create dataset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <PageHeader
        title="Connect New Facility Dataset"
        description="Select your inventory facility type and assign a unique workspace name."
        breadcrumbs={[
          { label: "Data Sources", href: "/datasets" },
          { label: "New Facility" },
        ]}
      />

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Facility Types Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FACILITY_TYPES.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedType === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setSelectedType(f.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-blue-50/40 border-blue-600 ring-1 ring-blue-600"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{f.name}</div>
                    <div className="text-[11px] text-slate-500">{f.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Details Form */}
        <Card className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility / Dataset Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Facility Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/datasets")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Proceed to Data Upload
          </Button>
        </div>
      </form>
    </div>
  );
}
