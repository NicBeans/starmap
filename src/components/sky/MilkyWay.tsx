"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface MilkyWayProps {
  visible: boolean;
}

const SPHERE_RADIUS = 98;
const SEGMENTS = 128;
const BAND_WIDTH_DEG = 15; // half-width of the milky way band in degrees
const BAND_ROWS = 8;

/**
 * The Milky Way band rendered as a semi-transparent mesh tube
 * following the galactic plane across the celestial sphere.
 *
 * The galactic plane is inclined ~62.87° to the celestial equator,
 * with the galactic center at RA ~17h45m, Dec ~-29°.
 */
export default function MilkyWay({ visible }: MilkyWayProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const alphas: number[] = [];
    const indices: number[] = [];

    // Galactic coordinate system: the galactic plane is tilted 62.87° from the celestial equator
    // Galactic north pole is at RA=12h51m, Dec=+27.13°
    const galNorthRA = (12 + 51 / 60) * 15 * (Math.PI / 180); // in radians
    const galNorthDec = 27.13 * (Math.PI / 180);

    // Build rotation matrix: galactic coords -> equatorial coords
    // The galactic plane normal is the galactic north pole direction
    const nx = Math.cos(galNorthDec) * Math.cos(galNorthRA);
    const ny = Math.cos(galNorthDec) * Math.sin(galNorthRA);
    const nz = Math.sin(galNorthDec);
    const normal = new THREE.Vector3(nx, nz, -ny); // swap to Y-up

    // Create a rotation that aligns the XZ plane with the galactic plane
    const galRotation = new THREE.Quaternion();
    galRotation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
    const galMatrix = new THREE.Matrix4().makeRotationFromQuaternion(galRotation);

    // Generate a band of vertices around the galactic equator
    for (let row = 0; row <= BAND_ROWS; row++) {
      const latFrac = (row / BAND_ROWS) * 2 - 1; // -1 to 1
      const latRad = latFrac * BAND_WIDTH_DEG * (Math.PI / 180);

      for (let col = 0; col <= SEGMENTS; col++) {
        const lonRad = (col / SEGMENTS) * Math.PI * 2;

        // Position on the celestial sphere in galactic coords
        const x = SPHERE_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
        const y = SPHERE_RADIUS * Math.sin(latRad);
        const z = SPHERE_RADIUS * Math.cos(latRad) * Math.sin(lonRad);

        // Transform to equatorial (scene) coords
        const v = new THREE.Vector3(x, y, z).applyMatrix4(galMatrix);
        positions.push(v.x, v.y, v.z);

        // Opacity: strongest at center (latFrac=0), fading to edges
        // Also vary along longitude for a more natural look
        const edgeFade = 1 - Math.abs(latFrac) * Math.abs(latFrac);
        const lonVariation = 0.6 + 0.4 * Math.sin(lonRad * 3 + 1.5) * Math.sin(lonRad * 7 + 0.3);
        // Brighter near galactic center (lon ~0)
        const centerBright = 0.7 + 0.3 * Math.exp(-Math.pow(lonRad - Math.PI, 2) * 0.5);
        alphas.push(edgeFade * lonVariation * centerBright);
      }
    }

    // Build triangle indices
    const cols = SEGMENTS + 1;
    for (let row = 0; row < BAND_ROWS; row++) {
      for (let col = 0; col < SEGMENTS; col++) {
        const a = row * cols + col;
        const b = a + 1;
        const c = (row + 1) * cols + col;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("alpha", new THREE.Float32BufferAttribute(alphas, 1));
    geo.setIndex(indices);

    return geo;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          // Soft blue-white glow
          vec3 color = vec3(0.55, 0.6, 0.75);
          gl_FragColor = vec4(color, vAlpha * 0.12);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  if (!visible) return null;

  return <mesh geometry={geometry} material={material} />;
}
