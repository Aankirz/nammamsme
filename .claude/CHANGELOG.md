## 2026-07-26 — Pure-logic core (normalise / verify / evidence / classify)
- Added `lib/normalise.ts`: `normaliseAmount` (Indian rupee spellings -> integer rupees) and `normaliseDate` (day-first -> ISO), plus `collectAmounts` for OCR text.
- Added `lib/verify.ts`: `verifyExtraction` cross-checks Vision Extract against Vision Digitise; amount disagreement / missing annexure / missing field are blockers, arithmetic mismatch (> ₹100) is a non-blocking Flag.
- Added `lib/evidence.ts`: `assembleEvidence` filters invoices by `doc_date` (not `deadline`, per D-09) and totals ITC claimed vs matched.
- Added `lib/classify.ts`: `classifyDocType` keyword scoring, defaults to `gst_notice`.
- Added vitest tests for verify, evidence and classify (24 passing); installed vitest as a dev dependency and added `npm test`.

## 2026-07-26 — Data layer and API routes
- Added `data/seed.json`: 17 rows (1 GST notice, 14 purchase invoices, 1 receivable, 1 FSSAI licence), all strings in Hindi. Figures reconcile exactly to D-05.
- Added `lib/db.ts`: in-memory `DocumentStore` (list/get/insert/update/reset) seeded from `data/seed.json`, behind an all-async interface so a Supabase impl (D-07) swaps in without touching callers. Runtime seed validation; `sortByDeadlineAsc` helper.
- Added `app/api/documents/route.ts`: GET, bare array, deadline ascending with nulls last.
- Added `app/api/reset/route.ts`: POST, truncate and reseed, `{ ok, count }`.
- Added `app/api/drc06/route.ts`: POST filing mock (D-17). Returns `{ arn, filed_at, status, document_id }`, writes `status: "filed"` and the ARN into `file_url`. `simulateFailure: true` returns HTTP 500 `PORTAL_UNAVAILABLE` and writes nothing.

## 2026-07-26 — role split (D-30)
- `data/seed.json`: added required `role` to all 17 rows — 14 purchase invoices are `"evidence"` (settled history backing the ITC claim), notice/receivable/licence are `"obligation"`. Generator now gates on the role split: 3/14 counts, every evidence row carries a nested `evidence` object, no obligation row does, and the locked sums are asserted over evidence rows specifically.
- `lib/db.ts`: seed validation now rejects a missing or bad `role`.
- `app/api/documents/route.ts`: filters to `role=obligation` by default; `?role=evidence` and `?role=all` supported; unknown value returns 400 `INVALID_ROLE` rather than silently falling back. Compile-time guard keeps the filter union in step with `RowRole`.

## 2026-07-26 — Evidence assembly corrected for real GST rates and row roles
- `lib/evidence.ts`: `taxable`/`gst`/`invoice_ref` are now read from `row.evidence` (SeedEvidence) instead of derived. The old `taxable = gst / 0.18` was wrong twice: the seeded Punjabi textile invoices are at 5% and 12%, and `ObligationRow.amount` is the invoice GROSS, not the GST.
- `lib/evidence.ts`: derivation survives only as a fallback — `splitGross(amount, rate)` using the row's own `gst_rate`, then `FALLBACK_GST_RATE_PERCENT = 18` as a documented last resort.
- `lib/evidence.ts`: candidates are now filtered to `role === "evidence"` before the `doc_date` period filter (D-30), so obligation rows inside the period are excluded.
- Signature widened to `assembleEvidence(notice, invoices: readonly StoredRow[])` via a type-only import from `lib/db.ts` (erased at compile time, so the module stays pure).
- `lib/evidence.test.ts`: added mixed 5%/12% rate coverage, an obligation-row exclusion case, and both fallback paths. 28 tests passing.

## 2026-07-26 — Inbox + detail UI, Hindi, ledger-paper design system
- `app/globals.css`: replaced the starter tokens with a "ledger paper" design system — warm paper surfaces, ink scale, vermillion/amber/green semantic tones, Devanagari-aware type scale with explicit line-heights, radii, shadows, ledger-rule body texture, danger hatching, transform/opacity-only motion, reduced-motion guard.
- `app/layout.tsx`: `lang="hi"`, Noto Sans Devanagari as the text face + Geist Mono for Latin document stamps, Hindi metadata and viewport.
- `app/page.tsx`: inbox — exposure headline computed from rows (30-day payables, 45-day overdue receivables), deadline-sorted document list, fixed capture button, empty state.
- `app/doc/[id]/page.tsx`: detail — three fact cards (कितना / कब तक / किसने भेजा), plain-language explanation, consequence ladder, sticky decision bar, and the refusal state when `blockers.length > 0`.
- `components/**`: 20 new components split into `lib` (pure helpers), `ui` (primitives), `inbox`, `detail`.
- Fixed: letter-spacing was breaking Devanagari conjuncts — removed all tracking from Hindi text and replaced the eyebrow treatment with a rule mark (`components/ui/SectionLabel.tsx`).
