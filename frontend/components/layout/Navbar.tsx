"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Boxes, 
  Sparkles, 
  Database, 
  ShoppingCart, 
  History, 
  AlertTriangle, 
  TrendingUp, 
  ShieldCheck, 
  ChevronDown,
  Plus,
  LogOut,
  Bot
} from "lucide-react";
import { api } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // Load datasets
    api.getDatasets().then((data) => {
      setDatasets(data);
      const saved = localStorage.getItem("active_dataset_id");
      if (saved && data.some((d: any) => d.id === saved)) {
        setActiveDatasetId(saved);
      } else if (data.length > 0) {
        setActiveDatasetId(data[0].id);
        localStorage.setItem("active_dataset_id", data[0].id);
      }
    }).catch(() => {});

    // Load profile
    api.getProfile().then(setUserProfile).catch(() => {});
  }, [pathname]);

  const handleSelectDataset = (id: string) => {
    setActiveDatasetId(id);
    localStorage.setItem("active_dataset_id", id);
    setIsDropdownOpen(false);
    window.dispatchEvent(new Event("datasetChanged"));
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  // Hide on public landing or login page
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <span>DarkStore<span className="text-indigo-400">.AI</span></span>
          </Link>

          {/* Dataset Switcher (Section 31 of prompt.txt) */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-800/80 hover:bg-gray-750 border border-gray-700 text-sm text-gray-200 transition"
            >
              <Database className="h-4 w-4 text-indigo-400" />
              <span className="font-medium truncate max-w-[160px]">
                {activeDataset ? activeDataset.name : "Select Dataset"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-lg bg-[#111827] border border-gray-700 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Datasets & Dark Stores
                </div>
                {datasets.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-gray-400">No datasets found</div>
                ) : (
                  datasets.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDataset(d.id)}
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-800 transition ${
                        d.id === activeDatasetId ? "text-indigo-400 font-semibold bg-gray-800/40" : "text-gray-300"
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                        {d.status}
                      </span>
                    </button>
                  ))
                )}
                <div className="border-t border-gray-800 mt-2 pt-2 px-2">
                  <Link
                    href="/datasets/new"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium rounded hover:bg-gray-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create New Dataset
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation shortcuts */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              pathname === "/dashboard" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            Overview
          </Link>
          <Link
            href={activeDatasetId ? `/datasets/${activeDatasetId}/recommendations` : "/dashboard"}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
              pathname.includes("/recommendations") ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            <ShoppingCart className="h-4 w-4 text-emerald-400" />
            What Should I Order?
          </Link>
          <Link
            href="/copilot"
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
              pathname === "/copilot" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            <Bot className="h-4 w-4 text-indigo-400" />
            AI Copilot
          </Link>
          <Link
            href="/actions"
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
              pathname === "/actions" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4 text-cyan-400" />
            Action History
          </Link>
          <Link
            href="/datasets"
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition ${
              pathname === "/datasets" ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-gray-400 hover:text-white"
            }`}
          >
            Data Sources
          </Link>
        </nav>

        {/* User Info / Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-gray-200">{userProfile?.full_name || "Dark Store Manager"}</span>
            <span className="text-[11px] text-gray-400">{userProfile?.email || "demo.manager@darkstore.io"}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
            {(userProfile?.full_name || "M")[0]}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("auth_token");
              router.push("/login");
            }}
            title="Sign out"
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-800 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
