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

## 2026-07-26 — Seed: English copy, dated consequence ladders, refusal row, source blocks
- `data/seed.json`: every `obligation`, `consequence` and `counterparty` converted from Hindi to plain English, per PRODUCT.md tone. Counterparties are now Latin ("Commercial Taxes Department, Ludhiana", "Sharma Distributors", "Kumar Textiles"). No em dashes, no rupee glyph: amounts read "Rs 5,12,000".
- `data/seed.json`: `consequence` is no longer prose. Every row now carries newline-separated dated steps so the UI renders a real ladder. The hero notice ends at "December 2026: appeal window shuts, needs Rs 51,200 deposit first" (10% of the Rs 5,12,000 demand).
- `data/seed.json`: added `doc_notice_drc01_refused` — `status: "refused"`, reference ZD030726002891, deadline 2026-08-07 (a week before the hero), and two populated blockers: `missing_annexure` and `amount_disagreement` on `interest`, each with a `sourceRef` cropping to the block that proves it. The refusal state is now reachable without live processing. The hero notice keeps `blockers: []`.
- `data/seed.json`: both GST notices carry a nested `source` (2550x3300, 8 blocks) built from the real Sarvam OCR in `data/fixtures/notice-hero.blocks.json`, and a populated `source_ref` pointing at the totals block, so figures are traceable to the page.
- `lib/db.ts`: added `SeedSource` / `SeedSourceBlock` and an optional `source` on `StoredRow`, exactly as `evidence` and `notice`. `lib/types.ts` untouched; `ObligationRow` stays assignable.
- `lib/db.ts`: extended the load-time guards — blocker kind/detail/sourceRef shape, source bbox arity and in-page bounds, notice arithmetic (tax + interest + penalty = total; claimed - matched = unmatched), per-invoice arithmetic (taxable + gst = amount; gst = rate% of taxable), and a cross-row ITC reconciliation that refuses to load unless the 14 evidence invoices sum to the notice's claimed ITC and the 3 unmatched sum to the gap.
- Row count is now 18: 4 obligation, 14 evidence. All arithmetic gates tie out; `npx tsc --noEmit` and `npm test` (28 tests) clean.
- Follow-up: renamed invoice 02's supplier from "Gupta Hosiery Mills" to "Chadha Knit Mills" (invoice ref GHM/25-26/0087 -> CKM/25-26/0087). "Gupta Hosiery Mills" is the trader himself per the notice's addressee block, so listing him as a supplier read as buying from himself. Added an identity gate that parses the addressee out of OCR block 1 and refuses to emit if any row's `counterparty` matches it. Amounts untouched: taxable 14,00,000 + GST 1,68,000 = 15,68,000.

## 2026-07-26 — Desktop two-pane rebuild, English UI
- Rebuilt the UI as a desktop-first two-pane master-detail case file. New `components/shell/*` (Shell, IdentityBar, ResetButton, Rail, ExposurePanel, RailRow) renders identically on `/` and `/doc/[id]`; the rail is 360px fixed above 1024px and collapses to a top list below.
- Replaced every Devanagari string with plain English. Deleted `components/lib/hindi.ts`, added `components/lib/copy.ts`. No em dashes in shipped copy.
- Added the source-document pane: `components/lib/source.ts` narrows the seed's `source` object, `components/lib/trace.ts` resolves a figure to the block it was printed in by normalised digit comparison, `components/detail/SourcePane.tsx` reproduces the page from bounding boxes. Clicking a figure highlights its block; clicking a block works in reverse. Degrades to a single column when `source` is absent.
- Rewrote the refusal state as `components/detail/RefusalPanel.tsx`: `--stamp` on `--stamp-tint` ground, "We will not guess.", one entry per blocker with a link into the facsimile, and the file action left visible and disabled with the reason wired via `aria-describedby`.
- Rewrote `app/globals.css` on DESIGN.md's oklch palette, fixed rem type scale, 4-6px radii, 2px ink focus ring. Removed the ledger background gradients and the Devanagari webfonts.
- Wired "Confirm and file reply" to `POST /api/drc06` behind a reply preview that staggers the supporting invoices in at 40ms.
- Follow-up 2: `doc_notice_drc01_refused` is now a genuinely separate demand, not a copy of the hero. It duplicated the hero's Rs 5,12,000, so the exposure headline summed one demand twice and read Rs 10,24,000. Now: period Oct-Dec 2024, tax Rs 1,60,000 + interest Rs 28,800 (18%) + penalty Rs 16,000 (10%) = Rs 2,04,800. Combined exposure Rs 7,16,800. Blockers, `status: "refused"`, deadline and reference number unchanged.
- Its `source` blocks were rewritten to its own period and figures (bboxes kept, geometry is real and the form layout is identical). Reusing the hero's OCR would have printed Rs 5,12,000 beside a row reading Rs 2,04,800 and pointed "show it on the page" at contradicting text.
- New generator gates: the two notices may not share an amount or an overlapping period; each facsimile must print its own total and reference and must NOT print the other's; combined owing exposure must equal Rs 7,16,800; no evidence invoice may fall inside the refused notice's period. Confirmed `assembleEvidence` returns all 14 invoices for the hero period and zero for Oct-Dec 2024. Hero chain 18,00,000 / 14,00,000 / 4,00,000 untouched; 28/28 tests pass.
