"use client";

import React, { useEffect, useRef } from "react";
import { isReducedMotion } from "@/lib/gsap";

interface DataNetwork3DProps {
  className?: string;
  height?: number;
  interactive?: boolean;
}

export function DataNetwork3D({
  className = "",
  height = 460,
  interactive = true,
}: DataNetwork3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    if (isReducedMotion()) return;

    let renderer: any = null;
    let animId: number;
    let isVisible = true;

    const initScene = async () => {
      try {
        const THREE = await import("three");
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || 540;
        const h = height;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(40, width / h, 0.1, 100);
        camera.position.set(0, 2, 32);

        // WebGL Renderer with alpha for seamless integration with light page
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          });
        } catch {
          return;
        }

        renderer.setSize(width, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Root Network Assembly
        const networkGroup = new THREE.Group();
        scene.add(networkGroup);

        // 1. Procedural Central Intelligence Core (Dark navy / charcoal wireframe against light bg)
        const coreGeo = new THREE.OctahedronGeometry(4.4, 1);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0x1e293b,
          wireframe: true,
          transparent: true,
          opacity: 0.75,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        networkGroup.add(coreMesh);

        // Inner solid core node (Controlled Blue Accent)
        const innerGeo = new THREE.OctahedronGeometry(2.0, 0);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          wireframe: true,
          transparent: true,
          opacity: 0.9,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        networkGroup.add(innerMesh);

        // 2. Horizon Plane Coordinate Lattice (Light subtle technical grid)
        const gridHelper = new THREE.GridHelper(30, 14, 0x94a3b8, 0xe2e8f0);
        gridHelper.position.y = -6;
        networkGroup.add(gridHelper);

        // 3. Procedural Inventory Data Nodes (Dark navy & royal blue against light bg)
        const isMobile = window.innerWidth < 768;
        const nodeCount = isMobile ? 26 : 44;
        const nodePositions = new Float32Array(nodeCount * 3);
        const nodeBaseAngles = new Float32Array(nodeCount);
        const nodeRadii = new Float32Array(nodeCount);
        const nodeSpeeds = new Float32Array(nodeCount);
        const nodeElevations = new Float32Array(nodeCount);

        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const radius = 6.5 + (i % 4) * 2.6;
          const elevation = Math.sin(i * 1.8) * 3.4;

          nodePositions[i * 3] = Math.cos(angle) * radius;
          nodePositions[i * 3 + 1] = elevation;
          nodePositions[i * 3 + 2] = Math.sin(angle) * radius;

          nodeBaseAngles[i] = angle;
          nodeRadii[i] = radius;
          nodeSpeeds[i] = 0.003 + (i % 3) * 0.002;
          nodeElevations[i] = elevation;
        }

        const nodesGeo = new THREE.BufferGeometry();
        nodesGeo.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));

        const nodesMat = new THREE.PointsMaterial({
          color: 0xffffff,
          size: 2.4,
          transparent: true,
          opacity: 0.9,
        });
        const nodesPoints = new THREE.Points(nodesGeo, nodesMat);
        networkGroup.add(nodesPoints);

        // 4. Vector Connection Lines (Subtle crisp slate blue)
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x93c5fd,
          transparent: true,
          opacity: 0.45,
        });
        const lineGeo = new THREE.BufferGeometry();
        const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
        networkGroup.add(lineMesh);

        // 5. Active Telemetry Pulse Signals (Vibrant blue data signals)
        const pulseCount = 12;
        const pulseGeo = new THREE.BufferGeometry();
        const pulsePos = new Float32Array(pulseCount * 3);
        pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));

        const pulseMat = new THREE.PointsMaterial({
          color: 0x2563eb,
          size: 3.6,
          transparent: true,
          opacity: 0.95,
        });
        const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
        networkGroup.add(pulsePoints);

        // Controlled Mouse Parallax
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onMouseMove = (e: MouseEvent) => {
          if (!interactive) return;
          const rect = container.getBoundingClientRect();
          const x = (e.clientX - rect.left) / width - 0.5;
          const y = (e.clientY - rect.top) / h - 0.5;
          targetX = x * 0.4;
          targetY = y * 0.4;
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });

        // Scroll Parallax
        let scrollY = 0;
        const onScroll = () => {
          scrollY = window.scrollY || 0;
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        const observer = new IntersectionObserver(([entry]) => {
          isVisible = entry.isIntersecting;
        });
        observer.observe(container);

        // Render Loop
        let clock = 0;
        const animate = () => {
          if (isVisible) {
            clock += 0.007;

            currentX += (targetX - currentX) * 0.05;
            currentY += (targetY - currentY) * 0.05;

            const scrollOffset = Math.min(scrollY / 700, 1.0);

            // Core rotation
            coreMesh.rotation.y = clock * 0.12;
            coreMesh.rotation.x = Math.sin(clock * 0.4) * 0.08;

            innerMesh.rotation.y = -clock * 0.22;
            innerMesh.rotation.z = clock * 0.14;

            // Update nodes
            const posAttr = nodesGeo.attributes.position;
            const posArr = posAttr.array as Float32Array;

            const linePositions: number[] = [];

            for (let i = 0; i < nodeCount; i++) {
              const currentAngle = nodeBaseAngles[i] + clock * nodeSpeeds[i] * 12;
              const r = nodeRadii[i];
              const x = Math.cos(currentAngle) * r;
              const z = Math.sin(currentAngle) * r;
              const y = nodeElevations[i] + Math.sin(clock * 1.5 + nodeBaseAngles[i]) * 0.4;

              posArr[i * 3] = x;
              posArr[i * 3 + 1] = y;
              posArr[i * 3 + 2] = z;

              const distToCenter = Math.sqrt(x * x + y * y + z * z);
              if (distToCenter < 12 && i % 2 === 0) {
                linePositions.push(0, 0, 0, x, y, z);
              }
            }
            posAttr.needsUpdate = true;

            lineMesh.geometry.dispose();
            lineMesh.geometry = new THREE.BufferGeometry();
            lineMesh.geometry.setAttribute(
              "position",
              new THREE.Float32BufferAttribute(linePositions, 3)
            );

            // Update telemetry pulses
            const pulseAttr = pulseGeo.attributes.position;
            const pulseArr = pulseAttr.array as Float32Array;
            for (let p = 0; p < pulseCount; p++) {
              const nodeIdx = (p * 3) % nodeCount;
              const progress = ((clock * 0.6 + p * 0.25) % 1);
              pulseArr[p * 3] = posArr[nodeIdx * 3] * (1 - progress);
              pulseArr[p * 3 + 1] = posArr[nodeIdx * 3 + 1] * (1 - progress);
              pulseArr[p * 3 + 2] = posArr[nodeIdx * 3 + 2] * (1 - progress);
            }
            pulseAttr.needsUpdate = true;

            networkGroup.rotation.y = currentX * 0.5;
            networkGroup.rotation.x = currentY * 0.35 + 0.05;
            networkGroup.position.y = -scrollOffset * 2.2;
            networkGroup.position.z = -scrollOffset * 2.0;

            renderer.render(scene, camera);
          }
          animId = requestAnimationFrame(animate);
        };

        animate();

        const onResize = () => {
          if (!container) return;
          const nw = container.clientWidth;
          camera.aspect = nw / h;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, h);
        };
        window.addEventListener("resize", onResize);

        return () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          observer.disconnect();
          cancelAnimationFrame(animId);

          coreGeo.dispose();
          coreMat.dispose();
          innerGeo.dispose();
          innerMat.dispose();
          nodesGeo.dispose();
          nodesMat.dispose();
          lineMat.dispose();
          pulseGeo.dispose();
          pulseMat.dispose();

          if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
            renderer.dispose();
          }
        };
      } catch (err) {
        console.warn("DataNetwork3D light init skipped:", err);
      }
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
      if (animId) cancelAnimationFrame(animId);
    };
  }, [height, interactive]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
