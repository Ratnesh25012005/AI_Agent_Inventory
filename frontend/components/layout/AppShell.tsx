"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AuthGuard } from "./AuthGuard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useTheme } from "@/lib/theme";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Standalone pages (Landing, Login, 404)
  const knownBases = [
    "/", "/login", "/dashboard", "/inventory", "/orders", "/suppliers", 
    "/ai-insights", "/insights", "/copilot", "/analytics", "/datasets", "/actions", "/settings"
  ];
  const isKnownRoute = knownBases.includes(pathname) || knownBases.some(base => base !== "/" && pathname.startsWith(base + "/"));
  const isStandalone = pathname === "/" || pathname === "/login" || pathname === "/404" || !isKnownRoute;

  if (isStandalone) {
    const isLoginDark = pathname === "/login";
    return (
      <>
        <LoadingScreen />
        <main className={`min-h-screen ${isLoginDark ? "bg-slate-900 text-slate-100" : "bg-[#F7F8FA] text-[#111827]"}`}>
          {children}
        </main>
      </>
    );
  }

  const bg = isDark ? "#080d1e" : "#f1f5f9";

  return (
    <>
      <LoadingScreen />
      <AuthGuard>
        <div
          className="h-screen flex flex-row overflow-hidden transition-colors duration-300"
          style={{ background: bg, color: isDark ? "#e2e8f0" : "#1e293b" }}
        >
          {/* Sidebar — fixed, never scrolls */}
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          {/* Main Content — only this scrolls */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Topbar onToggleSidebar={() => setSidebarOpen(true)} />
            <main
              className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300"
              style={{ background: bg }}
            >
              <div className="max-w-7xl mx-auto w-full transition-opacity duration-200">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    </>
  );
}
