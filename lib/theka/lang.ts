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
      story:      "Our Story",
      storyHref:  "/story",
      bag:        "Bag",
      // v1 theka wording (nav.inGlass): the bag IS the glass
      bagAria:    (n: number) => (n === 0 ? "Your glass, empty" : `Your glass, ${n} in glass`),
    },
    tag: {
      pour: "POUR #001",
      sub:  (n: number, gsm: number) => `${n} fits · ${gsm} GSM`,
      no:   (code: string) => `NO. ${code}`,
    },
    foot:     "Est. MMXXVI · New Delhi",
    blackout: "lights on",
    /** `status`: the live glass read-out ("tapped out", "18 of 50 poured"), or null when unknown. */
    itemAria: (name: string, price: string, status?: string | null) => (status ? `${name} — ${price} — ${status}` : `${name} — ${price}`),
    info: {
      eyebrow: (code: string) => `Drip Theka / ${code}`,
    },
    panel: {
      eyebrow:    "Pour #001 / Tees",
      chooseSize: "Choose your size",
      fit:        "Oversized",
      colourwayAria: "Colourway",
      selectSize: "Select a size",
      sizeAria:   "Size",
      add:        "Add to bag",
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
      poured:   (name: string, colourway: string, size: string) => `${name} · ${colourway} · ${size} — poured into your glass`,
      /** v1 cart.capReached — a line can't go past what /api/reserve accepts (10). */
      glassFull: "Glass is full. Bartender's cut you off.",
    },
    // What hangs on the wall besides the tees (story-wall-reference/wall.html). The rate list's
    // price / GSM / deposit are read from the real product data, not typed here.
    decor: {
      rate: {
        title:      "RATE LIST · रेट लिस्ट",
        anyFit:     "Any fit",
        fabric:     "Fabric",
        gsm:        (gsm: number) => `${gsm} GSM`,
        fit:        "Fit",
        fitVal:     "oversized",
        reserve:    "Reserve",
        reserveVal: (pct: number) => `${pct}% now`,
      },
      enamel: { hi: "आज नकद, कल उधार", en: "CASH TODAY · CREDIT TOMORROW" },
      teaser: {
        aria:      "Pour #002, coming soon",
        tag:       "POUR #002",
        sub:       "brewing · soon",
        toast:     "Pour #002 is brewing. Regulars hear first.",
        action:    "Join the Regulars →",
        actionHref: "/regulars",
      },
      storyLink: { label: "Our story", href: "/story", line: "How the theka got its shutter." },
    },
  },

  // ── The Story (/story) — the back wall. Copy verbatim from story-wall-reference/story.html;
  //    founders edit the words here, components only lay them out. A `{ lead, accent }` pair is a
  //    headline whose second half is set in cobalt-light.

  story: {
    meta: {
      title:       "Our story",
      description: "How the theka got its shutter. Two friends, one flop, a lot of questions, and a wine shop that sells clothes. The Drip Theka story, told along the back wall.",
    },
    header: {
      logoAria: "Drip Theka — the wall",
      wall:     "The Wall",
      wallHref: "/",
      story:    "Our Story",
      look:     "Try the Look",
      lookHref: "/try-the-look",
      bag:      "Bag",
      bagAria:  (n: number) => (n === 0 ? "Your glass, empty" : `Your glass, ${n} in glass`),
      navAria:  "Story",
    },
    progress: "The back wall",
    p0: {
      eyebrow: "Our story · since April 2026",
      title:   { lead: "How the theka got ", accent: "its shutter." },
      go:      "Walk along the wall",
    },
    p1: {
      chapter: { n: "01", label: "April 2026" },
      bill: {
        title:  "ATTEMPT #1",
        sub:    "DRIP THEKA · NEW DELHI",
        done:   [{ k: "The idea", v: "✓" }, { k: "The first try", v: "✓" }],
        struck: { k: "It working", v: "✗" },
        status: { k: "STATUS", v: "FLOP" },
        giving: { k: "Giving up?", v: "almost" },
        stamp:  "NOT YET",
        note:   "one full try. ✍",
      },
      cap: { lead: "We tried something. ", accent: "It didn't work." },
    },
    p2: {
      chapter: { n: "02", label: "The homework" },
      title:   "RATE LIST · रेट लिस्ट",
      sub:     "questions we asked before making a single tee",
      rows: [
        { q: "What's missing in the market?",           a: "the gap", big: false },
        { q: "What does our generation want to wear?",  a: "asked them", big: false },
        { q: "What's in trend right now?",              a: "tracked it", big: false },
        { q: "Which GSM feels premium and lasts?",      a: "400", big: true },
      ],
    },
    p3: {
      chapter: { n: "03", label: "The people" },
      cards: [
        { k: "01", h: "Factory owners",    body: "Who can make it right, at our scale.", blue: false },
        { k: "02", h: "Supply managers",   body: "Fabric, weight, timelines, the boring stuff that matters.", blue: false },
        { k: "03", h: "DTF printing guys", body: "Prints that survive the wash and the weekend.", blue: false },
        { k: "04", h: "The plan",          body: "The product, the marketing, the whole theka.", blue: true },
      ],
    },
    p4: {
      chapter: { n: "04", label: "One word" },
      neon:    "ठेका",
      dict: {
        pr: "/ṭhekā/ · NOUN",
        defs: [
          { struck: "A wine shop." },
          { lead: "A wine shop that sells ", em: "clothes", tail: "." },
          { lead: "Something goofy and weird, on purpose. See also: ", em: "Drip Theka", tail: "." },
        ],
      },
    },
    p5: {
      chapter: { n: "05", label: "Why it's different" },
      paint:   { lead: "Alcohol tees are everywhere. ", accent: "A whole theka built on them isn't." },
      sub:     "You've seen the beer-pun tee in every market. We didn't want one funny tee. We wanted an entire store, an entire brand, built around the theka: the language, the jokes, the feeling of walking in.",
    },
    p6: {
      chapter: "House rule",
      hq:      { lead: "दूध नहीं, ", accent: "beer", tail: " पीऊंगा" },
      sub:     "HOUSE RULE · SINCE DAY ONE",
    },
    p7: {
      chapter: { n: "06", label: "Last call" },
      videoAria: "A reel from the next pour, playing on the wall-mounted TV",
      cap:     { lead: "Soon ", accent: "in your wardrobes." },
    },
    p8: {
      title: { lead: "Pull up a stool, ", accent: "regular." },
      sig:   "Parrv & Ayaan · Delhi",
      cta:   "Back to the wall",
      ctaHref: "/",
    },
  },

  // ── Product page (/product/[slug]) — below the fold ───────────────────────

  product: {
    how: {
      eyebrow: "The making",
      title:   "How it's poured",
      cols: {
        fabric: {
          label: "Fabric",
          title: (gsm: number) => `${gsm} GSM`,
          body:  "Heavy ring-spun cotton. It hangs like it has somewhere to be.",
        },
        fit: {
          label: "Fit",
          title: "Oversized",
          body:  "Dropped shoulder, boxy body. Size down if you like it closer.",
        },
        print: {
          label: "Print",
          title: "Screen print, Delhi",
          body:  "Pulled by hand in small runs, so every one is slightly its own.",
        },
      },
    },
    also: {
      eyebrow: "Keep walking the aisle",
      title:   "Also on the wall",
      aria:    (name: string, price: string) => `${name} — ${price}`,
    },
    back: "← Back to the wall",
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
      notPouringYet:    "This one isn't pouring yet, coming soon, regular.",
      paymentFailed:    "the tap's jammed. try again.",
      tappedOut:        "someone just took the last one. this colourway's tapped out.",
      paymentVerifying: "we're still confirming your payment. don't pay twice, check your email in a minute.",
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

  // ── Glasses: how full each design's glass is (wall.html .lg / #gm). Every NUMBER comes from
  //    /api/pour/001/glasses and lib/config POUR — never typed here. ────────────────────────

  glass: {
    /** The ledge glass beside each tee. */
    ledge: {
      poured:   (poured: number, cap: number) => `${poured}/${cap} poured`,
      lastCall: (left: number) => `LAST CALL · ${left} left`,
      tapped:   "TAPPED OUT",
    },
    /** The red rotated stamp over a tapped-out tee. */
    stamp: "TAPPED OUT",
    /** Panel meter (#gm): main line + mono sub-line. */
    meter: {
      open:      (poured: number, cap: number) => `${poured} of ${cap} poured`,
      openSub:   (closes: string, pct: number) => `Pour closes ${closes} · ${pct}% reserves it`,
      last:      (left: number) => `Last call · only ${left} left`,
      tapped:    "Tapped out · refill coming",
      tappedSub: "Join the refill list below",
      closed:    "This pour is closed. Next one's brewing.",
    },
    /** The tee's accessible-name tail, wall.html: "tapped out" / "n of cap poured". */
    item: { tapped: "tapped out", poured: (poured: number, cap: number) => `${poured} of ${cap} poured` },
    /** Screen-reader text for the glass drawings (they are decoration; this is the content). */
    aria: {
      open:   (name: string, poured: number, cap: number) => `${name}: ${poured} of ${cap} poured`,
      last:   (name: string, left: number) => `${name}: last call, only ${left} left`,
      tapped: (name: string) => `${name}: tapped out`,
    },
    /** The buy button in the panel. */
    buy: {
      add:        "Add to bag",
      sub:        (deposit: string) => `${deposit} now · rest when it's poured`,
      refill:     "Join the refill list",
      refillSub:  "Free · first dibs on the refill",
      closed:     "Pour closed",
      closedSub:  "Next one's brewing",
    },
    /** The inline refill form in the panel (a tapped design). */
    refill: {
      title:      "Join the refill list",
      email:      "Email",
      emailPh:    "you@yourcoolemail.com",
      phone:      "Phone (optional)",
      phonePh:    "10-digit mobile",
      wa:         "Ping me on WhatsApp",
      submit:     "Put me on the list",
      sending:    "Filing the paperwork...",
      cancel:     "Never mind",
      badEmail:   "that's not an email. that's a vibe.",
      badPhone:   "10 digits. Indian number. don't test us.",
      waNeedsPhone: "WhatsApp needs a number, regular.",
      /** Success — and also what a duplicate signup says (they ARE on the list). */
      joined:     (name: string) => `You're on the refill list for ${name}. We'll ping you first.`,
      rateLimited: "Easy, regular. Too many tries. Give it a few minutes.",
      closedRefill: "The refill list is jammed. Try again in a bit.",
    },
  },

  // ── Your tab: the right-side drawer (wall.html #tab) and the /tab page (tab.html). ───────

  tab: {
    meta: { title: "Your tab — Drip Theka", description: "Everything you've reserved, how full each glass is, and what's left to pay." },
    drawer: {
      aria:    "Your tab",
      eyebrow: "Drip Theka · your tab",
      close:   "Close",
      titles:  { bill: "What's in your glass", settle: "Settle the tab", receipt: "Stool reserved" },
      steps:   ["Glass", "Details", "Balance", "Deposit"],
      stepsAria: "Steps",
      stepOf:  (n: number, name: string) => `Step ${n} of 4: ${name}`,
    },
    bill: {
      title:    "YOUR GLASS",
      sub:      "DRIP THEKA · POUR #001 · NEW DELHI",
      empty:    ["Empty glass, regular.", "Pick a fit off the wall."],
      total:    "Total",
      payNow:   (pct: number) => `Pay now (${pct}%)`,
      balance:  "Balance when ready",
      shipping: "Shipping",
      shippingVal: "free · ships ~3–4 wks after close",
      less:     "One less",
      more:     "One more",
      remove:   "Remove",
      howTitle: "How a pour works",
      /** [text, bold, text] — the bold bit is rendered <b>. */
      how: (pct: number, closes: string): [string, string, string][] => [
        ["Reserve now with ", `${pct}%`, ". Your glass fills with everyone else's."],
        ["The pour closes on ", closes, ". Every design with orders gets made."],
        ["When yours is ready, pay the rest ", "", "online or in cash on delivery."],
      ],
      cta:      "Settle the deposit",
      ctaClosed: "Pour closed",
      closedNote: "This pour is closed. Next one's brewing.",
      friend: {
        toggle:   "Got a friend's code?",
        label:    "Friend's code",
        placeholder: "8 characters",
        hint:     "Your friend's referral code, if they gave you one.",
      },
      tappedLine: "Tapped out while you were deciding",
      tappedRemove: "Remove it",
      tappedRefill: "Join the refill list",
      /** v1 theka: the pour-closed / glass-full wording where the drawer has a matching spot. */
      glassFull: "Glass is full. Bartender's cut you off.",
    },
    details: {
      name:   { label: "Name", ph: "What do the regulars call you?" },
      phone:  { label: "Phone", ph: "10-digit mobile" },
      wa:     ["Send order and drop updates on ", "WhatsApp"] as [string, string],
      email:  { label: "Email", ph: "for your receipt" },
      addr:   { label: "Delivery address", ph: "House, street, area" },
      pin:    { label: "PIN code", ph: "110001" },
      city:   { label: "City", ph: "New Delhi" },
      state:  { label: "State", ph: "Delhi" },
      cta:    "Next: the balance",
      missing: "A few details missing, regular",
      // v1 theka voice (forms.errors)
      err: {
        name:  "this bit's empty. we need it.",
        phone: "10 digits. Indian number. don't test us.",
        email: "that's not an email. that's a vibe.",
        addr:  "this bit's empty. we need it.",
        pin:   "pincode has 6 digits. yours doesn't.",
        city:  "this bit's empty. we need it.",
        state: "this bit's empty. we need it.",
      },
    },
    balance: {
      lede: (dep: string, bal: string): [string, string, string, string, string] =>
        ["You pay ", dep, " now. How do you want to pay the rest, ", bal, ", when your order is ready?"],
      online: { title: "Pay online before dispatch", body: "We send a UPI payment link on WhatsApp/email when it's ready. Ships as soon as it's paid." },
      cod:    { title: "Cash on delivery", body: "Pay the delivery partner in cash or UPI at your door." },
      cta:    "Next: pay the deposit",
      groupAria: "How to pay the balance",
    },
    pay: {
      deposit:  (pct: number) => `Deposit (${pct}%)`,
      upiHead:  "Pay with UPI",
      /** A hint only: real UPI app choice happens inside Razorpay Checkout. Generic words, no brand marks. */
      upiHint:  ["UPI apps", "QR", "UPI ID"],
      upiHintAria: "Razorpay opens with UPI first: pick an app, scan a QR or enter a UPI ID.",
      more:     "Cards, net banking, wallets",
      moreBody: "Opens the secure Razorpay window.",
      cta:      (dep: string): [string, string, string] => ["Pay ", dep, " and reserve"],
      fine:     "Secured by Razorpay",
      fineTest: "Secured by Razorpay · test mode in this demo",
      /** v1 loading.checkout lines, shown on the button while we set the order up. */
      busy:     ["Waking up Razorpay...", "Calling the keg...", "Authorising your drip...", "Checking the vault...", "Making it official..."],
      dismissed: "No stress, your glass is still here.",
      held:     (min: number) => `held for ${min} min`,
      confirming: "Still confirming your payment…",
      confirmingSub: "don't pay twice. check your email in a minute.",
      failed:   "the tap's jammed. try again.",
      network:  "we're not online. neither are you, apparently.",
      generic:  "something broke. wasn't us. okay maybe it was.",
      unavailable: "Reservations are on a break. Try again in a minute.",
      closed:   "This pour is closed. Next one's brewing.",
      notPouring: "This one isn't pouring yet, coming soon, regular.",
      tapped:   "Tapped out while you were deciding",
      sdk:      "Couldn't reach Razorpay. Check your connection and try again.",
      back:     "Back",
    },
    receipt: {
      title:   "STOOL RESERVED",
      sub:     "DRIP THEKA · POUR #001",
      order:   "Order",
      regular: "Regular",
      depositPaid: "Deposit paid",
      balance: "Balance",
      balanceOnline: "online link",
      balanceCod:    "cash on delivery",
      stamp:   (pct: number): [string, string] => ["PAID", `${pct}%`],
      timeline: {
        reserved: "Reserved today",
        closes:   (date: string) => `Pour closes ${date}`,
        pour:     "We pour your fit (production)",
        shipOnline: "Balance link · then ships",
        shipCod:    "Ships · pay on delivery",
      },
      friend: {
        lead: "Bring a friend: code ",
        /** The ₹ figure is lib/config REFERRAL_REWARD_PAISE. */
        sub:  (reward: string) => `they get ${reward} off, you get ${reward} off the balance`,
      },
      /** v1 forms.success.reservation */
      locked:  "locked in. drop incoming. check your inbox.",
      openTab: "Open your tab",
      backToWall: "Back to the wall",
    },
    // ── /tab ──
    page: {
      navAria: "Primary",
      wall:  "The Wall",
      story: "Our Story",
      tab:   "Your Tab",
      eyebrow: "Your tab · Pour #001",
      title:   (name: string): [string, string, string] => ["Your tab, ", name, "."],
      fallbackName: "regular",
      lede:    "Everything you've reserved, how full each glass is, and what's left to pay. We'll ping you on WhatsApp at every step.",
      pill:    (pct: number) => `Reserved · ${pct}% paid`,
      pillBalance: "Balance open",
      pillShipped: "Poured & shipped",
      pillRefunded: "Refunded",
      line:    (colourway: string, size: string, qty: number) => `${colourway} · ${size} · ×${qty}`,
      glass: {
        open:   (poured: number, cap: number) => `${poured} of ${cap} poured`,
        last:   (left: number) => `LAST CALL · ${left} left`,
        tapped: "TAPPED OUT · yours is safe",
      },
      money: {
        deposit: "Deposit paid",
        balanceOnline: "Balance (online)",
        balanceCod:    "Balance (cash on delivery)",
      },
      timeline: {
        reserved: { t: "Reserved", d: (pct: number) => `Your ${pct}% is in. Your stool is saved.` },
        closes:   { t: (date: string) => `Pour closes · ${date}`, d: "Every design with orders gets made." },
        pour:     { t: "We pour your fit", d: "Printing and stitching in Delhi." },
        balanceOnline: { t: "Balance due", d: "A UPI link lands on WhatsApp. Ships once it's paid." },
        ready:    { t: "Ready to ship", d: "You pay the rest at your door." },
        done:     { t: "Poured & on its way", d: "Tracking on WhatsApp. About 3–4 weeks after the close." },
      },
      pay:     (bal: string) => `Pay ${bal} balance`,
      payNote: "Unlocks when your fit is ready. We'll message you.",
      codNote: "Cash or UPI to the delivery partner when it arrives.",
      side: {
        friendTitle: "Buy a friend a round",
        friendBody:  (reward: string) => `Your friend gets ${reward} off their first fit. You get ${reward} off your balance for every friend who reserves.`,
        copy:   "Copy code",
        copied: "Copied ✓",
        waOn:   "WhatsApp updates on",
        waBody: "Pour closing, production, balance link and tracking all come to your phone.",
      },
      empty: {
        title: "No tab open yet, regular.",
        cta:   "Pick a fit off the wall →",
        signIn: "Sign in with Google to see every order",
      },
      loading: "Checking the vault...",
      loadFailed: "We couldn't read your tab just now. Try again in a minute.",
      retry:   "Try again",
    },
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
