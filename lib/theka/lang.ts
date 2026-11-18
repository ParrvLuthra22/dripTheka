/**
 * /lib/theka/lang.ts — The Theka Language.
 *
 * SINGLE SOURCE for every UI string on the site. Components import from here;
 * nothing user-visible is typed inline in JSX.
 *
 * Voice: cool friend who spends too much time online. Hinglish-comfortable.
 * Self-aware, dry humour, never corporate, never motivational-poster energy.
 *
 * Glosses: proper nouns carry a Roman-Hindi gloss (`{ en, hi }`). EN is the
 * label; HI is the lowercase italic gloss rendered after a dot by
 * <ThekaLabel>. Roman script only — Mukta renders Devanagari if we ever add it.
 *
 *   import { lang } from "@/lib/theka/lang";
 *   lang.nav.links            → primary nav
 *   lang.shutter.wordmark     → route transition wordmark
 *   lang.language.tappedOut   → { en: "Tapped Out", hi: "khatam" }
 *
 * Legacy: `@/data/copy` re-exports this object as `copy`.
 */

/** A label with its Hinglish gloss. */
export interface Gloss {
  readonly en: string;
  readonly hi: string;
}

export const lang = {

  // ── Brand ─────────────────────────────────────────────────────────────────

  brand: {
    name:      "Drip Theka",
    wordmark:  "DRIP THEKA",
    handle:    "@driptheka",
    est:       "Est. MMXXVI · Delhi",
    manifesto: "The actual product is belonging.",
    homeLabel: "Drip Theka — home",
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  nav: {
    ariaPrimary: "Primary navigation",
    ariaMobile:  "Mobile navigation",
    links: [
      { label: "Pours",    hi: "maal",       href: "/pour/pour-001" },
      { label: "Story",    hi: "kahaani",    href: "/story" },
      { label: "Building", hi: "banaate hue", href: "/building" },
      { label: "Regulars", hi: "apne log",   href: "/regulars" },
      { label: "Khata",    hi: "hisaab",     href: "/khata" },
    ],
    mobileExtra: [
      { label: "Cart",    hi: "glass",  href: "/cart" },
      { label: "Account", hi: "tum",    href: "/account" },
    ],
    menuEyebrow: "The Menu",
    menuTag:     "Pour #001",
    openMenu:    "Open menu",
    closeMenu:   "Close menu",
    walkIn:      "Walk In →",
    reserved:    "Reserved",
    soundOn:     "Sound · On",
    soundOff:    "Sound · Off",
    glassEmpty:  "Empty glass",
    inGlass:     (n: number) => `${n} in glass`,
    cartAria:    (n: number) => `Cart, ${n} item${n !== 1 ? "s" : ""}`,
    reservedAria: (r: number, t: number) => `${r} of ${t} reserved`,
  },

  // ── Route transition (PourTransition) ─────────────────────────────────────

  shutter: {
    wordmark: "DRIP THEKA",
    gloss:    "ek aur round",
  },

  // ── The Wall (home) — copy verbatim from the approved wall-reference. Do not
  //    "improve" these.

  wall: {
    meta: {
      title:       "Drip Theka — The Wall",
      description: "Serving fits, not drinks. Pour #001 — the collection, on the wall.",
    },
    hello: {
      eyebrow: "Pour #001 · currently pouring · अभी निकला है",
      title:   "Serving fits, not drinks.",
    },
    header: {
      logo:       "DRIP THEKA",
      collection: "Collection",
      back:       "← Collection",
      look:       "Try the Look",
      lookHref:   "/try-the-look",
      bag:        "Bag",
      bagAria:    (n: number) => `Bag, ${n} item${n === 1 ? "" : "s"}`,
    },
    tag: {
      pour: "POUR #001",
      sub:  (n: number, gsm: number) => `${n} fits · ${gsm} GSM`,
      no:   (code: string) => `NO. ${code}`,
    },
    foot:     "Est. MMXXVI · New Delhi",
    blackout: "lights on",
    itemAria: (name: string, price: string) => `${name} — ${price}`,
    info: {
      eyebrow: (code: string) => `Drip Theka / ${code}`,
    },
    panel: {
      eyebrow:    "Pour #001 / Tees",
      chooseSize: "Choose your size",
      fit:        "Oversized",
      selectSize: "Select a size",
      sizeAria:   "Size",
      add:        "Add to bag",
      ships:      "Ships in 5–7 days",
      poured:     "Poured ✓",
      viewAria:   "View",
      front:      "Front",
      back:       "Back",
      details:    "Design details",
      prevAria:   "Previous fit",
      nextAria:   "Next fit",
    },
    details: {
      fabric:    "Fabric",
      fabricVal: (gsm: number) => `${gsm} GSM cotton`,
      fit:       "Fit",
      fitVal:    "Oversized, dropped shoulder",
      print:     "Print",
      printVal:  "Screen print, Delhi",
    },
    toast: {
      pickSize: "Pick a size first, regular",
      poured:   (name: string, size: string) => `${name} · ${size} — poured into your glass`,
    },
  },

  // ── Try the Look (stub room) ──────────────────────────────────────────────

  tryTheLook: {
    eyebrow: "Try the Look · jaldi aa raha hai",
    title:   "This room's still being set up.",
    back:    "← back to the wall",
  },

  // ── Cursor labels — used as data-cursor="…" values ────────────────────────

  cursor: {
    view: "Dekho",
    add:  "Daalo",
    drag: "Kheencho",
    link: "Chalo",
    play: "Bajao",
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

    madeIn:   "Made in Delhi. Sold to the world.",
    followLine: "Follow · @driptheka · Made in Delhi",
    noRefills:  "No refills. That's the point.",
    payment:    "30% now · 70% when it ships",
    version:    "Pour #001 / V1.0",
    copyright:  (year: number) => `© ${year} Drip Theka`,

    columns: {
      pours:   "The Pours",
      brand:   "Brand",
      connect: "Connect",
    },
    pours: [
      { label: "Pour #001 — The First Round", href: "/pour/pour-001", muted: false },
      { label: "Pour #002 — Coming soon",     href: "#pour-002",      muted: true  },
    ],
    brandLinks: [
      { label: "The Story", href: "/story" },
      { label: "Building",  href: "/building" },
      { label: "Last Call", href: "/regulars" },
      { label: "Returns",   href: "/legal/returns" },
    ],
    connectLinks: [
      { label: "@driptheka",            href: "#" },
      { label: "Regulars early access", href: "/regulars" },
      { label: "My Account",            href: "/account" },
    ],
    legalAria: "Legal",
    legal: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms",   href: "/legal/terms" },
      { label: "Returns", href: "/legal/returns" },
    ],
  },


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
      waitlist:      "you're on the list. we'll holler.",
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
    joinWaitlist:  "Not ready yet? Get drop alerts →",
    submitGeneric: "Cheers →",
    viewAll:       "See the full pour →",
    readStory:     "Read the full story →",
    seeWhy:        "see why · view product →",
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

  // ── Bilingual Theka Language — proper nouns with Hinglish glosses ─────────
  // Used by <ThekaLabel k="..." /> — Roman Hindi only, no Devanagari here.
  // EN = the primary label. HI = lowercase italic gloss shown after a dot.

  language: {
    currentlyPouring: { en: "Currently Pouring", hi: "abhi nikla hai"          },
    lastCall:         { en: "Last Call",          hi: "ek aakhri baar"          },
    buildingTheka:    { en: "Building Theka",     hi: "banaate hue"             },
    theStory:         { en: "The Story",          hi: "poori kahaani"           },
    tappedOut:        { en: "Tapped Out",         hi: "khatam"                  },
    nowPouring:       { en: "Now Pouring",        hi: "abhi chal raha hai"      },
    openingNight:     { en: "Opening Night",      hi: "darwaaze khulne wale hain"  },
    pour001:          { en: "Pour #001",          hi: "Pehla Nasha"            },
    refilled:         { en: "Refilled",           hi: "bharwa diya"             },
    happyHour:        { en: "Happy Hour",         hi: "do peg waale"            },
    freshlyPoured:    { en: "Freshly Poured",     hi: "abhi nikla hai"          },
    lastRound:        { en: "Last Round",         hi: "khatam hone wala hai"    },
    beforeYouBounce:  { en: "Before You Bounce",  hi: "ek aakhri baar"          },
    sizeSelector:     { en: "Size",               hi: "kaunsa fit?"             },
    colorSelector:    { en: "Color",              hi: "kaunsa shade?"           },
    regulars:         { en: "Regulars",           hi: "permanent customers"      },
    wrongTheka:       { en: "Wrong Theka",        hi: "galat gully"             },
    bartendersPick:   { en: "Bartender's Pick",   hi: "is hafte yeh chal raha hai" },
    theBoard:         { en: "The Board",          hi: ""            },
    freshPour:        { en: "Fresh Pour",         hi: "naya maal"               },
    mostPoured:       { en: "Most Poured",        hi: "sabse zyada chala"       },
    recentlyViewed:   { en: "Recently Viewed",    hi: "tumne dekha tha"         },
  },

  // ── Upsell modal ─────────────────────────────────────────────────────────
  // Shown right after Add to Cart — "would you like anything else?"

  upsell: {
    eyebrow:      "before you settle up",
    title:        "One more before last call?",
    subtitle:     "pairs well with what's already in your glass.",
    keepBrowsing: "Keep browsing",
  },

  // ── 404 ───────────────────────────────────────────────────────────────────

  notFound: {
    title:    "Wrong Theka.",
    subtitle: "galat gully bhai. is corner pe kuch nahi milega.",
    cta:      "← back to the bar",
  },

} as const;

export type Lang = typeof lang;
