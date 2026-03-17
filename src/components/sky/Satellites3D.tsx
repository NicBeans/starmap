"use client";

import { useMemo, useEffect, useRef } from "react";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { SatellitePosition } from "@/lib/satellites";
import { altAzToCartesian } from "@/lib/coordinates";

interface Satellites3DProps {
  satellites: SatellitePosition[];
  showLabels: boolean;
  onSatelliteClick?: (sat: SatellitePosition) => void;
}

const SPHERE_RADIUS = 90;

export default function Satellites3D({ satellites, showLabels, onSatelliteClick }: Satellites3DProps) {
  const visibleSats = useMemo(() => satellites.filter((s) => s.altitude > 0), [satellites]);

  const sharedGeo = useRef(new THREE.CircleGeometry(0.6, 16));

  useEffect(() => {
    return () => {
      sharedGeo.current.dispose();
    };
  }, []);

  return (
    <group>
      {visibleSats.map((sat) => {
        const pos = altAzToCartesian({ altitude: sat.altitude, azimuth: sat.azimuth }, SPHERE_RADIUS);
        return (
          <group key={sat.id} position={[pos.x, pos.y, pos.z]}>
            <Billboard>
              <mesh
                geometry={sharedGeo.current}
                onClick={(e) => {
                  e.stopPropagation();
                  onSatelliteClick?.(sat);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "default";
                }}
              >
                <meshBasicMaterial color="#44ff88" transparent opacity={0.8} />
              </mesh>
            </Billboard>
            {showLabels && (
              <Billboard position={[0, 1.5, 0]}>
                <Text fontSize={1} color="#44ff88" anchorX="center" anchorY="bottom" outlineWidth={0.08} outlineColor="#000000">
                  {sat.name}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}
