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
  onConstellationClick?: (constellation: ConstellationLine) => void;
}

const SPHERE_RADIUS = 99;
const HIT_TUBE_RADIUS = 2; // invisible click target width

export default function Constellations({
  constellationLines,
  stars,
  visible,
  onConstellationClick,
}: ConstellationsProps) {
  const hipIndex = useMemo(() => {
    const map = new Map<number, StarData>();
    for (const star of stars) {
      if (star.hip) map.set(star.hip, star);
    }
    return map;
  }, [stars]);

  const constellationData = useMemo(() => {
    if (!visible) return [];

    return constellationLines.map((c) => {
      const seen = new Set<string>();
      const segments = c.segments
        .map(([hip1, hip2]) => {
          const s1 = hipIndex.get(hip1);
          const s2 = hipIndex.get(hip2);
          if (!s1 || !s2) return null;

          let key = `${c.constellation}_${hip1}_${hip2}`;
          if (seen.has(key)) {
            key = `${key}_${seen.size}`;
          }
          seen.add(key);

          const p1 = raDecToCartesian({ ra: s1.ra, dec: s1.dec }, SPHERE_RADIUS);
          const p2 = raDecToCartesian({ ra: s2.ra, dec: s2.dec }, SPHERE_RADIUS);

          return {
            key,
            start: new THREE.Vector3(p1.x, p1.y, p1.z),
            end: new THREE.Vector3(p2.x, p2.y, p2.z),
          };
        })
        .filter(Boolean) as { key: string; start: THREE.Vector3; end: THREE.Vector3 }[];

      return { constellation: c, segments };
    });
  }, [constellationLines, hipIndex, visible]);

  if (!visible) return null;

  return (
    <group>
      {constellationData.map(({ constellation, segments }) => (
        <group key={constellation.constellation}>
          {segments.map(({ key, start, end }) => (
            <group key={key}>
              {/* Visible line */}
              <Line
                points={[start, end]}
                color="#4488cc"
                lineWidth={1.5}
                transparent
                opacity={0.6}
              />
              {/* Invisible clickable tube */}
              <ClickableTube
                start={start}
                end={end}
                onClick={() => onConstellationClick?.(constellation)}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * An invisible tube mesh between two points that acts as a click target.
 */
function ClickableTube({
  start,
  end,
  onClick,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  onClick: () => void;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { position: mid, quaternion: quat, length: len };
  }, [start, end]);

  return (
    <mesh
      position={position}
      quaternion={quaternion}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <cylinderGeometry args={[HIT_TUBE_RADIUS, HIT_TUBE_RADIUS, length, 6]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
