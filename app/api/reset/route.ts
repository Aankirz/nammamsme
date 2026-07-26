import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/reset
 *
 * Drops everything the demo produced and reseeds from data/seed.json. D-07 requires
 * this: judges run the demo more than once and the second run must start from the
 * same state as the first. Takes no body.
 */
export async function POST() {
  const count = await db.reset();
  return Response.json({ ok: true, count });
}
