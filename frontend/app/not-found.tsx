"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Package404_3D } from "@/components/3d/Package404_3D";
import { useGsapContext, getGSAP } from "@/lib/gsap";
import { LayoutDashboard, Home } from "lucide-react";

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGsapContext((ctx) => {
    const { gsap } = getGSAP();

    // 404 number: fade + scale
    if (numberRef.current) {
      gsap.from(numberRef.current, {
        opacity: 0,
        scale: 0.94,
        duration: 0.7,
        ease: "power2.out",
      });

      // Subtle slow floating animation
      gsap.to(numberRef.current, {
        y: -8,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }

    // Message & buttons: fade up
    if (contentRef.current) {
      gsap.from(contentRef.current.children, {
        opacity: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.15,
        ease: "power2.out",
      });
    }
  }, containerRef);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F7F8FA] text-[#111827] flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans"
    >
      {/* Subtle light background grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Minimal Light Header */}
      <header className="px-6 py-4 max-w-5xl mx-auto w-full flex items-center justify-between relative z-10 border-b border-[#E5E9EF] bg-[#F7F8FA]/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm text-[#111827] tracking-tight">
          <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">
            DS
          </div>
          <span>DarkStore<span className="text-blue-600">.AI</span></span>
        </Link>

        <Link
          href="/dashboard"
          className="text-xs font-medium text-[#5B6472] hover:text-[#111827] px-3.5 py-1.5 rounded-lg border border-[#E5E9EF] bg-white hover:bg-slate-50 transition duration-150 shadow-sm"
        >
          Dashboard
        </Link>
      </header>

      {/* Main 404 Stage */}
      <main className="max-w-md mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center relative z-10">
        {/* Procedural 3D Node with disconnected searching item */}
        <div className="mb-2">
          <Package404_3D size={190} />
        </div>

        {/* 404 Controlled Number */}
        <h1
          ref={numberRef}
          className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#111827] to-[#64748B] tracking-tight select-none"
        >
          404
        </h1>

        {/* Text and Actions */}
        <div ref={contentRef} className="mt-3 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#111827]">
            THIS PAGE IS OUT OF STOCK.
          </h2>

          <p className="text-xs sm:text-sm text-[#5B6472] max-w-xs mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs tracking-wide shadow-sm transition duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E9EF] text-[#111827] hover:text-blue-600 text-xs font-medium tracking-wide shadow-sm transition duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E5E9EF] py-4 px-6 text-center text-[11px] text-[#7A8494] relative z-10 bg-[#F7F8FA]">
        DarkStore.AI &bull; Enterprise Decision Intelligence
      </footer>
    </div>
  );
}
