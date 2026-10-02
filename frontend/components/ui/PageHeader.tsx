"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-800 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 font-medium">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {badge}
        </div>

        {description && (
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
