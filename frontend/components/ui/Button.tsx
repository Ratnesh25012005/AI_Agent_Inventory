"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-3.5 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-navy-900 hover:bg-navy-800 text-white focus:ring-navy-700 shadow-sm",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-300 shadow-sm",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 focus:ring-slate-300",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-200",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 shadow-sm",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-400 shadow-sm",
  }[variant];

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles, variantStyles, className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
