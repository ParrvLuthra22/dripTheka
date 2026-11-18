import type { Metadata } from "next";
import Link from "next/link";
import { lang } from "@/lib/theka/lang";

const T = lang.tryTheLook;

export const metadata: Metadata = { title: "Try the Look" };

// Stub — "Try the Look" (styled-outfits room) is a later room.
export default function TryTheLookPage() {
  return (
    <section className="container-site flex flex-col items-start gap-6 py-32">
      <p className="type-mono-sm text-blue">{T.eyebrow}</p>
      <h1 className="type-display-lg text-ink">{T.title}</h1>
      <Link href="/" className="type-mono-sm text-ink underline underline-offset-4" data-hover>
        {T.back}
      </Link>
    </section>
  );
}
