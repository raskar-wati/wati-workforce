"use client";

import { useId } from "react";
import {
  SPARKLE_BIG_PATH,
  SPARKLE_SMALL_PATH,
  SPARKLE_SMALL_UNDERLAY_PATH,
  SPARKLE_UNDERLAY_FILL,
} from "./copilot-sparkle-paths";

type CopilotIconProps = {
  size?: number;
  className?: string;
  /**
   * "gradient" (default) — the brand-mark treatment, used wherever the
   * "Copilot" wordmark is labeled (headers, panel titles).
   * "solid" — flat green + off-white accent, from the standalone mark
   * asset (Co-pilot.svg). Use for small/isolated placements, e.g. in
   * place of a loading spinner.
   */
  variant?: "gradient" | "solid";
};

/**
 * The Copilot sparkle mark — from the design team's button/mark assets
 * (Copilot.svg, Co-pilot.svg). Use this wherever "Copilot" is signified.
 */
export function CopilotIcon({ size = 16, className, variant = "gradient" }: CopilotIconProps) {
  const uid = useId();
  const gradA = `copilot-icon-a-${uid}`;
  const gradB = `copilot-icon-b-${uid}`;
  const gradC = `copilot-icon-c-${uid}`;

  if (variant === "solid") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        className={className}
      >
        <path d={SPARKLE_SMALL_UNDERLAY_PATH} fill={SPARKLE_UNDERLAY_FILL} />
        <path d={SPARKLE_BIG_PATH} fill="#23A455" />
        <path d={SPARKLE_SMALL_PATH} fill="#23A455" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="9 9 16 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M20.5 12C20.72 13.56 21.72 14.56 23.5 15C21.72 15.44 20.72 16.44 20.5 18C20.28 16.44 19.28 15.44 17.5 15C19.28 14.56 20.28 13.56 20.5 12Z"
        fill={`url(#${gradA})`}
      />
      <path
        d="M15.3926 9.01343C15.6943 9.01343 15.9501 9.23619 15.9922 9.53491C16.1734 10.8189 16.6689 11.8413 17.4619 12.6345C17.7993 12.9718 18.1978 13.2738 18.6592 13.5388C18.3128 13.7605 17.8735 13.9487 17.3193 14.0857C17.313 14.0873 17.307 14.0899 17.3008 14.0916C17.0528 13.905 16.8202 13.7057 16.6055 13.491C16.0985 12.9839 15.6954 12.4056 15.3926 11.7625C15.0898 12.4056 14.6867 12.9839 14.1797 13.491C13.5605 14.11 12.8011 14.6104 11.9131 14.9998C12.8011 15.3891 13.5605 15.8895 14.1797 16.5085C14.6865 17.0154 15.0898 17.5933 15.3926 18.2361C15.6953 17.5933 16.0987 17.0154 16.6055 16.5085C16.8204 16.2937 17.0526 16.0936 17.3008 15.907C17.3071 15.9087 17.3129 15.9122 17.3193 15.9138C17.8733 16.0508 18.3129 16.2382 18.6592 16.4597C18.1976 16.7248 17.7994 17.0276 17.4619 17.365C16.6689 18.1582 16.1734 19.1806 15.9922 20.4646C15.9501 20.7633 15.6943 20.9861 15.3926 20.9861C15.091 20.986 14.8361 20.7633 14.7939 20.4646C14.6127 19.1804 14.1164 18.1582 13.3232 17.365C12.5243 16.5662 11.3864 15.9634 9.86621 15.5876C9.5961 15.5207 9.40625 15.278 9.40625 14.9998C9.40625 14.7215 9.5961 14.4788 9.86621 14.4119C11.3864 14.0361 12.5243 13.4333 13.3232 12.6345C14.1164 11.8413 14.6127 10.8191 14.7939 9.53491L14.8193 9.42651C14.9005 9.18379 15.1286 9.01352 15.3926 9.01343Z"
        fill={`url(#${gradB})`}
      />
      <path
        d="M20.774 11.3677C20.975 11.3677 21.1451 11.5156 21.1734 11.7145C21.281 12.4776 21.5745 13.0836 22.0436 13.5527C22.5165 14.0256 23.1923 14.3837 24.0994 14.6079C24.2796 14.6525 24.4063 14.8144 24.4063 15C24.4063 15.1856 24.2796 15.3475 24.0994 15.392C23.1923 15.6162 22.5165 15.9744 22.0436 16.4472C21.5745 16.9164 21.281 17.5223 21.1734 18.2854C21.1451 18.4844 20.975 18.6322 20.774 18.6322C20.573 18.6322 20.4029 18.4844 20.3746 18.2854C20.267 17.5223 19.9735 16.9164 19.5044 16.4472C19.0316 15.9744 18.3557 15.6162 17.4486 15.392C17.2684 15.3475 17.1417 15.1856 17.1417 15C17.1417 14.8144 17.2684 14.6525 17.4486 14.6079C18.3557 14.3837 19.0316 14.0256 19.5044 13.5527C19.9735 13.0836 20.267 12.4776 20.3746 11.7145L20.3914 11.643C20.4456 11.4812 20.598 11.3677 20.774 11.3677Z"
        fill={`url(#${gradC})`}
      />
      <defs>
        <linearGradient id={gradA} x1="17.5" y1="18" x2="23.5" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#23A455" />
          <stop offset="1" stopColor="#00E785" />
        </linearGradient>
        <linearGradient id={gradB} x1="9.40625" y1="20.9861" x2="18.6592" y2="20.9861" gradientUnits="userSpaceOnUse">
          <stop stopColor="#23A455" />
          <stop offset="1" stopColor="#00E785" />
        </linearGradient>
        <linearGradient id={gradC} x1="17.1417" y1="18.6322" x2="24.4063" y2="18.6322" gradientUnits="userSpaceOnUse">
          <stop stopColor="#23A455" />
          <stop offset="1" stopColor="#00E785" />
        </linearGradient>
      </defs>
    </svg>
  );
}
