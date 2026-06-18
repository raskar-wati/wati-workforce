"use client";

import { motion } from "motion/react";

/**
 * Static mock conversation rendered when an analytics-flagged thread is
 * opened. Shows: user prompt → assistant paragraph → operator table →
 * conversation volume chart → action chips. Pure presentation — there's
 * no LLM call backing this; it's a fixture for the prototype.
 */
export function AnalyticsMockConversation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      {/* User bubble */}
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-black/[0.04] px-4 py-2.5 text-[14px] leading-[20px] text-black/80">
          What is our inbox performance this month, and which operator is
          handling the most conversations?
        </div>
      </div>

      {/* Assistant paragraph */}
      <p className="whitespace-pre-wrap text-[14px] leading-[21px] text-black/80">
        Current inbox analytics for this month shows strong performance with
        1,247 total conversations received from June 1st to June 17th, 2026.
        The team has maintained an average first response time of 3.2 minutes
        with an 87% resolution rate. Sarah Johnson is currently leading with
        the highest conversation count at 312 conversations handled this month.
      </p>

      {/* Operator table */}
      <section className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold tracking-[-0.078px] text-[#0a0a0a]">
          Inbox Performance (by Operator)
        </h3>
        <div className="overflow-hidden rounded-lg border border-black/[0.08]">
          <table className="w-full text-left text-[13px] tracking-[-0.078px]">
            <thead className="bg-black/[0.02] text-black/55">
              <tr>
                <th className="px-3 py-2 font-medium">Operator</th>
                <th className="px-3 py-2 font-medium">Assigned</th>
                <th className="px-3 py-2 font-medium">Resolved</th>
              </tr>
            </thead>
            <tbody className="text-[#0a0a0a]">
              {[
                { op: "Sarah Johnson", a: 89, r: 78 },
                { op: "Mike Chen", a: 74, r: 69 },
                { op: "Priya Kapoor", a: 61, r: 58 },
              ].map((row, i, arr) => (
                <tr
                  key={row.op}
                  className={i < arr.length - 1 ? "border-t border-black/[0.06]" : ""}
                >
                  <td className="px-3 py-2">{row.op}</td>
                  <td className="px-3 py-2">{row.a}</td>
                  <td className="px-3 py-2">{row.r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Volume chart */}
      <section className="flex flex-col gap-2">
        <h3 className="text-[13px] font-semibold tracking-[-0.078px] text-[#0a0a0a]">
          Conversation Volume (Assigned vs Resolved)
        </h3>
        <ConversationVolumeChart />
        <div className="flex items-center gap-4 text-[12px] tracking-[-0.06px] text-black/65">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#7C5CE6]" />
            Assigned <span className="text-black/80">1,247</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#5BC892]" />
            Resolved <span className="text-black/80">1,085</span>
          </span>
        </div>
      </section>

      {/* Action chips */}
      <section className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-black/40">
          Actions
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Today's unresolved conversations by inbox",
            "Today's average first response time by operator",
            "Which team has the fastest response time?",
          ].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-black/[0.08] px-3 py-1.5 text-[12px] tracking-[-0.06px] text-[#0a0a0a] hover:bg-black/[0.04]"
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function ConversationVolumeChart() {
  // Two sample series. y-axis ticks shown on the left; series rendered as
  // smooth lines. Pure SVG so there's no chart dep to pull in for a mock.
  const WIDTH = 580;
  const HEIGHT = 200;
  const PADDING = { top: 12, right: 12, bottom: 24, left: 32 };
  const ticks = [1, 10, 15, 20];
  const max = 25;
  const points = 12;

  // Two pseudo-realistic series.
  const assigned = [3, 4, 5, 11, 6, 7, 13, 12, 4, 5, 4, 8];
  const resolved = [2, 4, 18, 6, 4, 3, 4, 22, 25, 24, 8, 12];

  const xAt = (i: number) =>
    PADDING.left +
    (i * (WIDTH - PADDING.left - PADDING.right)) / (points - 1);
  const yAt = (v: number) =>
    HEIGHT - PADDING.bottom -
    (v / max) * (HEIGHT - PADDING.top - PADDING.bottom);

  const toPath = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`)
      .join(" ");

  return (
    <div className="overflow-hidden rounded-lg border border-black/[0.08] bg-white p-3">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={yAt(t) + 4}
              textAnchor="end"
              fontSize={10}
              fill="rgba(0,0,0,0.4)"
            >
              {t}
            </text>
          </g>
        ))}
        <path
          d={toPath(assigned)}
          fill="none"
          stroke="#7C5CE6"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={toPath(resolved)}
          fill="none"
          stroke="#5BC892"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
