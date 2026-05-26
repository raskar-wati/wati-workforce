"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import {
  buildDailyDigest,
  type DailyDigestData,
  type DigestMetric,
} from "../../lib/daily-digest";
import { useTenantProfile } from "../../lib/tenant-signal-profile";

type Pointer = {
  /** Stable id — used as React key. */
  id: string;
  /** Rich content for display, with bolded values and tone colors. */
  node: ReactNode;
  /** Plain-text version used as the user message when the card is clicked. */
  text: string;
};

/**
 * Home-screen Daily Digest. Renders a small set of clickable pointer cards
 * — each card, when clicked, opens a new thread in Insights mode with the
 * pointer text as the first user message, so the user can drill into it.
 */
export function DailyDigest({
  onSelectPointer,
}: {
  /** Called when a pointer card is clicked. Receives the plain-text version. */
  onSelectPointer?: (text: string) => void;
}) {
  const { profile } = useTenantProfile();
  const data = useMemo(() => buildDailyDigest(profile), [profile]);
  const [open, setOpen] = useState(true);

  const pointers = useMemo(() => buildPointers(data), [data]);

  return (
    <section className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 text-left"
      >
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex text-black/40"
        >
          <ChevronDown size={14} strokeWidth={2} />
        </motion.span>
        <h2 className="text-[13px] font-semibold tracking-[-0.078px] text-[#0a0a0a]">
          Daily Digest
        </h2>
        <span className="text-[12px] tracking-[-0.06px] text-black/45">
          {formatDigestDate(data.forDate)}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-2 pt-2">
              {pointers.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPointer?.(p.text)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--wati-border-default)] bg-white px-4 py-3 text-left transition-colors hover:bg-[var(--wati-surface-subtle)]"
                  >
                    <span className="flex-1 text-[13px] leading-[20px] tracking-[-0.078px] text-black/70">
                      {p.node}
                    </span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2}
                      className="shrink-0 text-black/35 transition-transform group-hover:translate-x-0.5 group-hover:text-black/65"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function buildPointers(data: DailyDigestData): Pointer[] {
  const out: Pointer[] = [];

  const closed = data.heroMetrics.find((m) => m.id === "closed-yesterday");
  const pipeline = data.heroMetrics.find((m) => m.id === "pipeline-today");
  const convos = data.heroMetrics.find((m) => m.id === "conversations");
  const response = data.heroMetrics.find((m) => m.id === "response-time");

  if (closed) {
    out.push({
      id: "closed",
      node: (
        <>
          Closed yesterday: <Strong>{closed.value}</Strong>
          {closed.subLabel ? ` across ${closed.subLabel}` : ""}
          {closed.trend ? <> · <Trend metric={closed} /></> : null}
        </>
      ),
      text: plainMetric("Closed yesterday", closed),
    });
  }

  if (pipeline) {
    out.push({
      id: "pipeline",
      node: (
        <>
          Pipeline today: <Strong>{pipeline.value}</Strong>
          {pipeline.subLabel ? ` across ${pipeline.subLabel}` : ""}
          {pipeline.trend ? <> · <Trend metric={pipeline} /></> : null}
        </>
      ),
      text: plainMetric("Pipeline today", pipeline),
    });
  }

  if (convos || response) {
    out.push({
      id: "throughput",
      node: (
        <>
          {convos && (
            <>
              <Strong>{convos.value}</Strong> conversations
              {convos.trend ? <> <Trend metric={convos} /></> : null}
            </>
          )}
          {convos && response ? " · " : null}
          {response && (
            <>
              avg response <Strong>{response.value}</Strong>
              {response.trend ? <> <Trend metric={response} /></> : null}
            </>
          )}
        </>
      ),
      text: plainThroughput(convos, response),
    });
  }

  if (data.topPerformers.length > 0) {
    out.push({
      id: "top-performers",
      node: (
        <>
          Top performers:{" "}
          {data.topPerformers.map((p, i) => (
            <span key={p.name}>
              <Strong>{p.name}</Strong> ({extractValue(p.metric)})
              {i < data.topPerformers.length - 1 ? ", " : ""}
            </span>
          ))}
        </>
      ),
      text: `Top performers: ${data.topPerformers
        .map((p) => `${p.name} (${extractValue(p.metric)})`)
        .join(", ")}`,
    });
  }

  if (data.trendingTopics.length > 0) {
    out.push({
      id: "trending",
      node: (
        <>
          Trending:{" "}
          {data.trendingTopics.map((t, i) => (
            <span key={t.label}>
              {t.label}{" "}
              <span className={toneClass(t.tone)}>{t.delta}</span>
              {i < data.trendingTopics.length - 1 ? ", " : ""}
            </span>
          ))}
        </>
      ),
      text: `Trending: ${data.trendingTopics
        .map((t) => `${t.label} ${t.delta}`)
        .join(", ")}`,
    });
  }

  return out;
}

function plainMetric(prefix: string, m: DigestMetric): string {
  const trend = m.trend
    ? ` (${m.trend.direction === "up" ? "↑" : "↓"} ${m.trend.pct})`
    : "";
  const sub = m.subLabel ? ` across ${m.subLabel}` : "";
  return `${prefix}: ${m.value}${sub}${trend}`;
}

function plainThroughput(
  convos?: DigestMetric,
  response?: DigestMetric,
): string {
  const parts: string[] = [];
  if (convos) {
    const t = convos.trend
      ? ` ${convos.trend.direction === "up" ? "↑" : "↓"} ${convos.trend.pct}`
      : "";
    parts.push(`${convos.value} conversations${t}`);
  }
  if (response) {
    const t = response.trend
      ? ` ${response.trend.direction === "up" ? "↑" : "↓"} ${response.trend.pct}`
      : "";
    parts.push(`avg response ${response.value}${t}`);
  }
  return parts.join(" · ");
}

function Strong({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-[#0a0a0a]">{children}</span>;
}

function Trend({ metric }: { metric: DigestMetric }) {
  if (!metric.trend) return null;
  return (
    <span className={`font-medium ${toneClass(metric.trend.tone)}`}>
      {metric.trend.direction === "up" ? "↑" : "↓"} {metric.trend.pct}
    </span>
  );
}

function toneClass(tone: "good" | "bad" | "neutral"): string {
  switch (tone) {
    case "good":
      return "text-emerald-600";
    case "bad":
      return "text-rose-600";
    default:
      return "text-black/45";
  }
}

function extractValue(metric: string): string {
  const parts = metric.split("·").map((s) => s.trim());
  return parts[parts.length - 1] ?? metric;
}

function formatDigestDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
