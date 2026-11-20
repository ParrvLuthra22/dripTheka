// Share card for /product/[slug]: the wall's plaster, the fit on its ledge, the name.
// Prerendered at build (static params) — webp sources are converted to PNG/JPEG
// because the image renderer only reads png/jpeg/gif.

import path from "node:path";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { POUR_001, hasWall } from "@/data/pour-001";
import { formatPrice } from "@/lib/utils/format";

export const alt = "Drip Theka — the fit on the wall";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return POUR_001.products.filter(hasWall).map((p) => ({ slug: p.slug }));
}

const pub = (rel: string) => path.join(process.cwd(), "public", rel);

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = POUR_001.products.filter(hasWall).find((p) => p.slug === slug);

  const bgBuf = await sharp(pub("theka/wall/wall.jpg"))
    .resize(size.width, size.height, { fit: "cover" })
    .jpeg({ quality: 82 })
    .toBuffer();
  const bg = `data:image/jpeg;base64,${bgBuf.toString("base64")}`;

  let fit = "";
  if (product) {
    const fitBuf = await sharp(pub(product.wall.back)).resize({ height: 470 }).png().toBuffer();
    fit = `data:image/png;base64,${fitBuf.toString("base64")}`;
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#5c5555", color: "#efebe6" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} alt="" width={size.width} height={size.height} style={{ position: "absolute", left: 0, top: 0 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex",
          background: "radial-gradient(130% 95% at 50% 42%, rgba(0,0,0,0) 40%, rgba(12,9,9,0.62) 100%)" }} />
        <div style={{ position: "absolute", left: 72, top: 64, display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>DRIP THEKA</div>
        <div style={{ position: "absolute", left: 72, top: 200, display: "flex", flexDirection: "column", maxWidth: 520 }}>
          <div style={{ display: "flex", fontSize: 22, opacity: 0.7, letterSpacing: 2 }}>
            {`POUR #001 / NO. ${product?.code ?? ""}`}
          </div>
          <div style={{ display: "flex", fontSize: 86, fontWeight: 800, lineHeight: 0.95, marginTop: 18, textTransform: "uppercase", letterSpacing: -2 }}>
            {product?.name ?? "Drip Theka"}
          </div>
          <div style={{ display: "flex", fontSize: 26, marginTop: 14, opacity: 0.7 }}>
            {product?.colourway ?? ""}
          </div>
          <div style={{ display: "flex", fontSize: 30, marginTop: 28, opacity: 0.85 }}>
            {product ? formatPrice(product.price) : ""}
          </div>
        </div>
        {fit && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fit} alt="" height={470} style={{ position: "absolute", right: 150, top: 70 }} />
        )}
        {/* the ledge */}
        <div style={{ position: "absolute", right: 70, width: 560, top: 536, height: 8, display: "flex",
          background: "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.25))" }} />
        <div style={{ position: "absolute", right: 90, width: 520, top: 546, height: 22, display: "flex",
          background: "radial-gradient(50% 50% at 50% 30%, rgba(0,0,0,0.45), rgba(0,0,0,0))" }} />
      </div>
    ),
    { ...size },
  );
}
