import type {
  IllustrativePositional,
  IllustrativeShot,
  PlayerId,
} from "./types";

/**
 * ILLUSTRATIVE positional data generator (P6-4).
 *
 * Free positional feeds (heatmaps / shotmaps) are NOT available, so this is a
 * DETERMINISTIC placeholder. It uses a small seeded PRNG (mulberry32) keyed by a
 * hash of the player id — NO Math.random / Date / clock — so the same player
 * always yields byte-identical output. The result carries `illustrative:true`
 * so the UI can badge it. NOT real tracking data; documented in DATA_REPORT.md.
 */

export const HEATMAP_ROWS = 10;
export const HEATMAP_COLS = 16;
const SHOT_COUNT = 24;

/** FNV-1a 32-bit string hash → deterministic seed. */
function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — deterministic, no global state. Returns [0,1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build a plausible attacking heatmap: a base radial intensity centered on the
 * attacking third + left/right channel bias seeded per player, then jittered.
 * Each cell is in [0,1].
 */
function buildHeatmap(rand: () => number): number[][] {
  // Per-player attacking "home" cell — biased toward the final third (high col).
  const centerCol = HEATMAP_COLS * (0.62 + rand() * 0.28);
  const centerRow = HEATMAP_ROWS * (0.3 + rand() * 0.4);
  const spread = 4 + rand() * 3;

  const grid: number[][] = [];
  let max = 0;
  for (let r = 0; r < HEATMAP_ROWS; r += 1) {
    const cells: number[] = [];
    for (let c = 0; c < HEATMAP_COLS; c += 1) {
      const dr = r - centerRow;
      const dc = c - centerCol;
      const dist2 = (dr * dr + dc * dc) / (spread * spread);
      const base = Math.exp(-dist2);
      const jitter = rand() * 0.15;
      const v = base + jitter;
      if (v > max) max = v;
      cells.push(v);
    }
    grid.push(cells);
  }
  // Normalize to [0,1].
  const norm = max > 0 ? max : 1;
  return grid.map((row) => row.map((v) => round2(Math.min(1, v / norm))));
}

const OUTCOMES: ReadonlyArray<IllustrativeShot["outcome"]> = ["goal", "saved", "missed"];

/**
 * Build a plausible shotmap on a normalized 0..1 pitch HALF: x toward goal
 * (clustered near the box), y across the pitch, an xg weight, and an outcome.
 */
function buildShotmap(rand: () => number): IllustrativeShot[] {
  const shots: IllustrativeShot[] = [];
  for (let i = 0; i < SHOT_COUNT; i += 1) {
    // x: shots cluster in the attacking third near goal (0.6..1.0).
    const x = round2(0.6 + rand() * 0.4);
    // y: clustered around the center (0.5) with some width.
    const y = round2(Math.min(1, Math.max(0, 0.5 + (rand() - 0.5) * 0.8)));
    // xg: closer to goal (higher x) → higher xg, plus noise.
    const xg = round2(Math.min(0.95, Math.max(0.02, (x - 0.55) * 1.4 + rand() * 0.15)));
    const outcome = OUTCOMES[Math.floor(rand() * OUTCOMES.length)];
    shots.push({ x, y, xg, outcome });
  }
  return shots;
}

/** Deterministic illustrative positional data for a player. */
export function getIllustrativePositional(player: PlayerId): IllustrativePositional {
  const rand = mulberry32(hashSeed(`positional::${player}`));
  return {
    heatmap: buildHeatmap(rand),
    shotmap: buildShotmap(rand),
    illustrative: true,
  };
}
