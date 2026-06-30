import type { SVGProps } from "react";

interface DripChevronIconProps extends SVGProps<SVGSVGElement> {
  variant?: "up" | "down" | "left" | "right";
  size?: number;
}

export function DripChevronIcon({
  variant = "down",
  size = 20,
  strokeWidth = 1.5,
  ...props
}: DripChevronIconProps) {
  const paths: Record<NonNullable<DripChevronIconProps["variant"]>, string> = {
    down:  "M 5 8 L 10 13 L 15 8",
    up:    "M 5 12 L 10 7 L 15 12",
    left:  "M 13 5 L 8 10 L 13 15",
    right: "M 7 5 L 12 10 L 7 15",
  };

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
      <path
        d={paths[variant]}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
