/**
 * /data/copy.ts — Single source of truth for all Drip Theka UI microcopy.
 *
 * Voice: cool friend who spends too much time online. Hinglish-comfortable.
 * Self-aware, dry humour, never corporate, never motivational poster energy.
 *
 * Usage:
 *   import { copy } from "@/data/copy";
 *   // copy.cart.empty       → "Glass is dry. Sad."
 *   // copy.cta.checkout     → "Settle the bill →"
 *
 * DO NOT scatter microcopy inline in components — import from here.
 * Subsequent prompts will replace inline strings component-by-component.
 */

export const copy = {

  // ── Cart ──────────────────────────────────────────────────────────────────

  cart: {
    /** Shown on the empty cart page / hero */
    empty: "Glass is dry. Sad.",

    /**
     * State messages keyed by item count range.
     * Used by getCartMessage() in lib/utils/copy.ts.
     */
    states: [
      { range: [0,  0]  as [number, number], message: "Glass is dry. Sad." },
      { range: [1,  1]  as [number, number], message: "One in. Don't be shy." },
      { range: [2,  2]  as [number, number], message: "Now we're talking." },
      { range: [3,  4]  as [number, number], message: "Bro you're not even hiding it." },
      { range: [5,  7]  as [number, number], message: "Theka management wants a word." },
      { range: [8,  9]  as [number, number], message: "We're impressed and concerned." },
      { range: [10, 999] as [number, number], message: "Stop. Please. The bartender's tired." },
    ],

    /** Randomly picked toast when an item is added */
    addedToast: [
      "Poured.",
      "One more in the glass.",
      "Cheers to that.",
      "Foam rising.",
      "Tap's flowing.",
      "Coming right up.",
      "Added. No refunds. (kidding.)",
    ],

    /** Shown when trying to add an 11th item */
    capReached: "Glass is full. Bartender's cut you off.",
  },

  // ── Forms ─────────────────────────────────────────────────────────────────

  forms: {
    placeholders: {
      email:         "you@yourcoolemail.com",
      phone:         "9876543210 (no auntyji's number)",
      name:          "your name, not your rap name",
      addressLine1:  "where the parcel goes (not your situationship's house)",
      city:          "Delhi, Mumbai… or wherever you're at",
      pincode:       "6 digits, you got this",
      college:       "where you skip class from (optional)",
      instagram:     "@yourhandle (we'll find you anyway)",
      referralSource: "instagram? word of mouth? divine intervention?",
    },

    errors: {
      badEmail:         "that's not an email. that's a vibe.",
      badPhone:         "10 digits. Indian number. don't test us.",
      badPincode:       "pincode has 6 digits. yours doesn't.",
      missingField:     "this bit's empty. we need it.",
      networkError:     "we're not online. neither are you, apparently.",
      paymentFailed:    "the tap's jammed. try again.",
      emptyCartCheckout: "can't checkout an empty glass. seek help.",
      genericError:     "something broke. wasn't us. okay maybe it was.",
    },

    success: {
      regulars:      "welcome to the regulars. you're one of us now.",
      reservation:   "locked in. drop incoming. check your inbox.",
      refillNotify:  "we'll ping you when it's back. we remember.",
    },
  },

  // ── Loading states ────────────────────────────────────────────────────────

  loading: {
    /** Generic — use when nothing more specific applies */
    generic: [
      "Pouring...",
      "Fetching the good stuff...",
      "Asking the bartender...",
      "Bottle's stuck. One sec.",
      "Foam settling...",
      "Keg's rolling...",
    ],

    checkout: [
      "Waking up Razorpay...",
      "Calling the keg...",
      "Authorising your drip...",
      "Checking the vault...",
      "Making it official...",
    ],

    fetchingProducts: [
      "Checking the bottles...",
      "Getting the good stuff out...",
      "Dusting off the inventory...",
    ],

    submittingForm: [
      "Sending...",
      "Filing the paperwork...",
      "Talking to the bartender...",
      "Almost there...",
    ],
  },

  // ── CTAs ──────────────────────────────────────────────────────────────────

  cta: {
    addToGlass:    "One round, please",
    reserve:       "Tap the keg →",
    checkout:      "Settle the bill →",
    signUpRegular: "Become a regular →",
    backToHome:    "← Back to the bar",
    refillNotify:  "Bell me when it's back",
    submitGeneric: "Cheers →",
    viewAll:       "See the full pour →",
    readStory:     "Read the full story →",
  },

  // ── Status labels ─────────────────────────────────────────────────────────

  status: {
    freshlyPoured: "Freshly Poured · abhi nikla hai",
    happyHour:     "Happy Hour Exclusive",
    tappedOut:     "Tapped Out · khatam",
    lastRound:     "Last Round · khatam hone wala hai",
    nowPouring:    "Now Pouring",
    openingSoon:   "Opening Night · doors khulne wale hain",
  },

  // ── Loyalty badges ────────────────────────────────────────────────────────
  // Used by getBadge(orderCount) in lib/utils/copy.ts.

  badges: {
    walkIn:       "Walk-in · aao baithe raho",
    firstTimer:   "First Round · welcome",
    familiarFace: "Familiar Face · waapas aa gaye",
    regular:      "Regular · table ready hai",
    vip:          "Khaas Mehman · permanent tab",
  },

  // ── Footer ────────────────────────────────────────────────────────────────

  footer: {
    /**
     * Rotating footer wisdom — one is pinned per session by getSessionWisdom().
     * Must have ≥ 8 entries.
     */
    wisdom: [
      "phir milenge, regular.",
      "udhaar mangne wale ko maaf kiya jaata hai. lekin yaad rakha jaata hai.",
      "the theka closes when we say it closes.",
      "sundays are for the regulars.",
      "main character behaviour, side character budget.",
      "first one's on us. the rest? not really.",
      "if you're reading this, you're already a regular.",
      "the bartender remembers everything. that's the threat.",
      "no fights at the theka. take it outside.",
      "we don't sell water. don't ask.",
      "style is not what you wear. it's how fast you text back.",
      "six pieces. two hundred each. zero regrets.",
    ],

    madeIn: "Made in Delhi. Sold to the world.",
  },

  // ── 404 ───────────────────────────────────────────────────────────────────

  notFound: {
    title:    "Wrong Theka.",
    subtitle: "galat gully bhai. is corner pe kuch nahi milega.",
    cta:      "← back to the bar",
  },

} as const;

// ── TypeScript type ───────────────────────────────────────────────────────
// Inferred from the const so it's always in sync — no manual maintenance.

export type Copy = typeof copy;
