// The refill list: "tell me when this design is poured again".

import { z } from "zod";
import { db, isUniqueViolation, type Db, type Tx } from "@/lib/db/client";
import { refillRequests } from "@/lib/db/schema";
import { POUR_DESIGNS } from "./designs";

const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const refillSchema = z.object({
  design: z.string().refine((d) => POUR_DESIGNS.some((x) => x.id === d), "Unknown design"),
  email:  z.string().trim().toLowerCase().email("Invalid email").max(254),
  phone:  z.preprocess(blankToUndefined, z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid mobile number").optional()),
  waOptIn: z.boolean().optional(),
}).refine((d) => !d.waOptIn || !!d.phone, { message: "A mobile number is needed for WhatsApp", path: ["phone"] });

export type RefillInput = z.infer<typeof refillSchema>;

/** 'added' or 'duplicate' (same design + email already on the list). */
export async function addRefillRequest(input: RefillInput, conn: Db | Tx = db): Promise<"added" | "duplicate"> {
  try {
    const rows = await conn.insert(refillRequests)
      .values({ designId: input.design, email: input.email, phone: input.phone ?? null, waOptIn: input.waOptIn ?? false })
      .onConflictDoNothing()
      .returning({ id: refillRequests.id });
    return rows.length ? "added" : "duplicate";
  } catch (e) {
    if (isUniqueViolation(e)) return "duplicate";
    throw e;
  }
}
