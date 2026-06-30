import type { SVGProps } from "react";

interface DripSearchIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DripSearchIcon({
  size = 20,
  strokeWidth = 1.5,
  ...props
}: DripSearchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      {/* Lens circle */}
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth={strokeWidth} />
      {/* Tiny wine glass silhouette inside the lens */}
      <path
        d="M 7 6.5 Q 8.5 8 10 6.5 L 9.8 10 L 9 10 L 9.6 10 L 9 10 L 7.2 10 Q 8.5 8 7 6.5 Z"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stem */}
      <line x1="8.5" y1="10" x2="8.5" y2="11" stroke="currentColor" strokeWidth={0.8} strokeLinecap="round" />
      {/* Handle */}
      <path d="M 12.5 12.5 L 17.5 17.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
