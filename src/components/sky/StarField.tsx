"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { StarData } from "@/lib/catalog";
import { raDecToCartesian } from "@/lib/coordinates";

interface StarFieldProps {
  stars: StarData[];
  maxMagnitude: number;
  pointSize: number;
}

function spectralColor(type: string): THREE.Color {
  switch (type) {
    case "O": return new THREE.Color(0.6, 0.7, 1.0);
    case "B": return new THREE.Color(0.7, 0.8, 1.0);
    case "A": return new THREE.Color(0.9, 0.9, 1.0);
    case "F": return new THREE.Color(1.0, 1.0, 0.9);
    case "G": return new THREE.Color(1.0, 1.0, 0.7);
    case "K": return new THREE.Color(1.0, 0.85, 0.6);
    case "M": return new THREE.Color(1.0, 0.7, 0.5);
    default: return new THREE.Color(1.0, 1.0, 1.0);
  }
}

function magnitudeToSize(mag: number, baseSize: number): number {
  const scaledMag = Math.max(-2, Math.min(mag, 10));
  return baseSize * Math.pow(10, -scaledMag / 5) * 0.5;
}

const SPHERE_RADIUS = 100;

export default function StarField({ stars, maxMagnitude, pointSize }: StarFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const filtered = stars.filter((s) => s.mag <= maxMagnitude);
    const count = filtered.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const star = filtered[i];
      const pos = raDecToCartesian({ ra: star.ra, dec: star.dec }, SPHERE_RADIUS);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const color = spectralColor(star.spectralType || "");
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = magnitudeToSize(star.mag, pointSize);
    }
    return { positions, colors, sizes };
  }, [stars, maxMagnitude, pointSize]);

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materialRef.current = mat;
    return mat;
  }, []);

  // Dispose material and geometry on unmount
  useEffect(() => {
    return () => {
      materialRef.current?.dispose();
      geometryRef.current?.dispose();
    };
  }, []);

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
}
