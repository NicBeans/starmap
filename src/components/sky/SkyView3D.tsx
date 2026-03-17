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
 * Finds the nearest star to a screen-space click using angular distance.
 * Called only when no R3F mesh (planet, satellite, constellation) was hit.
 */
function findNearestStar(
  event: MouseEvent,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  starPositions: THREE.Vector3[],
  filteredStars: StarData[],
): StarData | null {
  const rect = canvas.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const rayDir = raycaster.ray.direction.clone().normalize();

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

  return bestIdx >= 0 ? filteredStars[bestIdx] : null;
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

  const filteredStars = useMemo(
    () => stars.filter((s) => s.mag <= lodConfig.maxStarMagnitude),
    [stars, lodConfig.maxStarMagnitude]
  );

  const starPositions = useMemo(() => {
    return filteredStars.map((star) => {
      const pos = raDecToCartesian({ ra: star.ra, dec: star.dec }, STAR_SPHERE_RADIUS);
      return new THREE.Vector3(pos.x, pos.y, pos.z);
    });
  }, [filteredStars]);

  const cameraRef = useRef<THREE.Camera | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleCreatedFull = useCallback(
    ({ camera, gl: renderer }: { camera: THREE.Camera; gl: THREE.WebGLRenderer }) => {
      camera.position.set(0, 0, 0.1);
      camera.lookAt(0, 5, -50);
      cameraRef.current = camera;
      canvasRef.current = renderer.domElement;
    },
    []
  );

  // onPointerMissed fires when no R3F mesh was hit — fallback to star angular matching
  const handlePointerMissed = useCallback(
    (event: MouseEvent) => {
      if (!cameraRef.current || !canvasRef.current) return;
      const star = findNearestStar(event, cameraRef.current, canvasRef.current, starPositions, filteredStars);
      if (star) {
        onObjectClick?.({
          id: `star_${star.id}`,
          name: star.name || star.bayer || `HIP ${star.hip}` || `Star ${star.id}`,
          type: "star",
        });
      }
    },
    [starPositions, filteredStars, onObjectClick]
  );

  const handleConstellationClick = useCallback(
    (c: ConstellationLine) => {
      onObjectClick?.({
        id: `const_${c.constellation}`,
        name: c.name,
        type: "constellation",
      });
    },
    [onObjectClick]
  );

  return (
    <Canvas
      camera={{ fov: 60, near: 0.1, far: 500 }}
      onCreated={handleCreatedFull}
      onPointerMissed={handlePointerMissed}
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
          onConstellationClick={handleConstellationClick}
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
