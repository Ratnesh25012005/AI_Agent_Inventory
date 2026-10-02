"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface DarkPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  eyebrowDot?: boolean;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function DarkPageHeader({
  title,
  description,
  eyebrow,
  eyebrowDot = false,
  actions,
  breadcrumbs,
}: DarkPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-6"
      style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
    >
      <div>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-300 transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-slate-400">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 text-slate-600" />}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Eyebrow */}
        {eyebrow && (
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
              {eyebrowDot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-slate-100">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
