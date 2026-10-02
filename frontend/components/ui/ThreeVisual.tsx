"use client";

import React, { useEffect, useRef } from "react";

interface ThreeVisualProps {
  className?: string;
  variant?: "neural" | "nodes" | "minimal";
  height?: number;
}

export function ThreeVisual({
  className = "",
  variant = "neural",
  height = 200,
}: ThreeVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let animationFrameId: number;
    let renderer: any = null;

    const initThree = async () => {
      try {
        const THREE = await import("three");

        const container = containerRef.current;
        if (!container) return;

        const width = container.clientWidth || 600;
        const h = height;

        // Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, width / h, 0.1, 1000);
        camera.position.z = 30;

        // WebGL Renderer with graceful fallback
        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch {
          // WebGL unsupported on this client
          return;
        }

        renderer.setSize(width, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Build elegant particles/lattice
        const particleCount = variant === "neural" ? 64 : 40;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const originalPositions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const x = (Math.random() - 0.5) * 45;
          const y = (Math.random() - 0.5) * 20;
          const z = (Math.random() - 0.5) * 20;
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
          originalPositions[i * 3] = x;
          originalPositions[i * 3 + 1] = y;
          originalPositions[i * 3 + 2] = z;
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        // Refined navy/indigo subtle color
        const material = new THREE.PointsMaterial({
          color: 0x3b82f6,
          size: 1.8,
          transparent: true,
          opacity: 0.75,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        // Add delicate connecting lines between nearby points
        const lineMaterial = new THREE.LineBasicMaterial({
          color: 0x2563eb,
          transparent: true,
          opacity: 0.18,
        });

        const lineGeo = new THREE.BufferGeometry();
        const lineMesh = new THREE.LineSegments(lineGeo, lineMaterial);
        scene.add(lineMesh);

        // Interaction
        let mouseX = 0;
        let mouseY = 0;
        const handleMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          mouseX = ((e.clientX - rect.left) / width - 0.5) * 2;
          mouseY = -((e.clientY - rect.top) / h - 0.5) * 2;
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });

        // Animation Loop
        let clock = 0;
        const animate = () => {
          clock += 0.01;
          points.rotation.y = clock * 0.08 + mouseX * 0.15;
          points.rotation.x = Math.sin(clock * 0.05) * 0.05 + mouseY * 0.1;

          // Compute line connections dynamically
          const posAttr = geometry.attributes.position;
          const currentPos = posAttr.array as Float32Array;

          // Gentle wave
          for (let i = 0; i < particleCount; i++) {
            currentPos[i * 3 + 1] =
              originalPositions[i * 3 + 1] + Math.sin(clock + originalPositions[i * 3] * 0.2) * 1.2;
          }
          posAttr.needsUpdate = true;

          // Connect points close to each other
          const linePositions: number[] = [];
          for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
              const dx = currentPos[i * 3] - currentPos[j * 3];
              const dy = currentPos[i * 3 + 1] - currentPos[j * 3 + 1];
              const dz = currentPos[i * 3 + 2] - currentPos[j * 3 + 2];
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist < 10) {
                linePositions.push(
                  currentPos[i * 3],
                  currentPos[i * 3 + 1],
                  currentPos[i * 3 + 2],
                  currentPos[j * 3],
                  currentPos[j * 3 + 1],
                  currentPos[j * 3 + 2]
                );
              }
            }
          }

          lineMesh.geometry.dispose();
          lineMesh.geometry = new THREE.BufferGeometry();
          lineMesh.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(linePositions, 3)
          );
          lineMesh.rotation.copy(points.rotation);

          renderer.render(scene, camera);
          animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        // Resize handler
        const handleResize = () => {
          if (!container) return;
          const newW = container.clientWidth;
          camera.aspect = newW / h;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, h);
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animationFrameId);
          if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
            renderer.dispose();
          }
        };
      } catch (err) {
        console.warn("ThreeVisual initialization skipped:", err);
      }
    };

    const cleanupPromise = initThree();

    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [variant, height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
