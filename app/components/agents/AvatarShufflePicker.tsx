"use client";

import { Shuffle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  PIXABOT_IDS,
  getPixabotByIndex,
  pixabotIndexFromPath,
} from "../../lib/pixabots";

export function AvatarShufflePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (path: string) => void;
}) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (value) {
      const found = pixabotIndexFromPath(value);
      if (found >= 0) {
        setIndex(found);
        return;
      }
    }
    const initial = Math.floor(Math.random() * PIXABOT_IDS.length);
    setIndex(initial);
    onChange(getPixabotByIndex(initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (index === null) {
    return <div className="h-12" aria-hidden />;
  }

  const path = getPixabotByIndex(index);

  const shuffle = () => {
    const next = (index + 1) % PIXABOT_IDS.length;
    setIndex(next);
    onChange(getPixabotByIndex(next));
  };

  return (
    <div className="flex items-center gap-3">
      <Image
        src={path}
        alt="Agent avatar"
        width={48}
        height={48}
        className="rounded-full border border-[#e5e5e5]"
      />
      <button
        type="button"
        onClick={shuffle}
        aria-label="Shuffle avatar"
        className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] bg-white px-3 py-1.5 text-[13px] tracking-[-0.078px] text-[#0a0a0a] hover:bg-black/[0.03]"
      >
        <Shuffle size={12} strokeWidth={2} />
        Shuffle
      </button>
    </div>
  );
}
