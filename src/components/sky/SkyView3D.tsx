"use client";

import { Suspense, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import StarField from "./StarField";
import Planets from "./Planets";
import Horizon from "./Horizon";
import Constellations from "./Constellations";
import GridOverlay from "./GridOverlay";
import Satellites3D from "./Satellites3D";
import type { StarData, ConstellationLine } from "@/lib/catalog";
import type { CelestialBody } from "@/lib/astronomy";
import type { SatellitePosition } from "@/lib/satellites";
import type { LODConfig } from "@/lib/lod";
import type { UserPreferences } from "@/lib/storage";

interface SkyView3DProps {
  stars: StarData[];
  constellationLines: ConstellationLine[];
  celestialBodies: CelestialBody[];
  satellites: SatellitePosition[];
  lodConfig: LODConfig;
  preferences: UserPreferences;
  onObjectClick?: (object: { id: string; name: string; type: string }) => void;
}

export default function SkyView3D({
  stars,
  constellationLines,
  celestialBodies,
  satellites,
  lodConfig,
  preferences,
}: SkyView3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleCreated = useCallback(
    ({ camera }: { camera: THREE.Camera }) => {
      // Start looking north, slightly above horizon
      camera.position.set(0, 0, 0.1);
      camera.lookAt(0, 5, -50);
    },
    []
  );

  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 500 }}
      onCreated={handleCreated}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={["#0a0a1a"]} />

      <Suspense fallback={null}>
        <StarField
          stars={stars}
          maxMagnitude={lodConfig.maxStarMagnitude}
          pointSize={lodConfig.starPointSize}
        />

        <Planets
          bodies={celestialBodies}
          showLabels={preferences.showLabels}
        />

        <Satellites3D
          satellites={satellites}
          showLabels={preferences.showLabels}
        />

        <Constellations
          constellationLines={constellationLines}
          stars={stars}
          visible={preferences.showConstellationLines}
        />

        <GridOverlay visible={preferences.showGrid} />

        {preferences.showHorizon && <Horizon />}
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        enablePan={false}
        rotateSpeed={-0.5}
        zoomSpeed={0.5}
        minDistance={0.01}
        maxDistance={0.5}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </Canvas>
  );
}
