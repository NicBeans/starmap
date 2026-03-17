"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
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
import { raDecToCartesian } from "@/lib/coordinates";

interface SkyView3DProps {
  stars: StarData[];
  constellationLines: ConstellationLine[];
  celestialBodies: CelestialBody[];
  satellites: SatellitePosition[];
  lodConfig: LODConfig;
  preferences: UserPreferences;
  onObjectClick?: (object: { id: string; name: string; type: string }) => void;
}

const STAR_SPHERE_RADIUS = 100;
const STAR_CLICK_THRESHOLD_DEG = 2; // angular tolerance for star picking

/**
 * Inner component that handles star click raycasting via useThree
 */
function StarClickHandler({
  stars,
  maxMagnitude,
  onStarClick,
}: {
  stars: StarData[];
  maxMagnitude: number;
  onStarClick: (star: StarData) => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const filteredStars = useMemo(
    () => stars.filter((s) => s.mag <= maxMagnitude),
    [stars, maxMagnitude]
  );

  const starPositions = useMemo(() => {
    return filteredStars.map((star) => {
      const pos = raDecToCartesian({ ra: star.ra, dec: star.dec }, STAR_SPHERE_RADIUS);
      return new THREE.Vector3(pos.x, pos.y, pos.z);
    });
  }, [filteredStars]);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Only handle primary button clicks
      if (e.button !== 0) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const rayDir = raycaster.ray.direction.clone().normalize();

      // Find the closest star to the ray (angular distance)
      const thresholdRad = (STAR_CLICK_THRESHOLD_DEG * Math.PI) / 180;
      let bestIdx = -1;
      let bestAngle = thresholdRad;

      for (let i = 0; i < starPositions.length; i++) {
        const starDir = starPositions[i].clone().normalize();
        const angle = Math.acos(Math.min(1, rayDir.dot(starDir)));
        if (angle < bestAngle) {
          bestAngle = angle;
          bestIdx = i;
        }
      }

      if (bestIdx >= 0) {
        onStarClick(filteredStars[bestIdx]);
      }
    },
    [camera, gl, raycaster, starPositions, filteredStars, onStarClick]
  );

  // Attach pointer listener to canvas
  useEffect(() => {
    const el = gl.domElement;
    el.addEventListener("pointerdown", handlePointerDown);
    return () => el.removeEventListener("pointerdown", handlePointerDown);
  }, [gl, handlePointerDown]);

  return null;
}

export default function SkyView3D({
  stars,
  constellationLines,
  celestialBodies,
  satellites,
  lodConfig,
  preferences,
  onObjectClick,
}: SkyView3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const handleCreated = useCallback(
    ({ camera }: { camera: THREE.Camera }) => {
      camera.position.set(0, 0, 0.1);
      camera.lookAt(0, 5, -50);
    },
    []
  );

  const handleBodyClick = useCallback(
    (body: CelestialBody) => {
      onObjectClick?.({ id: body.id, name: body.name, type: body.type });
    },
    [onObjectClick]
  );

  const handleSatelliteClick = useCallback(
    (sat: SatellitePosition) => {
      onObjectClick?.({ id: sat.id, name: sat.name, type: "satellite" });
    },
    [onObjectClick]
  );

  const handleStarClick = useCallback(
    (star: StarData) => {
      onObjectClick?.({
        id: `star_${star.id}`,
        name: star.name || star.bayer || `HIP ${star.hip}` || `Star ${star.id}`,
        type: "star",
      });
    },
    [onObjectClick]
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
        <StarClickHandler
          stars={stars}
          maxMagnitude={lodConfig.maxStarMagnitude}
          onStarClick={handleStarClick}
        />

        <StarField
          stars={stars}
          maxMagnitude={lodConfig.maxStarMagnitude}
          pointSize={lodConfig.starPointSize}
        />

        <Planets
          bodies={celestialBodies}
          showLabels={preferences.showLabels}
          onBodyClick={handleBodyClick}
        />

        <Satellites3D
          satellites={satellites}
          showLabels={preferences.showLabels}
          onSatelliteClick={handleSatelliteClick}
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
