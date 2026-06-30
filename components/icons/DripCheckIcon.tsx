import type { SVGProps } from "react";

interface DripCheckIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DripCheckIcon({
  size = 20,
  strokeWidth = 2,
  ...props
}: DripCheckIconProps) {
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
      {/* Hand-drawn tick — slightly curved, marker feel */}
      <path
        d="M 3 11 C 5 13 7 15 8 14 C 10 12 15 6 17 4"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
