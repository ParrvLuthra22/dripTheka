// Side effects after a deposit is recorded (Klaviyo event + receipt email).
// Best-effort: failures are logged, never thrown. Callers run this via next/server `after()`.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reservationItems } from "@/lib/db/schema";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { ReservationRow } from "./settle";

async function trackKlaviyoReservation(r: ReservationRow) {
  const key = process.env.KLAVIYO_PRIVATE_KEY;
  if (!key || key === "REPLACE_ME") return;
  try {
    await fetch("https://a.klaviyo.com/api/events/", {
      method:  "POST",
      headers: { revision: "2024-10-15", "content-type": "application/json", Authorization: `Klaviyo-API-Key ${key}` },
      body: JSON.stringify({
        data: {
          type: "event",
          attributes: {
            metric:     { data: { type: "metric",  attributes: { name: "reservation_confirmed" } } },
            profile:    { data: { type: "profile", attributes: { email: r.email } } },
            properties: { order_number: r.orderNumber, deposit_paise: r.depositPaise, balance_paise: r.balancePaise },
            time:       new Date().toISOString(),
          },
        },
      }),
    });
  } catch (e) {
    console.warn("[klaviyo] Failed to track reservation_confirmed:", e);
  }
}

export async function notifyDepositPaid(r: ReservationRow): Promise<void> {
  await trackKlaviyoReservation(r);
  try {
    const items = await db
      .select({
        productName:    reservationItems.productName,
        size:           reservationItems.size,
        qty:            reservationItems.qty,
        lineTotalPaise: reservationItems.lineTotalPaise,
      })
      .from(reservationItems)
      .where(eq(reservationItems.reservationId, r.id));
    await sendOrderConfirmationEmail({
      to: r.email, customerName: r.name, orderNumber: r.orderNumber, items,
      subtotalPaise: r.subtotalPaise, depositPaise: r.depositPaise, balancePaise: r.balancePaise,
    });
  } catch (e) {
    console.warn("[payments] Failed to send order confirmation email:", e);
  }
}
