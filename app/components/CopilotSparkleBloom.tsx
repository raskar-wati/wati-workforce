"use client";

import { useEffect, useId, useState } from "react";
import { CopilotIcon } from "./icons/CopilotIcon";
import {
  SPARKLE_BIG_PATH,
  SPARKLE_GRADIENT_FROM,
  SPARKLE_GRADIENT_TO,
  SPARKLE_SMALL_PATH,
  SPARKLE_SMALL_UNDERLAY_PATH,
  SPARKLE_UNDERLAY_FILL,
} from "./icons/copilot-sparkle-paths";

/**
 * The Copilot sparkle as a one-shot splash: the large star swings in and
 * overshoots, the small one pops after it, and a glow + ring wash outward
 * and dissipate. Animation classes live in globals.css (`.copilot-bloom*`)
 * with fill-mode `both`, so this plays once on mount and holds the resting
 * sparkle — there is no loop and nothing to clean up.
 *
 * Pass `play={false}` to render the plain resting mark instead, for repeat
 * visits within a session where the splash has already been spent.
 */
export function CopilotSparkleBloom({
  size = 40,
  play = true,
  onPlayed,
}: {
  size?: number;
  /** false → skip the splash and render the static mark. */
  play?: boolean;
  /** Fired once when the splash actually runs, so the caller can spend it. */
  onPlayed?: () => void;
}) {
  const uid = useId();
  const gradientId = `copilot-bloom-grad-${uid}`;
  // Captured at mount so a re-render mid-flight (a keystroke in the
  // composer, say) can't swap the animating mark out from under itself.
  const [animate] = useState(play);

  useEffect(() => {
    if (animate) onPlayed?.();
    // Mount-only: the splash is spent the moment it starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  if (!animate) return <CopilotIcon variant="solid" size={size} />;

  return (
    <span className="copilot-bloom" style={{ width: size, height: size }}>
      <span className="copilot-bloom__glow" aria-hidden />
      <span className="copilot-bloom__ring" aria-hidden />
      <svg
        className="copilot-bloom__mark"
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="0.4"
            y1="1.5"
            x2="15.5"
            y2="14.5"
          >
            <stop offset="0" stopColor={SPARKLE_GRADIENT_FROM} />
            <stop offset="1" stopColor={SPARKLE_GRADIENT_TO} />
          </linearGradient>
        </defs>
        <path
          className="copilot-bloom__big"
          d={SPARKLE_BIG_PATH}
          fill={`url(#${gradientId})`}
        />
        <g className="copilot-bloom__small">
          <path d={SPARKLE_SMALL_UNDERLAY_PATH} fill={SPARKLE_UNDERLAY_FILL} />
          <path d={SPARKLE_SMALL_PATH} fill={`url(#${gradientId})`} />
        </g>
      </svg>
    </span>
  );
}
