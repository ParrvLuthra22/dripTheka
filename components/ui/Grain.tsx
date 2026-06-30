// Grain — full-area noise overlay referencing the shared #dt-grain SVG filter.
//
// The filter definition is rendered once in /app/(site)/layout.tsx.
// Each <Grain> instance just paints a rect with filter="url(#dt-grain)".
// Keep the parent position: relative (or fixed/absolute) for inset to work.

interface GrainProps {
  opacity?: number;
  className?: string;
}

export function Grain({ opacity = 0.05, className }: GrainProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`absolute inset-0 w-full h-full pointer-events-none${className ? ` ${className}` : ""}`}
      style={{ opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="100%" height="100%" filter="url(#dt-grain)" />
    </svg>
  );
}
