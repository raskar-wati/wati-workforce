"use client";

import type { HandoffCta, HandoffTable as HandoffTableType } from "../../lib/agents";
import { HandoffCtaButton } from "./HandoffCtaButton";

/**
 * Compact table view of a customer list inside a handoff result. The trailing
 * column holds an optional per-row action. "Note" rows (e.g. "14 more
 * contacts …") span the data columns as a muted summary line.
 */
export function HandoffTable({
  table,
  firedCtaIds,
  onFireCta,
}: {
  table: HandoffTableType;
  firedCtaIds: ReadonlySet<string>;
  onFireCta: (cta: HandoffCta) => void;
}) {
  // Columns excluding the trailing action column (empty-string header).
  const dataColumns = table.columns.slice(0, -1);

  return (
    <div className="overflow-hidden rounded-xl border border-[#ececec]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-black/[0.02]">
            {dataColumns.map((c, i) => (
              <th
                key={i}
                className="px-3 py-2 text-[11px] font-medium uppercase tracking-[0.5px] text-black/40"
              >
                {c}
              </th>
            ))}
            <th className="px-3 py-2" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            if (row.note) {
              return (
                <tr key={row.id} className="border-t border-[#f0f0f0]">
                  <td
                    colSpan={dataColumns.length}
                    className="px-3 py-2.5 text-[12px] tracking-[-0.06px] text-black/45"
                  >
                    {row.cells[0]}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {row.cta && (
                      <HandoffCtaButton
                        cta={row.cta}
                        variant="inline"
                        fired={firedCtaIds.has(row.cta.id)}
                        onFire={onFireCta}
                      />
                    )}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={row.id} className="border-t border-[#f0f0f0] align-top">
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2.5 text-[13px] tracking-[-0.078px] ${
                      i === 0
                        ? "font-medium text-[#0a0a0a]"
                        : "text-black/60"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right">
                  {row.cta && (
                    <HandoffCtaButton
                      cta={row.cta}
                      variant="inline"
                      fired={firedCtaIds.has(row.cta.id)}
                      onFire={onFireCta}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
