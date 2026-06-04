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
export { Cursor }         from "@/components/ui/Cursor";

// ── Glass / Brand ─────────────────────────────────────────────────────────
export { WineGlassMark }   from "@/components/glass/WineGlassMark";
export { BrandLogo }       from "@/components/glass/BrandLogo";
export { MorphingLogo }    from "@/components/glass/MorphingLogo";
export { PintGlass, PintGlassNav } from "@/components/glass/PintGlass";
export { TappedOutStamp }  from "@/components/glass/TappedOutStamp";

// ── Motion ────────────────────────────────────────────────────────────────
export { Reveal }          from "@/components/motion/Reveal";
export { SplitReveal }     from "@/components/motion/SplitReveal";
export { SmoothScroll }    from "@/components/motion/SmoothScroll";
export { ScrambleText }    from "@/components/motion/ScrambleText";
export { TypeOnScroll }    from "@/components/motion/TypeOnScroll";
export { CountUp }         from "@/components/motion/CountUp";
export { FoamParticles }   from "@/components/motion/FoamParticles";
export { ScrollProgressDrip } from "@/components/motion/ScrollProgressDrip";
export { AudioReactive }   from "@/components/motion/AudioReactive";

// ── Transitions ───────────────────────────────────────────────────────────
export { PourTransition }  from "@/components/transitions/PourTransition";

// ── Sections (homepage + shared) ─────────────────────────────────────────
export { Hero }            from "@/components/sections/Hero";
export { HomeMarquee }     from "@/components/sections/HomeMarquee";
export { CurrentlyPouring } from "@/components/sections/CurrentlyPouring";
export { StoryTeaser }     from "@/components/sections/StoryTeaser";
export { BuildingTeaser }  from "@/components/sections/BuildingTeaser";
export { JoinRegulars }    from "@/components/sections/JoinRegulars";
export { Nav }             from "@/components/sections/Nav";
export { Footer }          from "@/components/sections/Footer";

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
