/**
 * @frontend — Drip Theka client-side barrel.
 *
 * Everything exported from here runs in the browser.
 * Import via `@frontend` alias defined in tsconfig.json.
 *
 * Usage:
 *   import { Button, WineGlassMark, useCartStore } from "@frontend";
 */

// ── UI Components ─────────────────────────────────────────────────────────
export { Button }         from "@/components/ui/Button";
export { LiquidButton }   from "@/components/ui/LiquidButton";
export { Eyebrow }        from "@/components/ui/Eyebrow";
export { Marquee }        from "@/components/ui/Marquee";
export { ProductCard }    from "@/components/ui/ProductCard";

// ── Glass / Brand ─────────────────────────────────────────────────────────
export { WineGlassMark }   from "@/components/glass/WineGlassMark";
export { BrandLogo }       from "@/components/glass/BrandLogo";
export { MorphingLogo }    from "@/components/glass/MorphingLogo";
export { PintGlass, PintGlassNav } from "@/components/glass/PintGlass";
export { TappedOutStamp }  from "@/components/glass/TappedOutStamp";

// ── Motion ────────────────────────────────────────────────────────────────
export { Reveal }          from "@/components/motion/Reveal";
export { SplitReveal }     from "@/components/motion/SplitReveal";
export { ScrambleText }    from "@/components/motion/ScrambleText";
export { TypeOnScroll }    from "@/components/motion/TypeOnScroll";
export { CountUp }         from "@/components/motion/CountUp";
export { Foam }            from "@/components/motion/Foam";
export { ScrollProgressDrip } from "@/components/motion/ScrollProgressDrip";
export { AudioReactive }   from "@/components/motion/AudioReactive";

// ── Theka shell ───────────────────────────────────────────────────────────
export { Nav }             from "@/components/theka/Nav";
export { Footer }          from "@/components/theka/Footer";
export { Grain }           from "@/components/theka/Grain";
export { Cursor }          from "@/components/theka/Cursor";
export { useMagnetic }     from "@/components/theka/useMagnetic";
export { SmoothScroll, useLenis, resetScroll } from "@/components/theka/SmoothScroll";
export { PourTransition, usePour } from "@/components/theka/PourTransition";
export { lang }            from "@/lib/theka/lang";

// ── Sections (homepage + shared) ─────────────────────────────────────────
export { Hero }            from "@/components/sections/Hero";
export { HomeMarquee }     from "@/components/sections/HomeMarquee";
export { CurrentlyPouring } from "@/components/sections/CurrentlyPouring";
export { StoryTeaser }     from "@/components/sections/StoryTeaser";
export { BuildingTeaser }  from "@/components/sections/BuildingTeaser";
export { JoinRegulars }    from "@/components/sections/JoinRegulars";

// ── Sound ─────────────────────────────────────────────────────────────────
export { SoundProvider, useSound } from "@/components/sound/SoundProvider";
export { SoundToggle }    from "@/components/sound/SoundToggle";

// ── Auth ──────────────────────────────────────────────────────────────────
export { UserMenu }        from "@/components/auth/UserMenu";

// ── State stores ──────────────────────────────────────────────────────────
export { useCartStore }    from "@/lib/store/cart";
export { useSoundStore }   from "@/lib/store/sound";

// ── Client utils ──────────────────────────────────────────────────────────
export { cn }              from "@/lib/utils/cn";
export { formatPrice, formatDeposit, depositAmount } from "@/lib/utils/format";
