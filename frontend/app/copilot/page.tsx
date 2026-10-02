"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  Database,
  Loader2,
  HelpCircle,
  Cpu
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CopilotPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Inventory Decision Copilot. I analyze on-hand stock levels, 24h demand forecasts, Poisson safety buffers, and vendor lead times.\n\nTry asking:\n• **\"Is Pepsi in stock or not?\"**\n• **\"How many items are out of stock?\"**\n• **\"What should I order today?\"**",
      tool_calls: []
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    "Is Pepsi in stock or not?",
    "How many items are out of stock?",
    "What products should I order today?",
    "Show me products with critical stockout risk"
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getDatasets().then((list) => {
      setDatasets(list || []);
      const storedId = localStorage.getItem("active_dataset_id");
      if (storedId && list.some((d: any) => d.id === storedId)) {
        setActiveDatasetId(storedId);
      } else if (list && list.length > 0) {
        setActiveDatasetId(list[0].id);
        localStorage.setItem("active_dataset_id", list[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleDatasetChange = (newId: string) => {
    setActiveDatasetId(newId);
    localStorage.setItem("active_dataset_id", newId);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Switched store context to **${datasets.find(d => d.id === newId)?.name || newId}**. Ready for live inventory queries.`,
        tool_calls: []
      }
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    if (!activeDatasetId) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: q },
        {
          role: "assistant",
          content: "Please select or connect a dataset first to enable live inventory reasoning.",
          tool_calls: []
        }
      ]);
      setInput("");
      return;
    }

    const userMsg = { role: "user", content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.chatWithCopilot(activeDatasetId, q, messages);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.response,
          tool_calls: res.tool_calls || []
        }
      ]);
      if (res.suggested_questions && res.suggested_questions.length > 0) {
        setSuggestedPrompts(res.suggested_questions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, an analytical error occurred: " + (err.message || "Unknown error"),
          tool_calls: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <PageHeader
        title="AI Inventory Copilot"
        description="Deterministic natural language assistant verified against live stock levels, demand models, and supplier lead times."
        badge={<Badge variant="info">Live LLM Agent</Badge>}
        actions={
          datasets.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Database className="h-3.5 w-3.5 text-blue-600" />
              <select
                value={activeDatasetId}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium outline-none cursor-pointer"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? "bg-slate-900 text-white rounded-tr-none shadow-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-card"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Collapsible Verification Steps */}
                {m.tool_calls && m.tool_calls.length > 0 && (
                  <details className="mt-3 pt-2 border-t border-slate-100 group">
                    <summary className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1.5 font-medium select-none">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Verified against DuckDB ({m.tool_calls.length} analytical checks)</span>
                      <ChevronDown className="h-3 w-3 text-slate-400 group-open:rotate-180 transition-transform ml-auto" />
                    </summary>
                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-emerald-400 text-[11px] text-slate-600">
                      {m.tool_calls.map((tc: any, tcIdx: number) => {
                        const nameMap: Record<string, string> = {
                          search_product: `Checked product catalog for '${tc.arguments?.query || ""}'`,
                          get_inventory_summary: "Queried storewide catalog & out-of-stock count",
                          get_replenishment_recommendations: "Calculated purchase order requirements",
                          get_action_queue: "Queried prioritized inventory action queue",
                          get_product_details: "Retrieved product specifications & stock level",
                          get_stockout_risk: "Analyzed stockout probabilities & depletion hours",
                          get_stockout_risks: "Analyzed stockout probabilities & depletion hours",
                          get_anomalies: "Checked for phantom inventory & count discrepancies",
                        };
                        return (
                          <div key={tcIdx} className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{nameMap[tc.tool_name] || tc.tool_name.replace(/_/g, " ")}</span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-11">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            <span>Analyzing store stock levels, demand models, and supplier records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask e.g. 'Is Pepsi in stock or not?', 'What should I order today?'..."
          className="w-full pl-4 pr-12 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 top-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
