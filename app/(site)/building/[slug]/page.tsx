import type { Metadata } from "next";
import { notFound }     from "next/navigation";
import Link             from "next/link";
import { getBuildingPost, getAdjacentPosts, readingTime, BUILDING_POSTS }
  from "@/data/building";
import { Reveal }       from "@/components/motion/Reveal";
import { SplitReveal }  from "@/components/motion/SplitReveal";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return BUILDING_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBuildingPost(slug);
  if (!post) return { title: "Not Found" };
  return {
    title: `${post.title} — Building Drip Theka`,
    description: post.excerpt,
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function BuildingPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBuildingPost(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const mins = readingTime(post.body);

  // Split body into paragraphs
  const paragraphs = post.body.split(/\n\n+/).filter(Boolean);

  return (
    <article data-nav-tone="dark" className="bg-[--cream] text-[--ink] min-h-screen">

      {/* Header */}
      <header
        className="pt-12 pb-10 border-b border-[--ink]/8"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        {/* Breadcrumb */}
        <Reveal className="mb-8">
          <Link
            href="/building"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/35 hover:text-[--blue] transition-colors"
          >
            ← Building Theka
          </Link>
        </Reveal>

        {/* Title */}
        <SplitReveal
          as="h1"
          splitBy="words"
          stagger={0.04}
          from={48}
          start="top 95%"
          className="font-display italic text-[--ink] leading-tight mb-8 max-w-[820px]"
        >
          {post.title}
        </SplitReveal>

        {/* Eyebrow meta row */}
        <Reveal delay={200}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/35">
            <span>{fmtDate(post.date)}</span>
            <span className="w-px h-3 bg-[--ink]/20" aria-hidden="true" />
            <span>By {post.author}</span>
            <span className="w-px h-3 bg-[--ink]/20" aria-hidden="true" />
            <span>{mins}</span>
          </div>
        </Reveal>
      </header>

      {/* Body */}
      <div
        className="py-14 md:py-20 max-w-[720px]"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        {paragraphs.map((para, i) => (
          <Reveal key={i} delay={Math.min(i * 40, 200)} className="mb-7">
            <p
              className="font-display italic text-[--ink]/75 leading-snug"
              style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}
            >
              {para}
            </p>
          </Reveal>
        ))}

        {/* Pull quote — the excerpt, shown mid-post */}
        <div className="my-12 border-l-2 border-[--blue] pl-6">
          <p
            className="font-display italic text-[--blue] leading-snug"
            style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.6rem)" }}
          >
            &ldquo;{post.excerpt}&rdquo;
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-10">
          {post.tags.map((tag) => (
            <span key={tag} className="font-mono text-[8px] uppercase tracking-[0.14em] border border-[--ink]/15 text-[--ink]/35 px-2.5 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Prev / Next navigation */}
      <nav
        className="border-t border-[--ink]/8 py-10 grid grid-cols-1 sm:grid-cols-2 gap-5"
        style={{ paddingInline: "var(--pad-x)" }}
        aria-label="Post navigation"
      >
        {prev ? (
          <Link
            href={`/building/${prev.slug}`}
            data-hover
            className="group flex flex-col gap-1 text-left"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[--ink]/30">
              ← Previous
            </span>
            <span className="font-display italic text-[--ink] group-hover:text-[--blue] transition-colors leading-tight" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }}>
              {prev.title}
            </span>
          </Link>
        ) : <div />}

        {next ? (
          <Link
            href={`/building/${next.slug}`}
            data-hover
            className="group flex flex-col gap-1 text-right sm:ml-auto"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[--ink]/30">
              Next →
            </span>
            <span className="font-display italic text-[--ink] group-hover:text-[--blue] transition-colors leading-tight" style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)" }}>
              {next.title}
            </span>
          </Link>
        ) : <div />}
      </nav>

      {/* Back to index */}
      <div className="text-center py-10 border-t border-[--ink]/8" style={{ paddingInline: "var(--pad-x)" }}>
        <Link
          href="/building"
          data-hover
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30 hover:text-[--blue] transition-colors"
        >
          ← All dispatches
        </Link>
      </div>
    </article>
  );
}
