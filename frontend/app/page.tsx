"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  Boxes, 
  TrendingUp, 
  Check, 
  ChevronRight, 
  ShoppingCart,
  Database,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Zap,
  BarChart3,
  Package,
  Bell
} from "lucide-react";
import { DataNetwork3D } from "@/components/3d/DataNetwork3D";
import { getGSAP, isReducedMotion, useGsapContext } from "@/lib/gsap";

// ─── Splash / Loading Screen ───────────────────────────────────────
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let frame: number;
    let start: number | null = null;
    const duration = 2200; // total animation time in ms

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const pct = Math.min(elapsed / duration, 1);

      // Ease-in-out curve for smoother feel
      const eased = pct < 0.5
        ? 2 * pct * pct
        : 1 - Math.pow(-2 * pct + 2, 2) / 2;

      setProgress(eased * 100);

      if (pct < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        // Start fade-out
        setFadeOut(true);
        setTimeout(() => onFinish(), 600);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(ellipse at center, #0d1535 0%, #080d1e 50%, #030509 100%)",
      }}
    >
      {/* Subtle ambient glow behind logo */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
        }}
      />

      {/* Logo */}
      <div className="relative mb-10 flex flex-col items-center">
        {/* Stylized DS mark */}
        <div className="relative">
          <svg
            width="72"
            height="72"
            viewBox="0 0 72 72"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-2xl"
            style={{
              filter: "drop-shadow(0 0 20px rgba(99,102,241,0.3))",
            }}
          >
            {/* Abstract D shape */}
            <path
              d="M16 14h14c11 0 20 8 20 22s-9 22-20 22H16V14z"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 140,
                strokeDashoffset: 140 - (progress / 100) * 140,
                transition: "stroke-dashoffset 0.05s linear",
              }}
            />
            {/* Abstract S shape */}
            <path
              d="M38 22c8-2 16 2 14 10-1 5-8 7-14 8s-13 3-14 9c-1 8 7 12 16 10"
              fill="none"
              stroke="url(#splash-gradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: Math.max(0, 100 - (progress / 100) * 100),
                transition: "stroke-dashoffset 0.05s linear",
              }}
            />
            <defs>
              <linearGradient id="splash-gradient" x1="28" y1="20" x2="50" y2="56">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Brand text */}
        <div
          className="mt-4 text-xl font-bold tracking-tight text-white/90 transition-opacity duration-500"
          style={{ opacity: progress > 30 ? 1 : 0 }}
        >
          DarkStore<span className="text-indigo-400">.AI</span>
        </div>
      </div>

      {/* Loading bar */}
      <div className="relative w-64 sm:w-80">
        {/* Track */}
        <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full rounded-full relative"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #06b6d4, #6366f1, #8b5cf6)",
              transition: "width 0.05s linear",
              boxShadow: "0 0 16px 2px rgba(99,102,241,0.5), 0 0 40px 4px rgba(6,182,212,0.2)",
            }}
          >
            {/* Bright glow dot at the leading edge */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full"
              style={{
                background: "radial-gradient(circle, #ffffff 0%, #818cf8 40%, transparent 70%)",
                boxShadow: "0 0 12px 4px rgba(96,165,250,0.6), 0 0 30px 8px rgba(99,102,241,0.3)",
              }}
            />
          </div>
        </div>

        {/* Percentage text */}
        <div
          className="mt-4 text-center text-[11px] font-mono tracking-widest text-white/40 uppercase transition-opacity duration-300"
          style={{ opacity: progress > 10 ? 1 : 0 }}
        >
          {progress < 100 ? "Initializing Systems" : "Ready"}
        </div>
      </div>
    </div>
  );
}

