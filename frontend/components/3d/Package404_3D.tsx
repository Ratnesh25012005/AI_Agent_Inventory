"use client";

import React, { useEffect, useRef } from "react";
import { isReducedMotion } from "@/lib/gsap";

interface Package404_3DProps {
  className?: string;
  size?: number;
}

export function Package404_3D({ className = "", size = 200 }: Package404_3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (isReducedMotion()) return;

    let renderer: any = null;
    let animId: number;

    const initScene = async () => {
      try {
        const THREE = await import("three");
        const container = mountRef.current;
        if (!container) return;

        const w = size;
        const h = size;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(0, 0, 12);

        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        } catch {
          return;
        }

        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        const group = new THREE.Group();
        scene.add(group);

        // Technical Faceted Coordinate Box (Dark navy/charcoal for light background)
        const boxGeo = new THREE.BoxGeometry(3.6, 3.6, 3.6);
        const boxMat = new THREE.MeshBasicMaterial({
          color: 0x1e293b,
          wireframe: true,
          transparent: true,
          opacity: 0.75,
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        group.add(boxMesh);

        // Inner Core Node (Controlled royal blue accent)
        const innerGeo = new THREE.OctahedronGeometry(1.6, 0);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        group.add(innerMesh);

        // One Disconnected Searching Node (Amber alert indicating item out-of-stock)
        const missingNodeGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const missingNodeMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.9,
        });
        const missingNode = new THREE.Mesh(missingNodeGeo, missingNodeMat);
        missingNode.position.set(3.2, 2.2, 0);
        group.add(missingNode);

        // Dashed connection vector from box to disconnected node
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(1.8, 1.8, 0),
          new THREE.Vector3(3.2, 2.2, 0),
        ]);
        const lineMat = new THREE.LineDashedMaterial({
          color: 0xf59e0b,
          dashSize: 0.4,
          gapSize: 0.2,
          transparent: true,
          opacity: 0.6,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        group.add(line);

        // Mouse Parallax
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          targetX = ((e.clientX - rect.left) / w - 0.5) * 0.4;
          targetY = ((e.clientY - rect.top) / h - 0.5) * 0.4;
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });

        let clock = 0;
        const animate = () => {
          clock += 0.01;

          currentX += (targetX - currentX) * 0.05;
          currentY += (targetY - currentY) * 0.05;

          group.rotation.x = Math.sin(clock * 0.8) * 0.15 + currentY + 0.2;
          group.rotation.y = clock * 0.35 + currentX;
          group.position.y = Math.sin(clock * 1.6) * 0.3;

          innerMesh.rotation.y = -clock * 0.5;

          // Pulse missing node
          const scale = 1 + Math.sin(clock * 3) * 0.15;
          missingNode.scale.set(scale, scale, scale);

          renderer.render(scene, camera);
          animId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
          window.removeEventListener("mousemove", onMouseMove);
          cancelAnimationFrame(animId);
          boxGeo.dispose();
          boxMat.dispose();
          innerGeo.dispose();
          innerMat.dispose();
          missingNodeGeo.dispose();
          missingNodeMat.dispose();
          lineGeo.dispose();
          lineMat.dispose();

          if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
            renderer.dispose();
          }
        };
      } catch (err) {
        console.warn("404 3D visual init skipped:", err);
      }
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then((c) => {
        if (typeof c === "function") c();
      });
      if (animId) cancelAnimationFrame(animId);
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    />
  );
}
