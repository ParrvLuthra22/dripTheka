// Product illustrations — abstract SVG garment silhouettes.
// V1 uses local SVG art in place of photography (per brand spec).
// Each type has a front (default) and back view for the garment-flip feature.

import type { GarmentType } from "@/data/pour-001";

interface IllustrationProps {
  type: GarmentType;
  primaryColor: string;
  accentColor?: string;
  view?: "front" | "back";
  className?: string;
}

export function ProductIllustration({
  type,
  primaryColor,
  accentColor = "#E4E2DD",
  view = "front",
  className,
}: IllustrationProps) {
  const props = { primaryColor, accentColor, className };

  if (view === "back") {
    switch (type) {
      case "tee":    return <TeeBackIllustration    {...props} />;
      case "hoodie": return <HoodieBackIllustration {...props} />;
      case "cargo":  return <CargoBackIllustration  {...props} />;
      case "jacket": return <JacketBackIllustration {...props} />;
      case "set":    return <SetBackIllustration    {...props} />;
      default:       return <CapBackIllustration    {...props} />;
    }
  }

  switch (type) {
    case "tee":       return <TeeIllustration   {...props} />;
    case "hoodie":    return <HoodieIllustration {...props} />;
    case "cargo":     return <CargoIllustration  {...props} />;
    case "jacket":    return <JacketIllustration {...props} />;
    case "set":       return <SetIllustration    {...props} />;
    default:          return <CapIllustration    {...props} />;
  }
}

type SvgProps = {
  primaryColor: string;
  accentColor: string;
  className?: string;
};

function TeeIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <path d="M110 80 L60 50 L20 90 L60 110 L60 320 L260 320 L260 110 L300 90 L260 50 L210 80 Q160 100 110 80Z"
        fill={primaryColor} />
      {/* Collar */}
      <path d="M130 80 Q160 115 190 80" stroke={accentColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Wine glass logo — left chest */}
      <g transform="translate(125,140)" opacity="0.5">
        <path d="M0 0 Q0 22 8 28 Q16 22 16 0 Z" stroke={accentColor} strokeWidth="1.5" fill="none" />
        <line x1="8" y1="28" x2="8" y2="36" stroke={accentColor} strokeWidth="1.5" />
        <line x1="2" y1="38" x2="14" y2="38" stroke={accentColor} strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function HoodieIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <path d="M100 100 L40 80 L15 130 L60 145 L60 340 L260 340 L260 145 L305 130 L280 80 L220 100 Q160 130 100 100Z"
        fill={primaryColor} />
      {/* Hood */}
      <path d="M100 100 Q80 60 100 30 Q130 10 160 8 Q190 10 220 30 Q240 60 220 100 Q190 85 160 84 Q130 85 100 100Z"
        fill={primaryColor} />
      {/* Hood inner */}
      <path d="M108 100 Q100 65 118 42 Q138 22 160 20 Q182 22 202 42 Q220 65 212 100 Q190 88 160 87 Q130 88 108 100Z"
        fill={accentColor} opacity="0.12" />
      {/* LAST CALL text on back yoke hint */}
      <text x="160" y="200" textAnchor="middle" fill={accentColor} opacity="0.4"
        style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        LAST CALL
      </text>
      {/* Kangaroo pocket */}
      <path d="M110 240 L210 240 L210 290 Q160 300 110 290 Z" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

function CargoIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 280 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Waistband */}
      <rect x="40" y="30" width="200" height="30" fill={primaryColor} rx="2" />
      {/* Left leg */}
      <path d="M40 60 L50 360 L130 360 L140 60 Z" fill={primaryColor} />
      {/* Right leg */}
      <path d="M140 60 L150 360 L230 360 L240 60 Z" fill={primaryColor} />
      {/* Cargo pocket left */}
      <rect x="52" y="150" width="72" height="88" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.5" rx="1" />
      {/* Pocket button */}
      <circle cx="88" cy="150" r="3" fill={accentColor} opacity="0.5" />
      {/* Pocket label */}
      <text x="88" y="198" textAnchor="middle" fill={accentColor} opacity="0.4"
        style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.1em" }}>
        POUR 001
      </text>
      {/* Cargo pocket right */}
      <rect x="156" y="150" width="72" height="88" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.3" rx="1" />
      {/* Ankle tabs */}
      <path d="M53 352 L53 368 L80 368" stroke={accentColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <path d="M227 352 L227 368 L200 368" stroke={accentColor} strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
    </svg>
  );
}

function JacketIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 340 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <path d="M115 80 L40 60 L10 120 L65 140 L65 340 L275 340 L275 140 L330 120 L300 60 L225 80 Q170 110 115 80Z"
        fill={primaryColor} />
      {/* Left lapel */}
      <path d="M170 80 L145 110 L155 150 L170 80Z" fill={accentColor} opacity="0.25" />
      {/* Right lapel */}
      <path d="M170 80 L195 110 L185 150 L170 80Z" fill={accentColor} opacity="0.25" />
      {/* Center button line */}
      <line x1="170" y1="150" x2="170" y2="330" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6 6" opacity="0.3" />
      {/* Snap buttons */}
      {[170, 210, 250, 290].map((y, i) => (
        <circle key={i} cx={170} cy={y} r={4} fill={accentColor} opacity={0.5} />
      ))}
      {/* Back arch text */}
      <text x="170" y="220" textAnchor="middle" fill={accentColor} opacity="0.3"
        style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.14em", textTransform: "uppercase" }}>
        DRIP THEKA
      </text>
    </svg>
  );
}

function SetIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 300 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Half-zip top */}
      <path d="M70 30 L30 55 L30 190 L270 190 L270 55 L230 30 Q150 55 70 30Z" fill={primaryColor} />
      {/* Collar / zip */}
      <path d="M135 30 L135 80 L165 80 L165 30" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Shorts */}
      <path d="M50 210 L50 370 L145 370 L150 210 Z" fill={primaryColor} />
      <path d="M150 210 L155 370 L250 370 L250 210 Z" fill={primaryColor} />
      {/* Waistband shorts */}
      <rect x="50" y="195" width="200" height="18" fill={primaryColor} opacity="0.8" rx="1" />
      {/* Wine glass on back hem — brand mark */}
      <g transform="translate(124,290)" opacity="0.45">
        <path d="M4 0 Q4 18 12 24 Q20 18 20 0 Z" stroke={accentColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        <line x1="12" y1="24" x2="12" y2="32" stroke={accentColor} strokeWidth="1.5" />
        <line x1="6" y1="34" x2="18" y2="34" stroke={accentColor} strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function CapIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cap crown */}
      <path d="M30 150 Q30 40 160 30 Q290 40 290 150 Z" fill={primaryColor} />
      {/* Brim */}
      <path d="M20 158 L300 158 Q320 158 310 172 L280 178 Q160 188 40 178 L10 172 Q0 158 20 158Z"
        fill={primaryColor} />
      {/* Brim underside detail */}
      <path d="M40 178 Q160 186 280 178" stroke={accentColor} strokeWidth="1" opacity="0.3" fill="none" />
      {/* Panel lines */}
      <path d="M160 32 L160 150" stroke={accentColor} strokeWidth="1" opacity="0.2" />
      <path d="M95 45 L95 150" stroke={accentColor} strokeWidth="1" opacity="0.15" />
      <path d="M225 45 L225 150" stroke={accentColor} strokeWidth="1" opacity="0.15" />
      {/* "WRONG THEKA" embroidery */}
      <text x="160" y="110" textAnchor="middle" fill={accentColor} opacity="0.5"
        style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        WRONG THEKA
      </text>
      {/* Adjuster strap */}
      <rect x="130" y="155" width="60" height="8" fill={accentColor} opacity="0.2" rx="2" />
    </svg>
  );
}

// ─── BACK-VIEW ILLUSTRATIONS ──────────────────────────────────────────────────

function TeeBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 380" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body — same silhouette, no front collar */}
      <path d="M110 80 L60 50 L20 90 L60 110 L60 320 L260 320 L260 110 L300 90 L260 50 L210 80 Q160 95 110 80Z"
        fill={primaryColor} />
      {/* Back neckline — shallow scoop */}
      <path d="M130 80 Q160 90 190 80" stroke={accentColor} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Centre seam */}
      <line x1="160" y1="90" x2="160" y2="316" stroke={accentColor} strokeWidth="0.8" strokeDasharray="4 6" opacity="0.15" />
      {/* "DRIP THEKA" wordmark across upper back */}
      <text x="160" y="155" textAnchor="middle" fill={accentColor} opacity="0.55"
        style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
        DRIP THEKA
      </text>
      {/* Wine glass mark at nape */}
      <g transform="translate(152,95)" opacity="0.45">
        <path d="M0 0 Q0 12 5 16 Q10 12 10 0 Z" stroke={accentColor} strokeWidth="1.2" fill="none" />
        <line x1="5" y1="16" x2="5" y2="22" stroke={accentColor} strokeWidth="1.2" />
        <line x1="1" y1="24" x2="9" y2="24" stroke={accentColor} strokeWidth="1.2" />
      </g>
      {/* Size tag at hem center */}
      <rect x="150" y="306" width="20" height="12" fill={accentColor} opacity="0.15" rx="1" />
      <text x="160" y="315" textAnchor="middle" fill={accentColor} opacity="0.4"
        style={{ fontSize: 5, fontFamily: "monospace", letterSpacing: "0.08em" }}>DT</text>
    </svg>
  );
}

function HoodieBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <path d="M100 100 L40 80 L15 130 L60 145 L60 340 L260 340 L260 145 L305 130 L280 80 L220 100 Q160 130 100 100Z"
        fill={primaryColor} />
      {/* Hood from back — a fuller, rounder shape */}
      <path d="M100 100 Q85 55 105 25 Q130 5 160 3 Q190 5 215 25 Q235 55 220 100 Q192 82 160 80 Q128 82 100 100Z"
        fill={primaryColor} />
      {/* Hood drawstring channel */}
      <path d="M108 100 Q100 62 116 38 Q138 18 160 16 Q182 18 204 38 Q220 62 212 100"
        stroke={accentColor} strokeWidth="1" fill="none" opacity="0.2" />
      {/* Drawstring */}
      <line x1="135" y1="24" x2="125" y2="36" stroke={accentColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <line x1="185" y1="24" x2="195" y2="36" stroke={accentColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      {/* Centre seam */}
      <line x1="160" y1="100" x2="160" y2="336" stroke={accentColor} strokeWidth="0.8" strokeDasharray="4 6" opacity="0.12" />
      {/* "LAST CALL" embroidery — prominent across yoke */}
      <text x="160" y="162" textAnchor="middle" fill={accentColor} opacity="0.6"
        style={{ fontSize: 14, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>
        LAST CALL
      </text>
      {/* Ribbed hem */}
      <line x1="60" y1="330" x2="260" y2="330" stroke={accentColor} strokeWidth="1" opacity="0.2" />
      <line x1="60" y1="336" x2="260" y2="336" stroke={accentColor} strokeWidth="0.6" opacity="0.12" />
      {/* Size tag */}
      <rect x="150" y="325" width="20" height="12" fill={accentColor} opacity="0.12" rx="1" />
    </svg>
  );
}

function CargoBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 280 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Waistband */}
      <rect x="40" y="30" width="200" height="30" fill={primaryColor} rx="2" />
      {/* Left leg */}
      <path d="M40 60 L50 360 L130 360 L140 60 Z" fill={primaryColor} />
      {/* Right leg */}
      <path d="M140 60 L150 360 L230 360 L240 60 Z" fill={primaryColor} />
      {/* Seat seam */}
      <path d="M140 60 Q140 120 140 180" stroke={accentColor} strokeWidth="1" strokeDasharray="3 5" opacity="0.2" />
      {/* Back pockets */}
      <rect x="55" y="85" width="65" height="58" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.4" rx="1" />
      <line x1="55" y1="103" x2="120" y2="103" stroke={accentColor} strokeWidth="1" opacity="0.25" />
      <rect x="160" y="85" width="65" height="58" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.3" rx="1" />
      <line x1="160" y1="103" x2="225" y2="103" stroke={accentColor} strokeWidth="1" opacity="0.2" />
      {/* "DT" stamp near waistband */}
      <text x="140" y="52" textAnchor="middle" fill={accentColor} opacity="0.45"
        style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.14em" }}>DT · POUR 001</text>
      {/* Ankle tabs */}
      <path d="M53 352 L53 368 L80 368" stroke={accentColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
      <path d="M227 352 L227 368 L200 368" stroke={accentColor} strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
    </svg>
  );
}

function JacketBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 340 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <path d="M115 80 L40 60 L10 120 L65 140 L65 340 L275 340 L275 140 L330 120 L300 60 L225 80 Q170 105 115 80Z"
        fill={primaryColor} />
      {/* Back collar — simple rounded band */}
      <path d="M135 80 Q170 95 205 80" stroke={accentColor} strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* Centre back seam */}
      <line x1="170" y1="85" x2="170" y2="332" stroke={accentColor} strokeWidth="0.8" strokeDasharray="5 6" opacity="0.15" />
      {/* "DRIP THEKA" arch text — the hero back print */}
      <path id="arch" d="M80 220 Q170 170 260 220" fill="none" />
      <text fill={accentColor} opacity="0.55"
        style={{ fontSize: 13, fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>
        <textPath href="#arch" startOffset="50%" textAnchor="middle">DRIP THEKA</textPath>
      </text>
      {/* Secondary line under arch */}
      <path d="M95 234 Q170 186 245 234" stroke={accentColor} strokeWidth="0.8" opacity="0.2" fill="none" />
      {/* Wine glass centre */}
      <g transform="translate(158,240)" opacity="0.4">
        <path d="M0 0 Q0 18 7 24 Q14 18 14 0 Z" stroke={accentColor} strokeWidth="1.5" fill="none" />
        <line x1="7" y1="24" x2="7" y2="32" stroke={accentColor} strokeWidth="1.5" />
        <line x1="1" y1="34" x2="13" y2="34" stroke={accentColor} strokeWidth="1.5" />
      </g>
      {/* Quilted liner detail on lower back */}
      {[280, 296, 312, 328].map((y, i) => (
        <line key={i} x1="65" y1={y} x2="275" y2={y} stroke={accentColor} strokeWidth="0.6" opacity="0.1" />
      ))}
    </svg>
  );
}

function SetBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 300 440" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Half-zip top — back view (no zip) */}
      <path d="M70 30 L30 55 L30 190 L270 190 L270 55 L230 30 Q150 55 70 30Z" fill={primaryColor} />
      {/* Back neckline */}
      <path d="M120 30 Q150 42 180 30" stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
      {/* Centre back seam */}
      <line x1="150" y1="38" x2="150" y2="186" stroke={accentColor} strokeWidth="0.8" strokeDasharray="3 5" opacity="0.12" />
      {/* Small DT tag at nape */}
      <rect x="141" y="36" width="18" height="10" fill={accentColor} opacity="0.15" rx="1" />
      <text x="150" y="44" textAnchor="middle" fill={accentColor} opacity="0.45"
        style={{ fontSize: 5, fontFamily: "monospace", letterSpacing: "0.06em" }}>DT</text>
      {/* Shorts — back view, wine glass print prominent on hem */}
      <path d="M50 210 L50 370 L145 370 L150 210 Z" fill={primaryColor} />
      <path d="M150 210 L155 370 L250 370 L250 210 Z" fill={primaryColor} />
      <rect x="50" y="195" width="200" height="18" fill={primaryColor} opacity="0.8" rx="1" />
      {/* Seat seam */}
      <path d="M150 210 Q150 260 150 310" stroke={accentColor} strokeWidth="1" strokeDasharray="3 5" opacity="0.18" />
      {/* Wine glass back hem print — prominent */}
      <g transform="translate(112,295)" opacity="0.55">
        <path d="M4 0 Q4 22 14 30 Q24 22 24 0 Z" stroke={accentColor} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        <line x1="14" y1="30" x2="14" y2="40" stroke={accentColor} strokeWidth="1.8" />
        <line x1="6" y1="42" x2="22" y2="42" stroke={accentColor} strokeWidth="1.8" />
        <text x="14" y="56" textAnchor="middle" fill={accentColor} opacity="0.5"
          style={{ fontSize: 6, fontFamily: "monospace", letterSpacing: "0.08em" }}>DT</text>
      </g>
    </svg>
  );
}

function CapBackIllustration({ primaryColor, accentColor, className }: SvgProps) {
  return (
    <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cap crown — back panels */}
      <path d="M30 150 Q30 40 160 30 Q290 40 290 150 Z" fill={primaryColor} />
      {/* Back panel seam lines */}
      <path d="M160 32 L160 150" stroke={accentColor} strokeWidth="1" opacity="0.2" />
      <path d="M105 42 L95 150" stroke={accentColor} strokeWidth="1" opacity="0.15" />
      <path d="M215 42 L225 150" stroke={accentColor} strokeWidth="1" opacity="0.15" />
      {/* Closure vent hole */}
      <ellipse cx="160" cy="80" rx="5" ry="5" fill="none" stroke={accentColor} strokeWidth="1.2" opacity="0.3" />
      {/* Adjuster strap */}
      <rect x="110" y="148" width="100" height="14" fill={accentColor} opacity="0.2" rx="3" />
      <rect x="148" y="148" width="24" height="14" fill={accentColor} opacity="0.3" rx="2" />
      {/* Buckle/slider detail */}
      <rect x="155" y="151" width="10" height="8" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.5" rx="1" />
      <line x1="160" y1="151" x2="160" y2="159" stroke={accentColor} strokeWidth="1" opacity="0.5" />
      {/* "DT" woven tag on strap */}
      <text x="160" y="140" textAnchor="middle" fill={accentColor} opacity="0.4"
        style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.12em" }}>DT</text>
      {/* Size sticker inside crown */}
      <rect x="138" y="90" width="44" height="20" fill={accentColor} opacity="0.1" rx="2" />
      <text x="160" y="104" textAnchor="middle" fill={accentColor} opacity="0.4"
        style={{ fontSize: 7, fontFamily: "monospace", letterSpacing: "0.1em" }}>POUR 001</text>
    </svg>
  );
}
