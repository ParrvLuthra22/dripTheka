// Create a reservation inside ONE transaction:
//   lock → check per-colourway capacity → insert reservation (unique order number,
//   retrying on collision) → insert line items.
// The advisory lock makes "count then insert" atomic, so two buyers racing for the
// last slot can't both win.

import { db, generateOrderNumber as defaultGenerate, type Tx } from "@/lib/db/client";
import { reservations, reservationItems, type ShippingAddress } from "@/lib/db/schema";
import { committedUnits, lockCapacity, TappedOutError } from "./capacity";

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
}

export interface CreateReservationOptions {
  /** Capacity (units) for a product slug. */
  capacityOf:        (slug: string) => number;
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
  opts:  CreateReservationOptions,
): Promise<{ reservationId: string; orderNumber: string }> {
  const requested = new Map<string, number>();
  for (const l of input.lines) requested.set(l.productSlug, (requested.get(l.productSlug) ?? 0) + l.qty);

  return db.transaction(async (tx) => {
    await lockCapacity(tx);

    for (const [slug, qty] of [...requested].sort(([a], [b]) => a.localeCompare(b))) {
      const used = await committedUnits(tx, slug);
      if (used + qty > opts.capacityOf(slug)) throw new TappedOutError(slug);
    }

    const row = await insertWithUniqueOrderNumber(
      tx,
      {
        userId:        input.userId,
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