// ─── Scroll Reveal Hook (fade-in on enter, fade-out on leave) ─────
function useScrollReveal() {
  useEffect(() => {
    const revealClasses = [
      "reveal-fade-up",
      "reveal-slide-left",
      "reveal-slide-right",
      "reveal-scale",
      "reveal-rotate",
      "reveal-flip",
    ];

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        } else {
          // Fade out when element leaves viewport (scroll up/down)
          entry.target.classList.remove("revealed");
        }
      });
    };

    // threshold:0 means trigger as soon as ANY pixel is visible —
    // critical for large cards (reveal-scale) that are taller than
    // the viewport and would never reach a 10% threshold.
    const observer = new IntersectionObserver(callback, {
      threshold: 0,
      rootMargin: "0px 0px 0px 0px",
    });

    const selector = revealClasses.map((c) => `.${c}`).join(", ");
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── RGB Aurora Cursor Light ──────────────────────────────────────
function RgbCursorLight() {
  useEffect(() => {
    const el = document.getElementById("rgb-cursor-light");
    if (!el) return;
    let raf: number;
    let tx = -9999, ty = -9999;
    let cx = -9999, cy = -9999;

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onEnter = () => el.classList.add("active");
    const onLeave = () => el.classList.remove("active");
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    const tick = () => {
      // Smooth lerp for buttery follow
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.left = `${cx}px`;
      el.style.top  = `${cy}px`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);
  return null; // renders nothing — uses existing DOM div
}

// ─── Hook: per-element cursor spotlight (--mx / --my) ─────────────
function useGlowCards() {
  useEffect(() => {
    const update = (e: MouseEvent) => {
      const targets = document.querySelectorAll<HTMLElement>(".glow-card, .glow-btn");
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width)  * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
      });
    };
    window.addEventListener("mousemove", update, { passive: true });
    return () => window.removeEventListener("mousemove", update);
  }, []);
}

// ─── Animated Grid Background ────────────────────────────────────
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.9) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
    </div>
  );
}

// ─── Floating Stat Chip ─────────────────────────────────────────────
function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div
      className="glow-card lp-stat-chip flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/10 backdrop-blur-md cursor-default"
      style={{ background: "rgba(13,18,40,0.7)" }}
    >
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">{label}</div>
        <div className="text-sm font-bold text-white font-mono leading-none mt-0.5">{value}</div>
      </div>
    </div>
  );
}


