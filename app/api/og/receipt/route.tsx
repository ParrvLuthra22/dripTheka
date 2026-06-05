// GET /api/og/receipt?orderNumber=...&deposit=...&total=...
//
// Server-rendered OG image — a minimal receipt-like card (1200×630).
// When the success URL is shared to Slack/WhatsApp/Twitter, this is what
// shows in the preview. Same thermal-printer aesthetic, adapted to 16:9.

import { ImageResponse } from "next/og";
import { DROP_DATE } from "@/data/pour-001";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber") ?? "DT-2026-XXXXX";
  const deposit     = searchParams.get("deposit") ?? "0";
  const total       = searchParams.get("total")   ?? "0";

  const depositINR = `₹${(Number(deposit) / 100).toLocaleString("en-IN")}`;
  const totalINR   = `₹${(Number(total)   / 100).toLocaleString("en-IN")}`;

  const dropDateStr = DROP_DATE.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  }).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width:           "100%",
          height:          "100%",
          backgroundColor: "#004AAD",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "center",
          fontFamily:      "monospace",
          position:        "relative",
        }}
      >
        {/* Receipt card */}
        <div
          style={{
            backgroundColor: "#FAFAF7",
            width:           560,
            padding:         "36px 40px",
            display:         "flex",
            flexDirection:   "column",
            gap:             12,
            boxShadow:       "0 8px 48px rgba(0,0,0,0.3)",
            position:        "relative",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <div
              style={{
                fontSize:    48,
                fontWeight:  900,
                color:       "#141518",
                letterSpacing: "-0.02em",
                lineHeight:  0.9,
              }}
            >
              DRIP THEKA
            </div>
            <div style={{ fontSize: 11, color: "#14151880", marginTop: 6, fontStyle: "italic" }}>
              "serving fits, not drinks"
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px dashed #14151840", margin: "4px 0" }} />

          {/* Order */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 13, color: "#14151860", fontFamily: "monospace" }}>
              POUR #001 · pehla pyaala
            </div>
            <div style={{ fontSize: 13, color: "#14151860", fontFamily: "monospace" }}>
              OPENING NIGHT · {dropDateStr}
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #14151440", margin: "2px 0" }} />

          <div style={{ fontSize: 20, fontWeight: 700, color: "#141518", fontFamily: "monospace" }}>
            ORDER #{orderNumber}
          </div>

          <div style={{ borderTop: "1px dashed #14151440", margin: "2px 0" }} />

          {/* Totals */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["TOTAL ORDER VALUE", totalINR],
              ["PAID TODAY (30%)",  depositINR],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  fontFamily: "monospace",
                  color: "#141518",
                }}
              >
                <span>{label}</span>
                <span style={{ fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #14151440", margin: "2px 0" }} />

          <div
            style={{
              textAlign:  "center",
              fontSize:   14,
              color:      "#141518",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            THANK YOU, REGULAR.
          </div>

          {/* Footer tag */}
          <div
            style={{
              textAlign:   "center",
              fontSize:    10,
              color:       "#14151850",
              fontFamily:  "monospace",
              letterSpacing: "0.08em",
              marginTop:   4,
            }}
          >
            driptheka.com · @driptheka
          </div>
        </div>

        {/* Cobalt strip bottom */}
        <div
          style={{
            position:        "absolute",
            bottom:          0,
            left:            0,
            right:           0,
            height:          40,
            backgroundColor: "#002F70",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <div style={{ color: "#E4E2DD80", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.14em" }}>
            STOOL RESERVED · DRIP THEKA
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    }
  );
}
