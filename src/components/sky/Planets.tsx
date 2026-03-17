"use client";

import { useMemo, useEffect, useRef } from "react";
import { Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import type { CelestialBody } from "@/lib/astronomy";
import { altAzToCartesian } from "@/lib/coordinates";

interface PlanetsProps {
  bodies: CelestialBody[];
  showLabels: boolean;
  onBodyClick?: (body: CelestialBody) => void;
}

const BODY_COLORS: Record<string, string> = {
  Sun: "#ffdd44", Moon: "#ccccdd", Mercury: "#aaaaaa", Venus: "#ffffcc",
  Mars: "#ff6644", Jupiter: "#ffcc88", Saturn: "#ffddaa", Uranus: "#88ccff", Neptune: "#4466ff",
};

const SPHERE_RADIUS = 95;

export default function Planets({ bodies, showLabels, onBodyClick }: PlanetsProps) {
  const visibleBodies = useMemo(() => bodies.filter((b) => b.altitude > -5), [bodies]);

  const sharedGeoLarge = useRef(new THREE.CircleGeometry(3, 32));
  const sharedGeoSmall = useRef(new THREE.CircleGeometry(1.5, 32));

  useEffect(() => {
    return () => {
      sharedGeoLarge.current.dispose();
      sharedGeoSmall.current.dispose();
    };
  }, []);

  return (
    <group>
      {visibleBodies.map((body) => {
        const pos = altAzToCartesian({ altitude: body.altitude, azimuth: body.azimuth }, SPHERE_RADIUS);
        const color = BODY_COLORS[body.name] || "#ffffff";
        const isLarge = body.name === "Sun" || body.name === "Moon";

        return (
          <group key={body.id} position={[pos.x, pos.y, pos.z]}>
            <Billboard>
              <mesh
                geometry={isLarge ? sharedGeoLarge.current : sharedGeoSmall.current}
                onClick={(e) => {
                  e.stopPropagation();
                  onBodyClick?.(body);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "default";
                }}
              >
                <meshBasicMaterial color={color} transparent opacity={0.9} />
              </mesh>
            </Billboard>
            {showLabels && (
              <Billboard position={[0, (isLarge ? 3 : 1.5) + 1.5, 0]}>
                <Text fontSize={1.5} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.1} outlineColor="#000000">
                  {body.name}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}
