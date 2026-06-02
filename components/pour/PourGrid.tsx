"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductCard } from "./ProductCard";
import type { Pour } from "@/data/pour-001";

gsap.registerPlugin(ScrollTrigger);

interface PourGridProps {
  pour: Pour;
}

export function PourGrid({ pour }: PourGridProps) {
  const headingRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headingRef.current) return;

    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 80%",
          once: true,
        },
      }
    );
  }, []);

  return (
    <section className="py-24 bg-[#E4E2DD]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12">
        {/* Section header */}
        <div ref={headingRef} className="mb-16 flex items-end justify-between border-b border-[#141518]/10 pb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-[#004AAD] mb-2">
              Pour #{pour.number}
            </p>
            <h2 className="font-display italic text-4xl md:text-5xl text-[#141518]">
              {pour.title}
            </h2>
            <p className="font-sans text-[#141518]/60 mt-3 max-w-[500px]">
              {pour.description}
            </p>
          </div>
          <p className="hidden md:block font-mono text-xs text-[#141518]/30 text-right max-w-[200px] leading-relaxed">
            {pour.editorialNote}
          </p>
        </div>

        {/* Product grid — asymmetric 2/3 col */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {pour.products.map((product, i) => (
            <div
              key={product.id}
              className={
                // First product gets double width on desktop
                i === 0 ? "col-span-2 md:col-span-1" : ""
              }
            >
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
