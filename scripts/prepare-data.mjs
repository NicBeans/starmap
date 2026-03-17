#!/usr/bin/env node

/**
 * Downloads the HYG star database and generates optimized JSON catalog files.
 * Run: node scripts/prepare-data.mjs
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { gunzipSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

mkdirSync(DATA_DIR, { recursive: true });

// ── HYG Star Database ──
// Source: https://github.com/astronexus/HYG-Database
const HYG_URL =
  "https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v42.csv.gz";

console.log("Downloading HYG star database...");
const hygResponse = await fetch(HYG_URL);
if (!hygResponse.ok) throw new Error(`Failed to fetch HYG: ${hygResponse.status}`);
const hygBuffer = Buffer.from(await hygResponse.arrayBuffer());
const hygText = gunzipSync(hygBuffer).toString("utf-8");

const lines = hygText.split("\n");
const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

function col(name) {
  const idx = headers.indexOf(name);
  if (idx === -1) {
    console.warn(`Column "${name}" not found. Available: ${headers.join(", ")}`);
  }
  return idx;
}

function parseField(fields, colIdx) {
  if (colIdx < 0 || colIdx >= fields.length) return "";
  return fields[colIdx].replace(/"/g, "").trim();
}

const stars = [];
for (let i = 1; i < lines.length; i++) {
  const fields = lines[i].split(",");
  if (fields.length < 10) continue;

  const ra = parseFloat(parseField(fields, col("ra")));
  const dec = parseFloat(parseField(fields, col("dec")));
  const mag = parseFloat(parseField(fields, col("mag")));
  const hip = parseInt(parseField(fields, col("hip"))) || null;
  const proper = parseField(fields, col("proper")) || null;
  const bayer = parseField(fields, col("bayer")) || null;
  const con = parseField(fields, col("con")) || "";
  const spect = parseField(fields, col("spect")) || "";
  const dist = parseFloat(parseField(fields, col("dist"))) || -1;

  if (isNaN(ra) || isNaN(dec) || isNaN(mag)) continue;

  // Compact: reduce precision to shrink file size
  const star = {
    id: i,
    ra: +ra.toFixed(5),
    dec: +dec.toFixed(5),
    mag: +mag.toFixed(2),
  };
  // Only include optional fields if they have values
  if (hip) star.hip = hip;
  if (proper) star.name = proper;
  if (bayer) star.bayer = bayer;
  if (con) star.constellation = con;
  if (spect) star.spectralType = spect.charAt(0); // just spectral class letter
  if (dist > 0) star.distance = +dist.toFixed(1);
  stars.push(star);
}

// Sort by magnitude (brightest first)
stars.sort((a, b) => a.mag - b.mag);

console.log(`Processed ${stars.length} stars`);
writeFileSync(join(DATA_DIR, "stars.json"), JSON.stringify(stars));
console.log(`Wrote stars.json (${(JSON.stringify(stars).length / 1024 / 1024).toFixed(1)} MB)`);

// ── Messier + notable NGC deep sky objects ──
// Manually curated list of the most notable DSOs
const dsos = [
  { id: "M1", name: "Crab Nebula", type: "nebula", ra: 5.575, dec: 22.017, mag: 8.4, constellation: "Tau", sizeArcmin: 6 },
  { id: "M13", name: "Hercules Cluster", type: "cluster", ra: 16.695, dec: 36.462, mag: 5.8, constellation: "Her", sizeArcmin: 20 },
  { id: "M27", name: "Dumbbell Nebula", type: "planetary_nebula", ra: 19.993, dec: 22.722, mag: 7.5, constellation: "Vul", sizeArcmin: 8 },
  { id: "M31", name: "Andromeda Galaxy", type: "galaxy", ra: 0.712, dec: 41.269, mag: 3.4, constellation: "And", sizeArcmin: 190 },
  { id: "M33", name: "Triangulum Galaxy", type: "galaxy", ra: 1.564, dec: 30.660, mag: 5.7, constellation: "Tri", sizeArcmin: 73 },
  { id: "M42", name: "Orion Nebula", type: "nebula", ra: 5.588, dec: -5.391, mag: 4.0, constellation: "Ori", sizeArcmin: 85 },
  { id: "M44", name: "Beehive Cluster", type: "cluster", ra: 8.672, dec: 19.672, mag: 3.7, constellation: "Cnc", sizeArcmin: 95 },
  { id: "M45", name: "Pleiades", type: "cluster", ra: 3.791, dec: 24.105, mag: 1.6, constellation: "Tau", sizeArcmin: 110 },
  { id: "M51", name: "Whirlpool Galaxy", type: "galaxy", ra: 13.498, dec: 47.195, mag: 8.4, constellation: "CVn", sizeArcmin: 11 },
  { id: "M57", name: "Ring Nebula", type: "planetary_nebula", ra: 18.893, dec: 33.029, mag: 8.8, constellation: "Lyr", sizeArcmin: 1.4 },
  { id: "M81", name: "Bode's Galaxy", type: "galaxy", ra: 9.926, dec: 69.065, mag: 6.9, constellation: "UMa", sizeArcmin: 27 },
  { id: "M82", name: "Cigar Galaxy", type: "galaxy", ra: 9.926, dec: 69.681, mag: 8.4, constellation: "UMa", sizeArcmin: 11 },
  { id: "M101", name: "Pinwheel Galaxy", type: "galaxy", ra: 14.053, dec: 54.349, mag: 7.9, constellation: "UMa", sizeArcmin: 29 },
  { id: "M104", name: "Sombrero Galaxy", type: "galaxy", ra: 12.666, dec: -11.623, mag: 8.0, constellation: "Vir", sizeArcmin: 9 },
  { id: "M8", name: "Lagoon Nebula", type: "nebula", ra: 18.063, dec: -24.384, mag: 6.0, constellation: "Sgr", sizeArcmin: 90 },
  { id: "M16", name: "Eagle Nebula", type: "nebula", ra: 18.314, dec: -13.787, mag: 6.0, constellation: "Ser", sizeArcmin: 7 },
  { id: "M17", name: "Omega Nebula", type: "nebula", ra: 18.346, dec: -16.177, mag: 6.0, constellation: "Sgr", sizeArcmin: 11 },
  { id: "M20", name: "Trifid Nebula", type: "nebula", ra: 18.044, dec: -23.030, mag: 6.3, constellation: "Sgr", sizeArcmin: 28 },
  { id: "M22", name: "Sagittarius Cluster", type: "cluster", ra: 18.607, dec: -23.905, mag: 5.1, constellation: "Sgr", sizeArcmin: 32 },
  { id: "M35", name: null, type: "cluster", ra: 6.149, dec: 24.333, mag: 5.3, constellation: "Gem", sizeArcmin: 28 },
  { id: "M37", name: null, type: "cluster", ra: 5.873, dec: 32.553, mag: 6.2, constellation: "Aur", sizeArcmin: 24 },
  { id: "M41", name: null, type: "cluster", ra: 6.783, dec: -20.733, mag: 4.5, constellation: "CMa", sizeArcmin: 38 },
  { id: "M46", name: null, type: "cluster", ra: 7.697, dec: -14.817, mag: 6.1, constellation: "Pup", sizeArcmin: 27 },
  { id: "M47", name: null, type: "cluster", ra: 7.614, dec: -14.500, mag: 4.2, constellation: "Pup", sizeArcmin: 30 },
  { id: "M48", name: null, type: "cluster", ra: 8.228, dec: -5.800, mag: 5.5, constellation: "Hya", sizeArcmin: 54 },
  { id: "M50", name: null, type: "cluster", ra: 7.045, dec: -8.333, mag: 5.9, constellation: "Mon", sizeArcmin: 16 },
  { id: "M52", name: null, type: "cluster", ra: 23.404, dec: 61.594, mag: 5.0, constellation: "Cas", sizeArcmin: 13 },
  { id: "NGC869", name: "Double Cluster (h)", type: "cluster", ra: 2.322, dec: 57.133, mag: 5.3, constellation: "Per", sizeArcmin: 30 },
  { id: "NGC884", name: "Double Cluster (χ)", type: "cluster", ra: 2.370, dec: 57.150, mag: 6.1, constellation: "Per", sizeArcmin: 30 },
  { id: "NGC7000", name: "North America Nebula", type: "nebula", ra: 20.988, dec: 44.333, mag: 4.0, constellation: "Cyg", sizeArcmin: 120 },
  { id: "M78", name: null, type: "nebula", ra: 5.779, dec: 0.081, mag: 8.3, constellation: "Ori", sizeArcmin: 8 },
  { id: "M97", name: "Owl Nebula", type: "planetary_nebula", ra: 11.247, dec: 55.019, mag: 9.9, constellation: "UMa", sizeArcmin: 3.4 },
];

writeFileSync(join(DATA_DIR, "dso.json"), JSON.stringify(dsos, null, 0));
console.log(`Wrote dso.json (${dsos.length} objects)`);

// ── Constellation lines ──
// Using Hipparcos star IDs to define stick figures
const constellations = [
  {
    constellation: "UMa",
    name: "Ursa Major",
    segments: [
      [54061, 53910], [53910, 58001], [58001, 59774],
      [59774, 62956], [62956, 65378], [65378, 67301],
      [59774, 54061],
    ],
  },
  {
    constellation: "Ori",
    name: "Orion",
    segments: [
      [26727, 26311], [26311, 25336], [25336, 25930], [25930, 27366],
      [27366, 26727], [26727, 27989], [27989, 28614],
      [26311, 25281], [25281, 24436],
      [25336, 25930],
      [27366, 28716],
    ],
  },
  {
    constellation: "Cas",
    name: "Cassiopeia",
    segments: [
      [3179, 4427], [4427, 6686], [6686, 8886], [8886, 11569],
    ],
  },
  {
    constellation: "Cyg",
    name: "Cygnus",
    segments: [
      [102098, 100453], [100453, 97649], [97649, 95947],
      [97649, 98110], [98110, 102488],
      [97649, 95853],
    ],
  },
  {
    constellation: "Leo",
    name: "Leo",
    segments: [
      [49583, 50583], [50583, 50335], [50335, 49669],
      [49669, 49583], [49583, 48455],
      [50583, 54872], [54872, 57632],
      [49669, 47908],
    ],
  },
  {
    constellation: "Sco",
    name: "Scorpius",
    segments: [
      [78820, 80763], [80763, 82396], [82396, 82514],
      [82514, 84143], [84143, 86228], [86228, 87073],
      [80763, 78265], [78265, 78104],
    ],
  },
  {
    constellation: "Gem",
    name: "Gemini",
    segments: [
      [36850, 35550], [35550, 34088], [34088, 32362],
      [37826, 36962], [36962, 35350], [35350, 34693],
    ],
  },
  {
    constellation: "Crx",
    name: "Crux",
    segments: [
      [60718, 62434], [61084, 59747],
    ],
  },
  {
    constellation: "CMa",
    name: "Canis Major",
    segments: [
      [32349, 33579], [33579, 34444], [34444, 35904],
      [32349, 31592], [31592, 30324],
      [32349, 33152],
    ],
  },
  {
    constellation: "Lyr",
    name: "Lyra",
    segments: [
      [91262, 91971], [91971, 92420], [92420, 93194],
      [93194, 92791], [92791, 91971],
    ],
  },
  {
    constellation: "Aql",
    name: "Aquila",
    segments: [
      [97649, 98036], [98036, 99473],
      [97649, 95501],
    ],
  },
  {
    constellation: "Tau",
    name: "Taurus",
    segments: [
      [21421, 20889], [20889, 20455], [20455, 20205],
      [21421, 21881], [21881, 25428],
      [21421, 20894],
    ],
  },
];

writeFileSync(
  join(DATA_DIR, "constellations.json"),
  JSON.stringify(constellations, null, 0)
);
console.log(`Wrote constellations.json (${constellations.length} constellations)`);

console.log("\nData preparation complete!");
