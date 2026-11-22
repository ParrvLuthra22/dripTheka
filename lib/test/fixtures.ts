// Fixtures for DB tests. Import AFTER "./setupDb".
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { reservations, reservationItems } from "@/lib/db/schema";

let n = 0;

export async function seedReservation(o: {
  slug?: string; qty?: number; status?: typeof reservations.$inferInsert["status"];
  depositPaise?: number; orderId?: string; paymentId?: string | null;
  orderNumber?: string; ageMinutes?: number; email?: string;
} = {}) {
  n++;
  const depositPaise = o.depositPaise ?? 38970;
  const qty = o.qty ?? 1;
  const [r] = await db.insert(reservations).values({
    orderNumber:       o.orderNumber ?? `DT-2026-SEED${String(n).padStart(6, "0")}`,
    email:             o.email ?? `buyer${n}@example.com`,
    name: "Test Buyer", phone: "9876543210",
    address: { line1: "12 Test Street", city: "Delhi", state: "Delhi", pincode: "110001" },
    subtotalPaise:     Math.round(depositPaise / 0.3),
    depositPaise,
    balancePaise:      Math.round(depositPaise / 0.3) - depositPaise,
    razorpayOrderId:   o.orderId ?? `order_seed_${n}`,
    razorpayPaymentId: o.paymentId ?? null,
    status:            o.status ?? "pending",
  }).returning();
  await db.insert(reservationItems).values({
    reservationId: r.id, productSlug: o.slug ?? "seed-slug", productName: "Seed Tee",
    size: "M", qty, unitPricePaise: 129900, lineTotalPaise: 129900 * qty,
  });
  if (o.ageMinutes !== undefined) {
    await db.execute(sql`UPDATE reservations SET created_at = now() - make_interval(mins => ${o.ageMinutes}) WHERE id = ${r.id}`);
  }
  return r;
}

export async function statusOf(id: string): Promise<string> {
  const { rows } = await db.execute(sql`SELECT status FROM reservations WHERE id = ${id}`);
  return (rows[0] as { status: string }).status;
}

export async function reservedCount(): Promise<number> {
  const { rows } = await db.execute(sql`SELECT COALESCE(SUM(reserved), 0)::int AS n FROM pour_progress`);
  return Number((rows[0] as { n: number }).n);
}

export const paidOrder = (id: string, amount: number) =>
  ({ id, amount, amount_paid: amount, currency: "INR", status: "paid" });
