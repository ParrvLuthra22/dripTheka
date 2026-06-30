import type { SVGProps } from "react";

interface DripMenuIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DripMenuIcon({
  size = 20,
  strokeWidth = 1.5,
  ...props
}: DripMenuIconProps) {
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
      {/* Three slightly uneven lines — hand-drawn energy */}
      <path d="M 3 5.5 L 16 5.5"   stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M 3 10  L 17 10"    stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d="M 3 14.5 L 15 14.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
