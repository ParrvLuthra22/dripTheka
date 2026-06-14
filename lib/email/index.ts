// lib/email — Resend transactional emails.
// Gracefully no-ops if RESEND_API_KEY isn't configured, same pattern as
// the Klaviyo helper in /app/api/regulars/route.ts.

import { Resend } from "resend";
import { getPriceDisplay } from "@/data/pour-001";

export interface OrderConfirmationItem {
  productName: string;
  size: string;
  qty: number;
  lineTotalPaise: number;
}

export interface SendOrderConfirmationOpts {
  to: string;
  customerName: string;
  orderNumber: string;
  items: OrderConfirmationItem[];
  subtotalPaise: number;
  depositPaise: number;
  balancePaise: number;
}

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "REPLACE_ME") return null;
  return new Resend(key);
}

export async function sendOrderConfirmationEmail(opts: SendOrderConfirmationOpts): Promise<void> {
  const resend = getResendClient();
  if (!resend) return; // not configured — dev mode, silent no-op

  const from = process.env.RESEND_FROM_EMAIL || "Drip Theka <orders@driptheka.com>";

  try {
    await resend.emails.send({
      from,
      to: opts.to,
      subject: `Stool reserved · Order ${opts.orderNumber}`,
      html: renderOrderConfirmationHtml(opts),
    });
  } catch (e) {
    console.warn("[resend] Failed to send order confirmation:", e);
  }
}

function renderOrderConfirmationHtml(opts: SendOrderConfirmationOpts): string {
  const itemRows = opts.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0; font-family:monospace; font-size:13px; color:#141518;">
            ${item.productName} (${item.size}) &times; ${item.qty}
          </td>
          <td style="padding:8px 0; font-family:monospace; font-size:13px; color:#141518; text-align:right;">
            ${getPriceDisplay(item.lineTotalPaise)}
          </td>
        </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#E4E2DD; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:480px; margin:0 auto; padding:40px 24px;">
      <div style="background-color:#004AAD; padding:32px 24px; text-align:center;">
        <p style="color:#E4E2DD; font-family:monospace; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; margin:0;">
          Drip Theka
        </p>
        <h1 style="color:#E4E2DD; font-style:italic; font-size:32px; margin:16px 0 0;">
          Stool reserved.
        </h1>
      </div>
      <div style="background-color:#ffffff; padding:24px;">
        <p style="font-size:14px; color:#141518; margin:0 0 16px;">
          Hey ${opts.customerName || "there"} — your order <strong>${opts.orderNumber}</strong> is locked in. Here&rsquo;s the receipt.
        </p>
        <table style="width:100%; border-collapse:collapse; border-bottom:1px solid rgba(20,21,24,0.12); padding-bottom:12px;">
          ${itemRows}
        </table>
        <table style="width:100%; margin-top:12px;">
          <tr>
            <td style="font-family:monospace; font-size:12px; color:rgba(20,21,24,0.5); padding:4px 0;">Subtotal</td>
            <td style="font-family:monospace; font-size:12px; color:rgba(20,21,24,0.5); text-align:right; padding:4px 0;">${getPriceDisplay(opts.subtotalPaise)}</td>
          </tr>
          <tr>
            <td style="font-family:monospace; font-size:12px; color:#004AAD; font-weight:bold; padding:4px 0;">Deposit paid now</td>
            <td style="font-family:monospace; font-size:12px; color:#004AAD; font-weight:bold; text-align:right; padding:4px 0;">${getPriceDisplay(opts.depositPaise)}</td>
          </tr>
          <tr>
            <td style="font-family:monospace; font-size:12px; color:rgba(20,21,24,0.5); padding:4px 0;">Balance on Opening Night</td>
            <td style="font-family:monospace; font-size:12px; color:rgba(20,21,24,0.5); text-align:right; padding:4px 0;">${getPriceDisplay(opts.balancePaise)}</td>
          </tr>
        </table>
      </div>
      <div style="background-color:#141518; padding:16px 24px; text-align:center;">
        <p style="color:rgba(228,226,221,0.4); font-family:monospace; font-size:10px; letter-spacing:0.14em; text-transform:uppercase; margin:0;">
          phir milenge, regular.
        </p>
      </div>
    </div>
  </body>
</html>`;
}
