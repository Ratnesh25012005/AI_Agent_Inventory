"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  Loader2, 
  Cpu, 
  TrendingUp, 
  ShoppingCart, 
  ShieldAlert, 
  ArrowRight,
  Database,
  BarChart3
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STAGES = [
  { id: "profiling", label: "Profiling & ingesting uploaded files in DuckDB", icon: Database },
  { id: "canonical", label: "Normalizing columns to Canonical Schema", icon: Cpu },
  { id: "quality", label: "Evaluating dataset quality & capabilities", icon: CheckCircle2 },
  { id: "features", label: "Engineering sales velocity and lead-time features", icon: BarChart3 },
  { id: "forecasting", label: "Running LightGBM 24h/48h/7d demand models", icon: TrendingUp },
  { id: "anomalies", label: "Executing Isolation Forest & phantom stock checks", icon: ShieldAlert },
  { id: "stockout", label: "Predicting stockout urgency & depletion hours", icon: ShieldAlert },
  { id: "replenishment", label: "Calculating deterministic replenishment order quantities", icon: ShoppingCart },
  { id: "complete", label: "Decision engine analysis ready", icon: CheckCircle2 },
];

export default function AnalysisProgressPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params?.datasetId as string;

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [pipelineSummary, setPipelineSummary] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let stageInterval: any;

    stageInterval = setInterval(() => {
      setCurrentStageIdx((prev) => {
        if (prev < STAGES.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    api.triggerAnalysis(datasetId)
      .then((res) => {
        clearInterval(stageInterval);
        setCurrentStageIdx(STAGES.length - 1);
        setIsDone(true);
        setPipelineSummary(res);
        localStorage.setItem("active_dataset_id", datasetId);
      })
      .catch((err) => {
        clearInterval(stageInterval);
        setErrorMsg(err.message || "Analysis error occurred");
      });

    return () => clearInterval(stageInterval);
  }, [datasetId]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Processing Dark Store Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Executing high-performance DuckDB transformations, LightGBM forecasts, and Poisson replenishment
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-3">
          {STAGES.map((s, idx) => {
            const isFinished = idx < currentStageIdx || isDone;
            const isCurrent = idx === currentStageIdx && !isDone;

            return (
              <div
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-blue-50 border border-blue-200 text-blue-900"
                    : isFinished
                    ? "text-slate-800"
                    : "text-slate-400 opacity-60"
                }`}
              >
                <div className="shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <div className="text-xs font-medium">{s.label}</div>
              </div>
            );
          })}
        </div>

        {isDone && (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/datasets/${datasetId}/recommendations`)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Open Purchase Order Recommendations
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
