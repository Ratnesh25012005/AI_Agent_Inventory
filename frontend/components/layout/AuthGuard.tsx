"use client";

/**
 * components/layout/AuthGuard.tsx
 *
 * Wraps every protected page. Enforces authentication by:
 * 1. On mount — redirects to /login if no token exists.
 * 2. On storage event — if the token is deleted from DevTools
 *    (or another tab), the guard detects it immediately and
 *    redirects to /login without needing a page refresh.
 * 3. On visibility change — re-validates when the user
 *    switches back to the tab after clearing storage in DevTools.
 * 4. Polling — checks every 2 seconds as a final safety net.
 */

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, clearSession } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  const redirectToLogin = () => {
    clearSession();
    router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
  };

  const validate = () => {
    if (!isAuthenticated()) {
      redirectToLogin();
    } else {
      setChecked(true);
    }
  };

  useEffect(() => {
    // 1. Initial check
    validate();

    // 2. Listen for localStorage changes (DevTools removal / other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_token") {
        // key was removed or cleared
        if (!e.newValue) {
          redirectToLogin();
        }
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Re-validate when the user returns to the tab
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        validate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 4. Polling every 2 s as a safety net
    //    (handles DevTools edits in the same tab, which don't fire "storage")
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        redirectToLogin();
      }
    }, 2000);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Show nothing while the initial auth check runs (prevents flash)
  if (!checked) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background: "radial-gradient(ellipse at center, #0d1535 0%, #080d1e 60%, #030509 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: "#6366f1",
              borderRightColor: "#8b5cf6",
            }}
          />
          <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
            Verifying session…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
