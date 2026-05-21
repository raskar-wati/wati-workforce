"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

type EmotionalState = "focused" | "curious" | "working" | "playful" | "patient"

const STATE_THRESHOLDS_MS: { state: EmotionalState; after: number }[] = [
  { state: "focused", after: 0 },
  { state: "curious", after: 5000 },
  { state: "working", after: 15000 },
  { state: "playful", after: 30000 },
  { state: "patient", after: 45000 },
]

const TEXT_POOLS: Record<EmotionalState, string[]> = {
  focused: [
    "Thinking…",
    "Looking into this.",
    "On it.",
    "One moment.",
    "Processing.",
    "Reading your question.",
    "Gathering context.",
    "Working on it.",
  ],
  curious: [
    "This deserves a proper look.",
    "Following a couple of threads.",
    "Checking a few angles.",
    "Cross-referencing.",
    "Getting the shape of it.",
    "Considering a few options.",
    "Finding the right frame.",
    "Working through the layers.",
  ],
  working: [
    "This one's got depth.",
    "Multiple moving parts.",
    "Tightening the reasoning.",
    "Verifying the edges.",
    "Checking the math.",
    "Making sure this holds up.",
    "Not a simple one.",
    "Worth doing right.",
  ],
  playful: [
    "Taking a cappuccino to regain power.",
    "Consulting my notes.",
    "Okay, it's complicated.",
    "Running the long way around.",
    "Re-reading my own work.",
    "Earning my keep today.",
    "This one deserves the scenic route.",
    "Doing the unglamorous part.",
  ],
  patient: [
    "Still here, still thinking.",
    "Almost through it.",
    "Close.",
    "Wrapping up the thinking.",
    "Worth the wait, I promise.",
    "Final stretch.",
    "Sharpening the answer.",
    "Landing it properly.",
  ],
}

const TEXT_ROTATE_MS = 4000
const EYE_COLOR = "rgba(0,0,0,0.55)"

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (seconds === 0) return `${minutes}m`
  return `${minutes}m ${seconds}s`
}

type ThinkingState = {
  emotionalState: EmotionalState
  textIndex: number
}

export function ThinkingIndicator() {
  const startRef = useRef(0)
  const [thinking, setThinking] = useState<ThinkingState>({
    emotionalState: "focused",
    textIndex: 0,
  })
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    startRef.current = Date.now()

    const stateTimer = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current
      setElapsedMs(elapsed)
      let current: EmotionalState = "focused"
      for (const t of STATE_THRESHOLDS_MS) {
        if (elapsed >= t.after) current = t.state
      }
      setThinking((prev) => {
        if (prev.emotionalState === current) return prev
        return { emotionalState: current, textIndex: 0 }
      })
    }, 500)

    const textTimer = window.setInterval(() => {
      setThinking((prev) => ({ ...prev, textIndex: prev.textIndex + 1 }))
    }, TEXT_ROTATE_MS)

    return () => {
      window.clearInterval(stateTimer)
      window.clearInterval(textTimer)
    }
  }, [])

  const state = thinking.emotionalState
  const textIndex = thinking.textIndex
  const pool = TEXT_POOLS[state]
  const currentText = pool[textIndex % pool.length] ?? ""

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Orb containing the animated eyes */}
      <div className="relative flex items-center justify-center" style={{ width: 110, height: 90 }}>
        {/* Outer soft glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(186,220,255,0.55) 0%, rgba(200,228,255,0.25) 55%, transparent 100%)",
            filter: "blur(10px)",
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner brighter core */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 64,
            height: 52,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(210,235,255,0.9) 0%, rgba(186,220,255,0.5) 60%, transparent 100%)",
            filter: "blur(6px)",
          }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
        {/* Eyes — sit on top of the orb */}
        <motion.span
          className="relative flex items-center gap-1.5"
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          <Eye delay={0} />
          <Eye delay={0.06} />
        </motion.span>
      </div>

    </div>
  )
}

function Eye({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      style={{
        display: "inline-block",
        width: 4,
        height: 4,
        background: EYE_COLOR,
        borderRadius: 1,
        transformOrigin: "center",
      }}
      animate={{ scaleY: [1, 1, 0.05, 0.05, 1] }}
      transition={{
        duration: 0.38,
        repeat: Infinity,
        repeatDelay: 3.2,
        delay,
        ease: "easeInOut",
        times: [0, 0.15, 0.45, 0.6, 1],
      }}
    />
  )
}

function ThinkingCard({ elapsedMs }: { elapsedMs: number }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-[10px] bg-white"
      style={{
        width: 280,
        padding: "10px 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "rgba(0,0,0,0.06)",
          color: "rgba(0,0,0,0.4)",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect
            x="2"
            y="2"
            width="10"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path d="M2 6h10M6 2v10" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-col" style={{ gap: 2 }}>
        <span
          className="text-[13px] leading-[1.3] font-medium"
          style={{ color: "rgba(0,0,0,0.7)" }}
        >
          Generating dashboard
        </span>
        <span
          className="text-[11px] leading-[1.3] tabular-nums"
          style={{ color: "rgba(0,0,0,0.35)" }}
        >
          {formatElapsed(elapsedMs)}
        </span>
      </div>
    </div>
  )
}
