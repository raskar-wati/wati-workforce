import { Server } from "lucide-react";
import { connectorInitial } from "../../lib/connectors-data";

const SIZES = {
  sm: { box: "h-5 w-5 rounded-[5px]", pad: "p-[3px]", text: "text-[10px]", icon: 11 },
  md: { box: "h-8 w-8 rounded-lg", pad: "p-1.5", text: "text-[12px]", icon: 15 },
  lg: { box: "h-10 w-10 rounded-[10px]", pad: "p-2", text: "text-[14px]", icon: 18 },
} as const;

/**
 * A connector's logo on a white tile. Custom MCP servers get a server
 * glyph; anything else without a logo falls back to its first letter.
 * A red dot marks one whose sign-in has expired.
 */
export function ConnectorTile({
  name,
  logo,
  custom = false,
  expired = false,
  size = "md",
}: {
  name: string;
  logo?: string;
  custom?: boolean;
  expired?: boolean;
  size?: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center border border-black/[0.08] bg-white ${s.box} ${logo ? s.pad : ""}`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- small static SVGs
        <img src={logo} alt="" className="h-full w-full object-contain" />
      ) : custom ? (
        <Server size={s.icon} strokeWidth={1.75} className="text-black/55" />
      ) : (
        <span className={`font-semibold text-black/70 ${s.text}`}>{connectorInitial(name)}</span>
      )}
      {expired && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
      )}
    </span>
  );
}
