// Create a reservation inside ONE transaction:
//   lock each design's pour_designs row → check capacity per DESIGN (colourways share a glass)
//   → insert reservation (unique order number, retrying on collision) → insert line items.
// The row lock makes "count then insert" atomic, so two buyers racing for the last slot —
// even in different colourways of the same design — can't both win.

import { db, generateOrderNumber as defaultGenerate, type Tx } from "@/lib/db/client";
import { reservations, reservationItems, type ShippingAddress } from "@/lib/db/schema";
import { committedUnits, ensurePourDesign, lockDesign, TappedOutError } from "./capacity";
import { glassKeyOf } from "@/lib/pour/designs";
import { capFor } from "@/lib/config";

export interface ReservationLine {
  productSlug:    string;
  productName:    string;
  size:           string;
  qty:            number;
  unitPricePaise: number;
  lineTotalPaise: number;
}

export interface CreateReservationInput {
  userId:        string | null;
  email:         string;
  name:          string;
  phone:         string;
  address:       ShippingAddress;
  lines:         ReservationLine[];
  subtotalPaise: number;
  depositPaise:  number;
  balancePaise:  number;
  /** Already validated by checkReferral(). */
  referralCode?: string | null;
  waOptIn?:      boolean;
  balanceMethod?: "online" | "cod" | null;
}

export interface CreateReservationOptions {
  /** Cap a design's row is SEEDED with the first time it is touched (default: config). Tests use small caps. */
  seedCap?:          (design: string) => number;
  /** Override order-number generation (tests). */
  generateOrderNumber?: () => string;
  maxOrderNumberAttempts?: number;
}

/** Insert a reservation row, regenerating the order number if it collides. */
export async function insertWithUniqueOrderNumber(
  tx:        Tx,
  values:    Omit<typeof reservations.$inferInsert, "orderNumber">,
  generate:  () => string = defaultGenerate,
  attempts = 8,
): Promise<{ id: string; orderNumber: string }> {
  for (let i = 0; i < attempts; i++) {
    const orderNumber = generate();
    // ON CONFLICT DO NOTHING (not a thrown error) keeps the transaction usable after a collision.
    const [row] = await tx
      .insert(reservations)
      .values({ ...values, orderNumber })
      .onConflictDoNothing({ target: reservations.orderNumber })
      .returning({ id: reservations.id, orderNumber: reservations.orderNumber });
    if (row) return row;
  }
  throw new Error("could not allocate a unique order number");
}

export async function createReservation(
  input: CreateReservationInput,
  opts:  CreateReservationOptions = {},
): Promise<{ reservationId: string; orderNumber: string }> {
  // Units requested per DESIGN (and the first colourway asked for, for the error message).
  const requested = new Map<string, { qty: number; slug: string }>();
  for (const l of input.lines) {
    const design = glassKeyOf(l.productSlug);
    const cur = requested.get(design);
    requested.set(design, { qty: (cur?.qty ?? 0) + l.qty, slug: cur?.slug ?? l.productSlug });
  }
  const designs = [...requested.keys()].sort(); // global lock order → no deadlocks between carts

  return db.transaction(async (tx) => {
    for (const d of designs) await ensurePourDesign(tx, d, opts.seedCap ?? capFor);

    for (const d of designs) {
      const { cap, status } = await lockDesign(tx, d);          // SELECT … FOR UPDATE
      const want = requested.get(d)!;
      if (status !== "open") throw new TappedOutError(d, want.slug);
      const used = await committedUnits(tx, d);
      if (used + want.qty > cap) throw new TappedOutError(d, want.slug);
    }

    const row = await insertWithUniqueOrderNumber(
      tx,
      {
        userId:        input.userId,
        referralCode:  input.referralCode ?? null,
        waOptIn:       input.waOptIn ?? false,
        balanceMethod: input.balanceMethod ?? null,
        email:         input.email,
        name:          input.name,
        phone:         input.phone,
        address:       input.address,
        subtotalPaise: input.subtotalPaise,
        depositPaise:  input.depositPaise,
        balancePaise:  input.balancePaise,
        // Unique placeholder until the Razorpay order exists (the column is UNIQUE).
        razorpayOrderId: `pending:${crypto.randomUUID()}`,
        status:        "pending",
      },
      opts.generateOrderNumber,
      opts.maxOrderNumberAttempts,
    );

    await tx.insert(reservationItems).values(input.lines.map((l) => ({ ...l, reservationId: row.id })));
    return { reservationId: row.id, orderNumber: row.orderNumber };
  });
}
