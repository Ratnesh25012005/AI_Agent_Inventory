"use client";

import { useEffect, useState } from "react";
import { isReducedMotion } from "@/lib/gsap";

interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export function useCountUp(
  target: number,
  options: UseCountUpOptions = {}
): string {
  const { duration = 1200, decimals = 0, prefix = "", suffix = "" } = options;
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (isReducedMotion()) {
      setValue(target);
      return;
    }

    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(ease * target);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  const formatted = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${formatted}${suffix}`;
}
