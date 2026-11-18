/**
 * /data/copy.ts — legacy entry point.
 *
 * The copy dictionary moved to /lib/theka/lang.ts (the Theka Language).
 * Import `lang` from there in new code; this re-export keeps old imports alive.
 */

export { lang as copy, type Lang as Copy } from "@/lib/theka/lang";
