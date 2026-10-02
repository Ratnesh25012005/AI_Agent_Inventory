"use client";

import React, { useEffect, useRef } from "react";
import { isReducedMotion } from "@/lib/gsap";

interface Hero3DProps {
  className?: string;
  height?: number;
}

export function Hero3D({ className = "", height = 520 }: Hero3DProps) {
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

        const width = container.clientWidth || 550;
        const h = height;

        // Scene
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(45, width / h, 0.1, 1000);
        camera.position.set(0, 0, 36);

        // Renderer
        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        } catch {
          return;
        }

        renderer.setSize(width, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.innerHTML = "";
        container.appendChild(renderer.domElement);

        // Main Group
        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // 1. Core Geometric Decision Structure (Multi-faceted crystal / node)
        const coreGeo = new THREE.IcosahedronGeometry(7, 1);
        const coreMat = new THREE.MeshBasicMaterial({
          color: 0x3b82f6,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        mainGroup.add(coreMesh);

        // Inner solid core node
        const innerGeo = new THREE.OctahedronGeometry(3.5, 0);
        const innerMat = new THREE.MeshBasicMaterial({
          color: 0x60a5fa,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        mainGroup.add(innerMesh);

        // 2. Orbital Predictive Rings (Demand forecast envelopes)
        const ringGeo1 = new THREE.RingGeometry(11, 11.3, 64);
        const ringMat1 = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        });
        const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
        ringMesh1.rotation.x = Math.PI / 3;
        mainGroup.add(ringMesh1);

        const ringGeo2 = new THREE.RingGeometry(14, 14.25, 64);
        const ringMat2 = new THREE.MeshBasicMaterial({
          color: 0x818cf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
        });
        const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
        ringMesh2.rotation.y = Math.PI / 4;
        ringMesh2.rotation.x = -Math.PI / 6;
        mainGroup.add(ringMesh2);

        // 3. Inventory Stock Nodes (Hovering Data Nodes representing SKUs)
        const nodesGroup = new THREE.Group();
        const nodeGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const nodeCount = 14;
        const nodes: any[] = [];

        const nodeColors = [0x3b82f6, 0x10b981, 0x38bdf8, 0xf59e0b];

        for (let i = 0; i < nodeCount; i++) {
          const color = nodeColors[i % nodeColors.length];
          const nodeMat = new THREE.MeshBasicMaterial({
            color,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
          });
          const node = new THREE.Mesh(nodeGeometry, nodeMat);
          
          const angle = (i / nodeCount) * Math.PI * 2;
          const radius = 9.5 + (i % 3) * 2.2;
          const y = (Math.sin(i * 1.5) * 4);
          
          node.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          nodes.push({ mesh: node, baseAngle: angle, radius, speed: 0.008 + (i % 4) * 0.003, yOffset: y });
          nodesGroup.add(node);
        }
        mainGroup.add(nodesGroup);

        // 4. Ingestion Data Stream Particles
        const particleCount = 120;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const r = 10 + Math.random() * 15;

          positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i * 3 + 2] = r * Math.cos(phi);
        }

        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0x60a5fa,
          size: 1.2,
          transparent: true,
          opacity: 0.55,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        mainGroup.add(particles);

        // Pointer Parallax
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const onMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const x = (e.clientX - rect.left) / width - 0.5;
          const y = (e.clientY - rect.top) / h - 0.5;
          targetX = x * 0.8;
          targetY = y * 0.8;
        };

        window.addEventListener("mousemove", onMouseMove, { passive: true });

        // Scroll listener for smooth 3D reactivity
        let scrollY = 0;
        const onScroll = () => {
          scrollY = window.scrollY || 0;
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        // Render loop
        let clock = 0;
        const animate = () => {
          clock += 0.01;

          // Smooth mouse dampening
          currentX += (targetX - currentX) * 0.05;
          currentY += (targetY - currentY) * 0.05;

          // Scroll influence
          const scrollFactor = Math.min(scrollY / 600, 1.5);

          // Rotate core
          coreMesh.rotation.y = clock * 0.12 + currentX * 0.5;
          coreMesh.rotation.x = clock * 0.08 + currentY * 0.5;

          innerMesh.rotation.y = -clock * 0.18;
          innerMesh.rotation.z = clock * 0.1;

          // Rotate rings
          ringMesh1.rotation.z = clock * 0.15;
          ringMesh2.rotation.z = -clock * 0.12;

          // Orbit nodes
          nodes.forEach((n) => {
            const currentAngle = n.baseAngle + clock * n.speed * 20;
            n.mesh.position.x = Math.cos(currentAngle) * n.radius;
            n.mesh.position.z = Math.sin(currentAngle) * n.radius;
            n.mesh.position.y = n.yOffset + Math.sin(clock * 2 + n.baseAngle) * 0.8;
            n.mesh.rotation.x += 0.02;
            n.mesh.rotation.y += 0.03;
          });

          // Rotate particles
          particles.rotation.y = clock * 0.05;

          // Main group subtle tilt + scroll reaction
          mainGroup.rotation.y = currentX * 0.6;
          mainGroup.rotation.x = currentY * 0.4;
          mainGroup.position.y = -scrollFactor * 3.5;
          mainGroup.position.z = -scrollFactor * 4;

          renderer.render(scene, camera);
          animId = requestAnimationFrame(animate);
        };

        animate();

        // Resize
        const onResize = () => {
          if (!container) return;
          const nw = container.clientWidth;
          camera.aspect = nw / h;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, h);
        };
        window.addEventListener("resize", onResize);

        // Cleanup
        return () => {
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animId);

          coreGeo.dispose();
          coreMat.dispose();
          innerGeo.dispose();
          innerMat.dispose();
          ringGeo1.dispose();
          ringMat1.dispose();
          ringGeo2.dispose();
          ringMat2.dispose();
          nodeGeometry.dispose();
          particleGeo.dispose();
          particleMat.dispose();

          if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
            renderer.dispose();
          }
        };
      } catch (err) {
        console.warn("Hero3D initialization error:", err);
      }
    };

    const cleanupPromise = initScene();

    return () => {
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === "function") cleanup();
      });
      if (animId) cancelAnimationFrame(animId);
    };
  }, [height]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
