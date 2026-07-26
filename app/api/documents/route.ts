import { db, sortByDeadlineAsc } from "@/lib/db";
import type { RowRole } from "@/lib/types";

// The store lives in memory and changes between requests. Never prerender this.
export const dynamic = "force-dynamic";

/** `?role=` values. "all" is an escape hatch rather than a role, so it is not a RowRole. */
const ROLE_FILTERS = ["obligation", "evidence", "all"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

/**
 * The inbox is a list of things to act on. Evidence rows are settled history and
 * would bury the hero notice under 14 year-old payables, so obligations are the
 * default and evidence has to be asked for by name. D-30.
 */
const DEFAULT_ROLE_FILTER: RoleFilter = "obligation";

function isRoleFilter(value: string): value is RoleFilter {
  return (ROLE_FILTERS as readonly string[]).includes(value);
}

/**
 * GET /api/documents
 *
 * Returns a bare JSON array sorted by `deadline` ascending, null deadlines last.
 *
 * - `?role=obligation` (default) — the 3 actionable rows that make up the inbox.
 * - `?role=evidence` — the 14 purchase invoices backing the ITC claim (D-14).
 * - `?role=all` — everything, 17 rows.
 *
 * An unrecognised `role` is a 400 rather than a silent fallback to the default.
 * A typo that quietly returned the inbox would look like working code and surface
 * as an empty evidence table on stage.
 */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("role");

  if (requested !== null && !isRoleFilter(requested)) {
    return Response.json({ error: "INVALID_ROLE", allowed: ROLE_FILTERS }, { status: 400 });
  }

  const filter: RoleFilter = requested ?? DEFAULT_ROLE_FILTER;
  const rows = await db.listDocuments();
  const visible = filter === "all" ? rows : rows.filter((row) => row.role === filter);

  return Response.json(sortByDeadlineAsc(visible));
}

// Compile-time guard: the two non-"all" filters must stay exactly the RowRole union.
// If the contract adds a role, this line fails and forces a decision here.
type _FiltersCoverRoles = Exclude<RoleFilter, "all"> extends RowRole
  ? RowRole extends Exclude<RoleFilter, "all">
    ? true
    : never
  : never;
const _filtersCoverRoles: _FiltersCoverRoles = true;
void _filtersCoverRoles;
