"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

interface GridOverlayProps {
  visible: boolean;
}

const RADIUS = 98;
const SEGMENTS = 64;

export default function GridOverlay({ visible }: GridOverlayProps) {
  const { altCircles, azLines } = useMemo(() => {
    if (!visible) return { altCircles: [], azLines: [] };

    const altCircles: { alt: number; points: THREE.Vector3[] }[] = [];
    const azLines: { az: number; points: THREE.Vector3[] }[] = [];

    // Altitude circles every 30 degrees
    for (let alt = 0; alt <= 90; alt += 30) {
      const altRad = (alt * Math.PI) / 180;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= SEGMENTS; i++) {
        const az = (i / SEGMENTS) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            -RADIUS * Math.cos(altRad) * Math.sin(az),
            RADIUS * Math.sin(altRad),
            -RADIUS * Math.cos(altRad) * Math.cos(az)
          )
        );
      }
      altCircles.push({ alt, points });
    }

    // Azimuth lines every 30 degrees
    for (let az = 0; az < 360; az += 30) {
      const azRad = (az * Math.PI) / 180;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= SEGMENTS / 2; i++) {
        const alt = (i / (SEGMENTS / 2)) * (Math.PI / 2);
        points.push(
          new THREE.Vector3(
            -RADIUS * Math.cos(alt) * Math.sin(azRad),
            RADIUS * Math.sin(alt),
            -RADIUS * Math.cos(alt) * Math.cos(azRad)
          )
        );
      }
      azLines.push({ az, points });
    }

    return { altCircles, azLines };
  }, [visible]);

  if (!visible) return null;

  return (
    <group>
      {altCircles.map(({ alt, points }) => (
        <Line
          key={`alt_${alt}`}
          points={points}
          color="#1a2a3a"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
      {azLines.map(({ az, points }) => (
        <Line
          key={`az_${az}`}
          points={points}
          color="#1a2a3a"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}
