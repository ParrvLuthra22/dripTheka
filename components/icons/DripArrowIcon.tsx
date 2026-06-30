import type { SVGProps } from "react";

interface DripArrowIconProps extends SVGProps<SVGSVGElement> {
  variant?: "right" | "left" | "down";
  size?: number;
}

export function DripArrowIcon({
  variant = "right",
  size = 20,
  strokeWidth = 1.5,
  ...props
}: DripArrowIconProps) {
  const paths: Record<NonNullable<DripArrowIconProps["variant"]>, { shaft: string; head: string }> = {
    right: {
      shaft: "M 3 10 C 7 9.5 12 10 17 10",
      head:  "M 12.5 5.5 C 14 7 16.5 9.5 17 10 C 16.5 10.5 14 13 12.5 14.5",
    },
    left: {
      shaft: "M 17 10 C 13 10.5 8 10 3 10",
      head:  "M 7.5 5.5 C 6 7 3.5 9.5 3 10 C 3.5 10.5 6 13 7.5 14.5",
    },
    down: {
      shaft: "M 10 3 C 10.5 7 10 12 10 17",
      head:  "M 5.5 12.5 C 7 14 9.5 16.5 10 17 C 10.5 16.5 13 14 14.5 12.5",
    },
  };

  const { shaft, head } = paths[variant];

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
      <path d={shaft} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <path d={head}  stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
