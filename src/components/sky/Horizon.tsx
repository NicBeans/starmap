"use client";

import { useMemo } from "react";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";

const RADIUS = 100;
const SEGMENTS = 128;

const CARDINAL_DIRECTIONS = [
  { label: "N", azimuth: 0 },
  { label: "NE", azimuth: 45 },
  { label: "E", azimuth: 90 },
  { label: "SE", azimuth: 135 },
  { label: "S", azimuth: 180 },
  { label: "SW", azimuth: 225 },
  { label: "W", azimuth: 270 },
  { label: "NW", azimuth: 315 },
];

export default function Horizon() {
  const horizonPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          -RADIUS * Math.sin(angle),
          0,
          -RADIUS * Math.cos(angle)
        )
      );
    }
    return points;
  }, []);

  return (
    <group>
      {/* Horizon line */}
      <Line
        points={horizonPoints}
        color="#334466"
        lineWidth={1}
        transparent
        opacity={0.6}
      />

      {/* Ground plane (semi-transparent) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[RADIUS, 64]} />
        <meshBasicMaterial
          color="#0a0a1a"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cardinal direction labels */}
      {CARDINAL_DIRECTIONS.map(({ label, azimuth }) => {
        const az = (azimuth * Math.PI) / 180;
        const x = -RADIUS * 0.95 * Math.sin(az);
        const z = -RADIUS * 0.95 * Math.cos(az);
        const isPrimary = azimuth % 90 === 0;

        return (
          <Text
            key={label}
            position={[x, 2, z]}
            fontSize={isPrimary ? 3 : 2}
            color={isPrimary ? "#5588aa" : "#334466"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.15}
            outlineColor="#000000"
          >
            {label}
          </Text>
        );
      })}
    </group>
  );
}
