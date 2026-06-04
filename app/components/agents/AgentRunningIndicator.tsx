"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { pixabotGifFromPath } from "../../lib/pixabots";

/**
 * Theatre loading state shown while an agent "runs". Displays the agent's
 * own avatar — animated as a pixabot GIF — beside a "{name} running…" label.
 *
 * Only a subset of pixabot GIFs are bundled (public/pixabots/gif/), so if the
 * GIF 404s we fall back to the static PNG. The animated ellipsis keeps the
 * surface feeling alive even when the GIF isn't available.
 */
export function AgentRunningIndicator({
  agentName,
  avatarPath,
}: {
  agentName: string;
  avatarPath: string;
}) {
  const [src, setSrc] = useState(() => pixabotGifFromPath(avatarPath));

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-2.5 rounded-2xl border border-[#e5e5e5] bg-white px-4 py-3"
    >
      <div className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-[#f5f5f5]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 object-contain"
          aria-hidden
          onError={() => {
            // GIF not bundled for this avatar — fall back to the static PNG.
            if (src !== avatarPath) setSrc(avatarPath);
          }}
        />
      </div>
      <span className="text-[13px] tracking-[-0.078px] text-black/60">
        {agentName} running
      </span>
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-1 w-1 rounded-full bg-black/40"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.18,
            }}
          />
        ))}
      </span>
    </motion.div>
  );
}
