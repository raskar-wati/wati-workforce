"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paperclip } from "lucide-react";

/**
 * Drop target spanning the whole Ask Wati surface (drawer or full page), so
 * files can be dropped anywhere on it rather than only on the composer.
 * The chat that owns the staged attachments registers its handler with
 * `useFileDropHandler`; until one is registered the zone ignores drags.
 */

type Handler = (files: File[]) => void;

const Ctx = createContext<{ current: Handler | null } | null>(null);

export function useFileDropHandler(handler: Handler | undefined) {
  const slot = useContext(Ctx);
  useEffect(() => {
    if (!slot || !handler) return;
    slot.current = handler;
    return () => {
      if (slot.current === handler) slot.current = null;
    };
  }, [slot, handler]);
}

export function FileDropZone({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const handler = useRef<Handler | null>(null);
  /** Depth counter, not a boolean: dragenter/dragleave also fire when the
   *  pointer crosses child elements, which makes a boolean flicker. */
  const depth = useRef(0);
  const [active, setActive] = useState(false);

  const accepts = (e: DragEvent) =>
    Boolean(handler.current) && e.dataTransfer.types.includes("Files");

  return (
    <Ctx.Provider value={handler}>
      <div
        onDragEnter={(e) => {
          if (!accepts(e)) return;
          e.preventDefault();
          depth.current += 1;
          setActive(true);
        }}
        onDragOver={(e) => {
          if (!accepts(e)) return;
          // Required, or the browser treats the drop as a navigation.
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          if (!accepts(e)) return;
          e.preventDefault();
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setActive(false);
        }}
        onDrop={(e) => {
          if (!accepts(e)) return;
          e.preventDefault();
          depth.current = 0;
          setActive(false);
          const files = Array.from(e.dataTransfer.files);
          if (files.length > 0) handler.current?.(files);
        }}
        className={`relative ${className}`}
      >
        {children}

        {/* pointer-events-none so it never swallows the drop from what's under it. */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute inset-1.5 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-wati-green bg-wati-green-soft/80"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-wati-green-text">
                <Paperclip size={16} strokeWidth={2} />
                Drop files to attach
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
