"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import type { ConstellationLine, StarData } from "@/lib/catalog";
import { raDecToCartesian } from "@/lib/coordinates";

interface ConstellationsProps {
  constellationLines: ConstellationLine[];
  stars: StarData[];
  visible: boolean;
}

const SPHERE_RADIUS = 99; // between stars and horizon

export default function Constellations({
  constellationLines,
  stars,
  visible,
}: ConstellationsProps) {
  const hipIndex = useMemo(() => {
    const map = new Map<number, StarData>();
    for (const star of stars) {
      if (star.hip) map.set(star.hip, star);
    }
    return map;
  }, [stars]);

  const lineSegments = useMemo(() => {
    if (!visible) return [];

    return constellationLines.flatMap((c) => {
      return c.segments
        .map(([hip1, hip2]) => {
          const s1 = hipIndex.get(hip1);
          const s2 = hipIndex.get(hip2);
          if (!s1 || !s2) return null;

          const p1 = raDecToCartesian(
            { ra: s1.ra, dec: s1.dec },
            SPHERE_RADIUS
          );
          const p2 = raDecToCartesian(
            { ra: s2.ra, dec: s2.dec },
            SPHERE_RADIUS
          );

          return {
            key: `${c.constellation}_${hip1}_${hip2}`,
            points: [
              new THREE.Vector3(p1.x, p1.y, p1.z),
              new THREE.Vector3(p2.x, p2.y, p2.z),
            ],
          };
        })
        .filter(Boolean) as { key: string; points: THREE.Vector3[] }[];
    });
  }, [constellationLines, hipIndex, visible]);

  if (!visible) return null;

  return (
    <group>
      {lineSegments.map(({ key, points }) => (
        <Line
          key={key}
          points={points}
          color="#223355"
          lineWidth={0.5}
          transparent
          opacity={0.4}
        />
      ))}
    </group>
  );
}
