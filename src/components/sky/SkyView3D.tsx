"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import StarField from "./StarField";
import Planets from "./Planets";
import Horizon from "./Horizon";
import Constellations from "./Constellations";
import GridOverlay from "./GridOverlay";
import MilkyWay from "./MilkyWay";
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
const MIN_FOV = 10;
const MAX_FOV = 90;
const ZOOM_SPEED = 0.15;

/**
 * FOV-based zoom handler — scroll/pinch changes field of view instead of camera distance.
 * This is the correct approach for a sky sphere where the camera sits at the center.
 */
function FovZoomHandler() {
  const { camera, gl } = useThree();
  const targetFov = useRef((camera as THREE.PerspectiveCamera).fov);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const el = gl.domElement;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1 : -1;
      targetFov.current = Math.max(MIN_FOV, Math.min(MAX_FOV, targetFov.current + delta * ZOOM_SPEED * targetFov.current));
    };

    // Pinch zoom via touch
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist > 0) {
          const ratio = lastPinchDist / dist;
          targetFov.current = Math.max(MIN_FOV, Math.min(MAX_FOV, cam.fov * ratio));
        }
        lastPinchDist = dist;
      }
    };
    const onTouchEnd = () => { lastPinchDist = 0; };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [camera, gl]);

  // Smooth interpolation each frame
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const diff = targetFov.current - cam.fov;
    if (Math.abs(diff) > 0.01) {
      cam.fov += diff * 0.2;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

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

        <MilkyWay visible={preferences.showMilkyWay} />

        <GridOverlay visible={preferences.showGrid} />

        {preferences.showHorizon && <Horizon />}
      </Suspense>

      <FovZoomHandler />

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={-0.5}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
      />
    </Canvas>
  );
}
