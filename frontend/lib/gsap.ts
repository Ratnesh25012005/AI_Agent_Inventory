import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export function getGSAP() {
  if (typeof window !== "undefined" && !isRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    isRegistered = true;
  }
  return { gsap, ScrollTrigger };
}

export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * React hook to safely run GSAP animations scoped to a ref with automatic cleanup
 */
export function useGsapContext(
  callback: (context: gsap.Context) => void,
  scopeRef: React.RefObject<HTMLElement | null>,
  deps: any[] = []
) {
  useEffect(() => {
    if (typeof window === "undefined" || !scopeRef.current) return;
    getGSAP();

    const ctx = gsap.context((self) => {
      if (!isReducedMotion()) {
        callback(self);
      }
    }, scopeRef);

    return () => {
      ctx.revert();
    };
  }, deps);
}

export { gsap, ScrollTrigger };
