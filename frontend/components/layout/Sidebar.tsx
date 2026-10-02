"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
  Sparkles,
  BarChart3,
  Database,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Plus,
  X,
  Bot
} from "lucide-react";
import { api } from "@/lib/api";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);

  useEffect(() => {
    api.getDatasets().then((data) => {
      setDatasets(data || []);
      const saved = localStorage.getItem("active_dataset_id");
      if (saved && data.some((d: any) => d.id === saved)) {
        setActiveDatasetId(saved);
      } else if (data && data.length > 0) {
        setActiveDatasetId(data[0].id);
        localStorage.setItem("active_dataset_id", data[0].id);
      }
    }).catch(() => {});

    api.getProfile().then(setUserProfile).catch(() => {});
  }, [pathname]);

  const handleSelectDataset = (id: string) => {
    setActiveDatasetId(id);
    localStorage.setItem("active_dataset_id", id);
    setIsStoreMenuOpen(false);
    window.dispatchEvent(new Event("datasetChanged"));
  };

  const activeDataset = datasets.find((d) => d.id === activeDatasetId);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inventory", href: "/inventory", icon: Boxes },
    {
      label: "Orders & Reorders",
      href: activeDatasetId ? `/datasets/${activeDatasetId}/recommendations` : "/orders",
      icon: ShoppingCart,
      match: ["/orders", "/recommendations"],
    },
    { label: "Suppliers", href: "/suppliers", icon: Truck },
    { label: "AI Insights", href: "/insights", icon: Sparkles, badge: "AI" },
    { label: "Copilot Assistant", href: "/copilot", icon: Bot },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Data Sources", href: "/datasets", icon: Database, match: ["/datasets"] },
  ];

  const secondaryNavItems = [
    { label: "Audit & Actions", href: "/actions", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (item: any) => {
    if (item.match) {
      return item.match.some((m: string) => pathname.includes(m));
    }
    return pathname === item.href;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] text-slate-200 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top: Brand & Facility Switcher */}
        <div>
          {/* Brand */}
          <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 font-bold text-base text-white tracking-tight"
            >
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                DS
              </div>
              <span>
                DarkStore<span className="text-blue-400">.AI</span>
              </span>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Facility Workspace Switcher */}
          <div className="px-3.5 pt-3.5 pb-2 relative">
            <button
              onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
              className="w-full px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800/90 border border-slate-700/80 text-left flex items-center justify-between text-xs transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Facility</div>
                  <div className="font-semibold text-slate-200 truncate">
                    {activeDataset ? activeDataset.name : "Select Dark Store"}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown menu */}
            {isStoreMenuOpen && (
              <div className="absolute left-3.5 right-3.5 top-16 z-50 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl py-1 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Facility Dataset
                </div>
                {datasets.length === 0 ? (
                  <div className="px-3 py-2 text-slate-400">No stores found</div>
                ) : (
                  datasets.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDataset(d.id)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-700/60 transition ${
                        d.id === activeDatasetId
                          ? "text-blue-400 font-semibold bg-blue-950/40"
                          : "text-slate-300"
                      }`}
                    >
                      <span className="truncate">{d.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {d.status}
                      </span>
                    </button>
                  ))
                )}
                <div className="border-t border-slate-700 mt-1 pt-1">
                  <Link
                    href="/datasets/new"
                    onClick={() => setIsStoreMenuOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-blue-400 hover:text-blue-300 font-medium hover:bg-slate-700/60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Dataset</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Management
            </div>
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        active ? "bg-white/20 text-white" : "bg-blue-950 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              System
            </div>
            {secondaryNavItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-850/60 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                {(userProfile?.full_name || "M")[0]}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-200 truncate">
                  {userProfile?.full_name || "Store Operations"}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {userProfile?.email || "ops@darkstore.io"}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                import("@/lib/auth").then(({ clearSession }) => {
                  clearSession();
                  router.push("/login");
                });
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
