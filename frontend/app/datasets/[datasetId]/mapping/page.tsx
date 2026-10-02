"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SchemaMappingPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params?.datasetId as string;

  const [mappings, setMappings] = useState<any[]>([]);
  const [canonicalFields, setCanonicalFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.getMappings(datasetId)
      .then((data) => {
        setMappings(data.mappings || []);
        setCanonicalFields(data.canonical_fields || []);
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load schema mappings");
        setLoading(false);
      });
  }, [datasetId]);

  const handleFieldChange = (index: number, newField: string) => {
    setMappings((prev) => {
      const copy = [...prev];
      copy[index].canonical_field = newField;
      copy[index].confidence = "HIGH";
      copy[index].is_confirmed = true;
      return copy;
    });
  };

  const handleConfirmAndAnalyze = async () => {
    setSaving(true);
    setErrorMsg("");
    try {
      await api.confirmMappings(datasetId, mappings);
      router.push(`/datasets/${datasetId}/analysis`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to confirm mappings.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-500">
        Profiling uploaded columns and matching canonical schema...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <PageHeader
        title="Confirm Schema Mapping"
        description="Review how AI interpreted your data columns into the canonical dark store schema."
        badge={<Badge variant="info">AI Canonical Matcher</Badge>}
        breadcrumbs={[
          { label: "Data Sources", href: "/datasets" },
          { label: "Schema Mapping" },
        ]}
      />

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Source File</th>
                <th className="py-3 px-4">Uploaded Column</th>
                <th className="py-3 px-4">AI Interpretation (Canonical)</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mappings.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                    {m.filename}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {m.source_column}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={m.canonical_field}
                      onChange={(e) => handleFieldChange(idx, e.target.value)}
                      className="w-full max-w-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="unmapped">-- Ignore / Unmapped --</option>
                      {canonicalFields.map((cf) => (
                        <option key={cf.field} value={cf.field}>
                          {cf.field} ({cf.description})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        m.confidence === "HIGH"
                          ? "success"
                          : m.confidence === "MEDIUM"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {m.confidence}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="secondary"
          onClick={() => router.push(`/datasets/${datasetId}/upload`)}
        >
          Back to Upload
        </Button>
        <Button
          variant="primary"
          isLoading={saving}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          onClick={handleConfirmAndAnalyze}
        >
          Confirm & Run ML Pipeline
        </Button>
      </div>
    </div>
  );
}
