import type { SVGProps } from "react";

interface DripCloseIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function DripCloseIcon({
  size = 20,
  strokeWidth = 2,
  ...props
}: DripCloseIconProps) {
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
      {/* Two slightly-curved strokes — hand-drawn marker feel */}
      <path
        d="M 3.5 3.5 C 5.5 5.5 13 13.5 16.5 16.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        d="M 16.5 3.5 C 14 6 6.5 13 3.5 16.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
