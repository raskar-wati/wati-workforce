"use client";

import { useEffect, useRef } from "react";

/**
 * Pixel Orb Loader (Breathing) — design imported from Claude Design's
 * "Organic loaders" bundle (Pixel Orb Loader (Breathing).html).
 *
 * Renders a low-res canvas scaled up with nearest-neighbour for a pixel-art
 * look: a soft radial glow Bayer-dithered into a 5-step palette, with two
 * slate eye-dots at the centre. The orb breathes (radius oscillates) and
 * blinks every few seconds.
 *
 * Stored for future use as a thinking indicator. Not wired anywhere yet.
 *
 * Props are optional — defaults match the original design exactly.
 */

const DEFAULT_PALETTE = [
  "#e8f6ef",
  "#d2efe0",
  "#b7e6cd",
  "#97d8b5",
  "#76c79b",
] as const;

const DEFAULT_EYE_COLOR = "#586672";

// 4×4 ordered-dither (Bayer) matrix, normalized to (0..1) thresholds.
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));

export type PixelOrbLoaderProps = {
  /** Rendered (display) size in pixels — square. Default 180. */
  size?: number;
  /** Logical pixel-grid resolution. Default 56 ("Fine" in the source). */
  gridResolution?: number;
  /** Light-to-deep colour stops for the glow. */
  palette?: readonly string[];
  /** Colour of the eye dots. */
  eyeColor?: string;
  /** Cells between eyes (calibrated against a 40-cell baseline). */
  eyeGap?: number;
  /** Seconds between blinks. */
  blinkEvery?: number;
  /** Pause the animation (still renders one frame). */
  paused?: boolean;
  className?: string;
};

export function PixelOrbLoader({
  size = 180,
  gridResolution = 56,
  palette = DEFAULT_PALETTE,
  eyeColor = DEFAULT_EYE_COLOR,
  eyeGap = 4,
  blinkEvery = 3,
  paused = false,
  className,
}: PixelOrbLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const N = gridResolution;
    let raf = 0;
    let stopped = false;

    // Soft radial core: 1 at centre, fading to 0 at radius r — multiplied by
    // 1.35 to push more saturated pixels into the palette near the centre.
    const disc = (
      x: number,
      y: number,
      cx: number,
      cy: number,
      r: number,
    ) => (1 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r) * 1.35;

    // Dither a continuous 0..1 intensity field into the palette.
    const drawGlow = (field: (x: number, y: number) => number) => {
      const L = palette.length;
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          let t = field(x, y);
          if (t <= 0) continue;
          if (t > 1) t = 1;
          const pos = t * L - 1;
          const base = Math.floor(pos);
          const idx =
            pos - base > BAYER[y & 3][x & 3] ? base + 1 : base;
          if (idx < 0) continue;
          const clamped = idx > L - 1 ? L - 1 : idx;
          ctx.fillStyle = palette[clamped];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    };

    // Eye lid height shrinks to blink. blinkOpen returns 1 (open) → 0 (closed)
    // → 1 (open) within a 160ms window every `blinkEvery` seconds.
    const blinkOpen = (t: number) => {
      const dur = 0.16;
      const ph = t % blinkEvery;
      if (ph < dur) return Math.abs(Math.cos((ph / dur) * Math.PI));
      return 1;
    };

    const drawEyes = (cx: number, cy: number, blink: number) => {
      const eyeSize = Math.max(2, Math.round(N * 0.05));
      const gap = eyeGap * (N / 40);
      const h = Math.max(1, Math.round(eyeSize * blink));
      ctx.fillStyle = eyeColor;
      ctx.fillRect(
        Math.round(cx - gap / 2 - eyeSize / 2),
        Math.round(cy - h / 2),
        eyeSize,
        h,
      );
      ctx.fillRect(
        Math.round(cx + gap / 2 - eyeSize / 2),
        Math.round(cy - h / 2),
        eyeSize,
        h,
      );
    };

    const renderFrame = (ms: number) => {
      const t = ms / 1000;
      const c = N / 2;
      const r = N * 0.3 * (1 + 0.16 * Math.sin(t * 1.7)); // breathing radius
      const blink = blinkOpen(t);

      ctx.clearRect(0, 0, N, N);
      drawGlow((x, y) => disc(x, y, c, c, r));
      drawEyes(c, c, blink);
    };

    const tick = (ms: number) => {
      if (stopped) return;
      renderFrame(ms);
      raf = requestAnimationFrame(tick);
    };

    if (paused) {
      // Render a single frame so the orb is visible at rest.
      renderFrame(0);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [gridResolution, palette, eyeColor, eyeGap, blinkEvery, paused]);

  return (
    <canvas
      ref={canvasRef}
      width={gridResolution}
      height={gridResolution}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        // Fallback for browsers that prefer "crisp-edges"
        // (image-rendering accepts both; CSSProperties allows either string).
      }}
      aria-hidden
    />
  );
}
