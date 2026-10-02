"use client";

import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = <FolderOpen className="h-10 w-10 text-slate-400" />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl my-4 flex flex-col items-center justify-center">
      <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className || ""}`}
      {...props}
    />
  );
}