export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const productRevealRef = useRef<HTMLDivElement>(null);

  // Splash screen state
  const [showSplash, setShowSplash] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    // Small delay before triggering content animations
    setTimeout(() => setContentReady(true), 100);
  }, []);

  // Active step for Section 2 (Intelligence)
  const [activeIntelStep, setActiveIntelStep] = useState(0);

  // Activate scroll-reveal observer only after splash is done
  useScrollReveal();

  // RGB cursor aurora + per-card spotlight
  useGlowCards();

  // Subtle Scroll Progress Indicator
  useEffect(() => {
    const handleScroll = () => {
      if (!progressBarRef.current) return;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      progressBarRef.current.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP Animations and ScrollTriggers
  useGsapContext((ctx) => {
    if (!contentReady) return;

    const { gsap, ScrollTrigger } = getGSAP();

    // 1. Hero Entrance (~1.2s target)
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".hero-nav", { y: -15, opacity: 0, duration: 0.6 })
      .from(".hero-eyebrow", { y: 12, opacity: 0, duration: 0.4 }, "-=0.3")
      .from(".hero-headline-line", { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.2")
      .from(".hero-desc", { y: 12, opacity: 0, duration: 0.5 }, "-=0.3")
      .from(".hero-cta", { y: 12, opacity: 0, duration: 0.5 }, "-=0.3")
      .from(heroVisualRef.current, { scale: 0.94, opacity: 0, duration: 0.9 }, "-=0.6");

    // 2. Hero Scroll Parallax
    if (heroRef.current && heroTextRef.current) {
      gsap.to(heroTextRef.current, {
        y: -40,
        opacity: 0.8,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      if (heroVisualRef.current) {
        gsap.to(heroVisualRef.current, {
          y: -25,
          scale: 0.96,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }

    // 3. Section 3 Product Preview Reveal (Scale and fade into view)
    if (productRevealRef.current) {
      gsap.from(productRevealRef.current, {
        scale: 0.93,
        opacity: 0.3,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: productRevealRef.current,
          start: "top 85%",
          end: "top 45%",
          scrub: 1,
        },
      });
    }

    // 4. Section 4 AI Decision Metrics Reveal
    const decisionMetrics = gsap.utils.toArray<HTMLElement>(".metric-cell");
    if (decisionMetrics.length > 0) {
      gsap.from(decisionMetrics, {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#section-decision",
          start: "top 78%",
        },
      });
    }
  }, containerRef, [contentReady]);

  // Intel progression data (Section 2)
  const intelFlow = [
    {
      stage: "DATA",
      title: "Raw Event Telemetry",
      desc: "Sub-second ingestion of POS sales, rider pick scans, and ERP receipts directly into DuckDB columnar memory.",
      tag: "Embedded OLAP",
      icon: <Database className="h-4 w-4" />,
      color: "from-indigo-500 to-cyan-400",
      glow: "rgba(6,182,212,0.25)",
    },
    {
      stage: "PATTERNS",
      title: "Anomaly Isolation",
      desc: "Isolation Forest algorithms detect phantom stock, shrinkages, and shelf divergence before bad data corrupts replenishment.",
      tag: "Zero Ghost SKUs",
      icon: <Activity className="h-4 w-4" />,
      color: "from-indigo-500 to-indigo-400",
      glow: "rgba(139,92,246,0.25)",
    },
    {
      stage: "PREDICTION",
      title: "Multi-Horizon Forecast",
      desc: "LightGBM quantile regressors model 24h, 48h, and 7d demand velocity incorporating localized weather and events.",
      tag: "99.4% Precision",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "from-indigo-500 to-indigo-400",
      glow: "rgba(99,102,241,0.25)",
    },
    {
      stage: "ACTION",
      title: "Poisson Reorder POs",
      desc: "Deterministic replenishment equations compute exact purchase order quantities ready for 1-click dispatch.",
      tag: "Autonomous Dispatch",
      icon: <ShoppingCart className="h-4 w-4" />,
      color: "from-emerald-500 to-teal-400",
      glow: "rgba(16,185,129,0.25)",
    },
  ];

  return (
    <>
      {/* ═══════════ SPLASH / LOADING SCREEN ═══════════ */}
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <div
        ref={containerRef}
        className={`min-h-screen text-white flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-x-hidden font-sans transition-opacity duration-700 ${
          showSplash ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: "linear-gradient(135deg, #080d1e 0%, #0d1535 40%, #0a1028 70%, #060b18 100%)",
        }}
      >
        {/* RGB Aurora Cursor + Spotlight */}
        {!showSplash && <RgbCursorLight />}

        {/* RGB Cursor Light DOM element (targeted by CSS #rgb-cursor-light) */}
        <div id="rgb-cursor-light" />

        {/* Scroll Progress */}
        <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] bg-transparent pointer-events-none">
          <div
            ref={progressBarRef}
            className="h-full w-0"
            style={{
              background: "linear-gradient(90deg, #06b6d4, #6366f1, #8b5cf6)",
              boxShadow: "0 0 12px rgba(99,102,241,0.6)",
            }}
          />
        </div>

        {/* ════════════════════════════════════ */}
        {/* NAVIGATION                           */}
        {/* ════════════════════════════════════ */}
        <header
          className="hero-nav sticky top-0 z-50 px-6 py-3.5 border-b"
          style={{
            background: "rgba(8,13,30,0.85)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(99,102,241,0.15)",
          }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-black text-[11px] shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.4)",
                }}
              >
                DS
              </div>
              <span className="font-bold text-sm tracking-tight text-white/90">
                DarkStore<span className="bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">.AI</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {["Intelligence", "Product", "Decision Engine"].map((item, i) => (
                <a
                  key={item}
                  href={`#section-${["intelligence","product","decision"][i]}`}
                  className="px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {item}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <Link
                href="/login"
                className="text-[13px] font-medium text-white/50 hover:text-white transition-colors duration-200 px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* ════════════════════════════════════ */}
        {/* SECTION 1 — HERO                    */}
        {/* ════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="min-h-[calc(100vh-60px)] flex items-center relative z-10 px-6 max-w-7xl mx-auto w-full py-16"
        >
          <AnimatedGrid />

          {/* Ambient Glows */}
          <div className="absolute right-[-80px] top-1/4 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }} />
          <div className="absolute left-[-120px] bottom-1/4 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
          <div className="absolute left-1/2 top-0 w-[800px] h-[400px] rounded-full blur-[150px] pointer-events-none -translate-x-1/2" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full relative z-10">
            {/* Left Column */}
            <div ref={heroTextRef} className="lg:col-span-6 space-y-7 text-left">
              {/* Eyebrow */}
              <div
                className="hero-eyebrow inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-[11px] font-mono font-semibold uppercase tracking-widest"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  borderColor: "rgba(99,102,241,0.25)",
                  color: "#818cf8",
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>
                AI-POWERED INVENTORY INTELLIGENCE
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02]">
                <span className="hero-headline-line block text-white">TURN INVENTORY DATA</span>
                <span
                  className="hero-headline-line block bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent"
                >
                  INTO BETTER DECISIONS.
                </span>
              </h1>

              {/* Description */}
              <p className="hero-desc text-base text-white/50 max-w-md leading-relaxed font-normal">
                DarkStore.AI pairs embedded DuckDB processing with LightGBM demand forecasts to eliminate stockouts and overstock traps in quick-commerce dark stores.
              </p>

              {/* CTA Buttons */}
              <div className="hero-cta flex flex-wrap items-center gap-3.5">
                <Link
                  href="/login"
                  className="glow-btn flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 0 30px rgba(99,102,241,0.35), 0 4px 20px rgba(0,0,0,0.3)",
                  }}
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="glow-btn flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white/70 hover:text-white border"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  <span>Explore the Platform</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Live Stats Row */}
              <div className="flex flex-wrap gap-3 pt-2">
                <StatChip
                  icon={<Package className="h-3.5 w-3.5 text-cyan-400" />}
                  label="SKUs Monitored"
                  value="14,280"
                  color="bg-cyan-500/15"
                />
                <StatChip
                  icon={<TrendingUp className="h-3.5 w-3.5 text-indigo-400" />}
                  label="Model Accuracy"
                  value="99.4%"
                  color="bg-indigo-500/15"
                />
                <StatChip
                  icon={<Zap className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Orders Ready"
                  value="3 POs"
                  color="bg-emerald-500/15"
                />
              </div>
            </div>

            {/* Right Column: 3D Network */}
            <div ref={heroVisualRef} className="lg:col-span-6 relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-3xl blur-3xl"
                style={{
                  background: "radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 75%)",
                }}
              />
              {/* Frosted card frame */}
              <div
                className="glow-card relative w-full rounded-2xl overflow-hidden border"
                style={{
                  background: "rgba(13,18,40,0.5)",
                  backdropFilter: "blur(16px)",
                  borderColor: "rgba(99,102,241,0.2)",
                  boxShadow: "0 0 60px rgba(99,102,241,0.12), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                {/* Fake browser bar */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b"
                  style={{
                    background: "rgba(8,13,30,0.6)",
                    borderColor: "rgba(99,102,241,0.15)",
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-[11px] font-mono text-white/20">darkstore.ai — Live 3D Network</span>
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] font-mono text-emerald-400/80">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </div>
                <DataNetwork3D height={440} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════ */}
        {/* SECTION 2 — INTELLIGENCE            */}
        {/* ════════════════════════════════════ */}
        <section
          id="section-intelligence"
          className="w-full relative z-10 overflow-hidden py-28 px-6"
          style={{
            background: "linear-gradient(180deg, rgba(8,13,30,0) 0%, rgba(10,16,38,0.95) 15%, rgba(10,16,38,0.95) 85%, rgba(8,13,30,0) 100%)",
            borderTop: "1px solid rgba(99,102,241,0.1)",
            borderBottom: "1px solid rgba(99,102,241,0.1)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

          <div className="max-w-6xl mx-auto w-full relative">
            <div className="space-y-4 mb-14 text-left reveal-fade-up">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#6366f1,#06b6d4)" }} />
                INTELLIGENCE PIPELINE
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                From raw telemetry to{" "}
                <span className="bg-gradient-to-r from-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent">
                  deterministic replenishment
                </span>.
              </h2>
              <p className="text-sm text-white/40 max-w-lg leading-relaxed">
                Continuous background processing transforms scattered warehouse events into verified purchase orders without cloud latency.
              </p>
            </div>

            {/* 4-Stage Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {intelFlow.map((item, i) => (
                <div
                  key={item.stage}
                  onClick={() => setActiveIntelStep(i)}
                  className={`glow-card reveal-fade-up stagger-${i + 1} p-5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all duration-300`}
                  style={{
                    background: activeIntelStep === i
                      ? "linear-gradient(135deg, rgba(13,18,40,0.95), rgba(13,18,40,0.8))"
                      : "rgba(8,13,30,0.6)",
                    borderColor: activeIntelStep === i ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)",
                    boxShadow: activeIntelStep === i
                      ? `0 0 30px ${item.glow}, 0 8px 32px rgba(0,0,0,0.3)`
                      : "0 2px 16px rgba(0,0,0,0.2)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-8 w-8 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}>
                          {item.icon}
                        </span>
                        <span className="text-xs font-bold font-mono tracking-widest text-white/50">{item.stage}</span>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-md font-mono font-semibold uppercase tracking-wide"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">{item.title}</h3>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/5 text-[10px] font-mono text-white/40 flex items-center justify-between">
                    <span>Stage 0{i + 1}</span>
                    {activeIntelStep === i && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline connector */}
            <div className="hidden lg:flex items-center justify-center mt-8 gap-0 reveal-fade-up stagger-5">
              {[0, 1, 2].map((i) => (
                <React.Fragment key={i}>
                  <div
                    className="h-2 w-2 rounded-full transition-all duration-500"
                    style={{ background: i <= activeIntelStep ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "rgba(255,255,255,0.1)" }}
                  />
                  <div
                    className="h-px w-28 transition-all duration-500"
                    style={{ background: i < activeIntelStep ? "linear-gradient(90deg, #6366f1, #06b6d4)" : "rgba(255,255,255,0.08)" }}
                  />
                </React.Fragment>
              ))}
              <div
                className="h-2 w-2 rounded-full transition-all duration-500"
                style={{ background: activeIntelStep >= 3 ? "linear-gradient(135deg,#6366f1,#06b6d4)" : "rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════ */}
        {/* SECTION 3 — PRODUCT                 */}
        {/* ════════════════════════════════════ */}
        <section
          id="section-product"
          className="w-full relative z-10 overflow-hidden py-28 px-6"
          style={{ background: "linear-gradient(180deg, #080d1e 0%, #0c1228 100%)" }}
        >
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(99,102,241,0.07)" }} />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(6,182,212,0.05)" }} />

          <div className="max-w-6xl mx-auto w-full relative">
            <div className="space-y-4 mb-12 text-left reveal-slide-left">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(6,182,212,0.08)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)" }}
              >
                <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#06b6d4,#6366f1)" }} />
                ACTUAL PLATFORM
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Designed for{" "}
                <span className="bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
                  dark store productivity
                </span>.
              </h2>
              <p className="text-sm text-white/40 max-w-md">
                No clutter. Instant KPI clarity, stockout risk queues, and 1-click reorder authorizations.
              </p>
            </div>

            {/* Product Shell */}
            <div
              ref={productRevealRef}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(10,16,36,0.9)",
                border: "1px solid rgba(99,102,241,0.2)",
                boxShadow: "0 0 60px rgba(99,102,241,0.1), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {/* Window bar */}
              <div
                className="px-5 py-3 flex items-center justify-between border-b"
                style={{ background: "rgba(13,18,40,0.7)", borderColor: "rgba(99,102,241,0.12)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-3 text-[11px] font-mono text-white/20">darkstore.ai/dashboard</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1.5 font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  BKC-Facility-01 &bull; Live Telemetry
                </span>
              </div>

              {/* Dashboard preview */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div
                    className="glow-card p-5 rounded-xl flex flex-col gap-1.5 reveal-fade-up stagger-1 cursor-default"
                    style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(6,182,212,0.03))", border: "1px solid rgba(6,182,212,0.15)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-mono text-cyan-400/70 uppercase font-semibold tracking-wider">Catalog Monitored</div>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
                        <Package className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white font-mono">14,280</div>
                    <div className="text-[11px] text-white/40">SKUs</div>
                    <div className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1 mt-1">
                      <span className="h-1 w-1 rounded-full bg-emerald-400 inline-block" />
                      100% real-time tracking
                    </div>
                  </div>

                  <div
                    className="glow-card p-5 rounded-xl flex flex-col gap-1.5 reveal-fade-up stagger-2 cursor-default"
                    style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-mono text-rose-400/70 uppercase font-semibold tracking-wider">Stockout Risks (24h)</div>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                        <Bell className="h-3.5 w-3.5 text-rose-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-rose-400 font-mono">3</div>
                    <div className="text-[11px] text-white/40">SKUs at Risk</div>
                    <div className="text-[10px] text-rose-400/80 font-medium flex items-center gap-1 mt-1">
                      <span className="h-1 w-1 rounded-full bg-rose-400 inline-block animate-pulse" />
                      Replenishment queued
                    </div>
                  </div>

                  <div
                    className="glow-card p-5 rounded-xl flex flex-col gap-1.5 reveal-fade-up stagger-3 cursor-default"
                    style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.03))", border: "1px solid rgba(139,92,246,0.15)" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] font-mono text-indigo-400/70 uppercase font-semibold tracking-wider">Model Accuracy</div>
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                        <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-indigo-400 font-mono">99.4<span className="text-xl text-white/40">%</span></div>
                    <div className="text-[11px] text-white/40">Forecast precision</div>
                    <div className="text-[10px] text-indigo-400/80 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="h-2.5 w-2.5" />
                      LightGBM Quantile V2
                    </div>
                  </div>
                </div>

                {/* Alert Banner */}
                <div
                  className="glow-card p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 reveal-flip"
                  style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
                    >
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">3 Purchase Orders Ready for Approval</div>
                      <div className="text-[12px] text-white/40">Deterministic safety stock quantities computed</div>
                    </div>
                  </div>
                  <Link
                    href="/dashboard"
                    className="glow-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
                  >
                    Open Live Dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════ */}
        {/* SECTION 4 — AI DECISION             */}
        {/* ════════════════════════════════════ */}
        <section
          id="section-decision"
          className="w-full relative z-10 overflow-hidden py-28 px-6"
          style={{ background: "linear-gradient(180deg, #0c1228 0%, #0a1020 100%)", borderTop: "1px solid rgba(99,102,241,0.08)" }}
        >
          <div className="max-w-6xl mx-auto w-full relative">
            <div className="space-y-4 mb-12 text-left reveal-slide-right">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <div className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#6366f1,#8b5cf6)" }} />
                TRANSPARENT CALCULATION
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                How data becomes a{" "}
                <span className="bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">
                  decision
                </span>.
              </h2>
              <p className="text-sm text-white/40 max-w-md">
                No hallucination. Every recommendation exposes current stock, predicted velocity, and computed reorder quantities.
              </p>
            </div>

            {/* Decision Card */}
            <div
              className="glow-card rounded-2xl p-6 sm:p-8 space-y-6 reveal-rotate"
              style={{
                background: "rgba(10,16,36,0.9)",
                border: "1px solid rgba(99,102,241,0.2)",
                boxShadow: "0 0 50px rgba(99,102,241,0.08), 0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">PRODUCT</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">Wireless Ergonomic Mouse</h3>
                </div>
                <span
                  className="text-xs font-mono font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Stockout projected in 4.2h
                </span>
              </div>

              {/* 4 Decision Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { label: "Current Stock", value: "18", bg: "rgba(255,255,255,0.06)", tc: "#fff", bc: "rgba(255,255,255,0.08)" },
                  { label: "Predicted Demand", value: "64", bg: "rgba(6,182,212,0.08)", tc: "#22d3ee", bc: "rgba(6,182,212,0.15)" },
                  { label: "Recommendation", value: "Reorder 50", bg: "rgba(16,185,129,0.08)", tc: "#34d399", bc: "rgba(16,185,129,0.15)" },
                  { label: "Confidence", value: "94%", bg: "rgba(139,92,246,0.08)", tc: "#818cf8", bc: "rgba(139,92,246,0.15)" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="metric-cell glow-card p-5 rounded-xl"
                    style={{ background: m.bg, border: `1px solid ${m.bc}` }}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-white/40 font-semibold">{m.label}</div>
                    <div className="text-2xl font-bold mt-2 font-mono" style={{ color: m.tc }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono pt-5 border-t"
                style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
              >
                <span>Equation: PO = max(0, TargetDemand(64) - OnHand(18) + SafetyStock(4)) = 50</span>
                <span
                  className="glow-btn flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-emerald-400"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", cursor: "pointer" }}
                >
                  <Check className="h-3.5 w-3.5" />
                  1-Click Dispatch Ready
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════ */}
        {/* SECTION 5 — FINAL CTA               */}
        {/* ════════════════════════════════════ */}
        <section
          className="w-full relative z-10 overflow-hidden py-32 px-6"
          style={{ background: "linear-gradient(180deg, #0a1020 0%, #0d1535 50%, #080d1e 100%)", borderTop: "1px solid rgba(99,102,241,0.08)" }}
        >
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none" style={{ background: "rgba(99,102,241,0.12)" }} />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none" style={{ background: "rgba(139,92,246,0.10)" }} />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(99,102,241,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="max-w-3xl mx-auto w-full text-center relative">
            <div className="space-y-8 reveal-scale">
              <div
                className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full mb-2"
                style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <span className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg,transparent,#6366f1)" }} />
                READY TO START
                <span className="h-1 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#6366f1,transparent)" }} />
              </div>

              <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
                Make your inventory<br />
                <span className="bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent">
                  work smarter
                </span>.
              </h2>

              <p className="text-base text-white/40 max-w-sm mx-auto leading-relaxed">
                Connect your store dataset in minutes. Experience instant deterministic demand forecasts with zero setup fees.
              </p>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="glow-btn flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base text-white"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 40px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.3)" }}
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="glow-btn px-7 py-3.5 rounded-xl font-medium text-base text-white/50 hover:text-white border"
                  style={{ borderColor: "rgba(255,255,255,0.1)" }}
                >
                  View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════ */}
        {/* FOOTER                              */}
        {/* ════════════════════════════════════ */}
        <footer
          className="w-full py-10 px-6 relative z-10"
          style={{ background: "rgba(5,8,18,0.98)", borderTop: "1px solid rgba(99,102,241,0.1)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="h-7 w-7 rounded-xl flex items-center justify-center text-white font-black text-[9px]"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}
              >
                DS
              </div>
              <span className="text-sm font-bold text-white/70">
                DarkStore<span className="bg-gradient-to-r from-[#6366f1] to-[#06b6d4] bg-clip-text text-transparent">.AI</span>
              </span>
            </div>

            <div className="flex items-center gap-6 text-[12px] font-medium text-white/40">
              {[["Dashboard", "/dashboard"], ["Inventory", "/inventory"], ["AI Insights", "/insights"], ["Sign In", "/login"]].map(([label, href]) => (
                <Link key={label} href={href} className="hover:text-white/70 transition-colors duration-200">{label}</Link>
              ))}
            </div>

            <div className="text-[12px] text-white/20">
              &copy; {new Date().getFullYear()} DarkStore.AI Inc.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
