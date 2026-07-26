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

## 2026-07-26 — GST filing section: returns rail group, return detail, reconciliation
- Added a RETURNS group to the rail below OBLIGATIONS. New `components/shell/ReturnRow.tsx` and `components/lib/returns.ts` (defensive `toReturnDetail` narrowing, four standings, grouping and sort). Overdue rows carry a stamp-tint ground, the accrued late fee and 16px padding; due rows carry the due date and a day count; filed rows are one muted line ending in "filed"; a return whose payload will not narrow reads "not read". A filed return that produced a notice carries one stamp line, "led to a demand notice", so the causal chain is findable.
- Added the return detail view: `components/detail/ReturnDetail.tsx`, `ReturnFacts.tsx`, `ReturnActionBar.tsx`. No facsimile, because a return is not a scanned page. The second column carries the reconciliation panel, and when there is none it carries what the return is holding up plus the consequence ladder, so the column is never dead.
- Added `components/detail/ReconciliationPanel.tsx`: claimed against supplier-reported against unmatched, the unmatched figure in `--stamp` at text-2xl, then the causal sentence and an ink-filled link straight to the notice with its amount. Months apart are computed from filed_on to the notice's doc_date and spelled in words.
- Extracted the consequence ladder out of `FactsColumn.tsx` into `ConsequenceLadder.tsx`, and the two ActionBar button class strings into `components/ui/buttons.ts`. Both are reused by the return view; neither changes existing rendering.
- `fetchDocuments` now reads `?role=all` and drops evidence rows locally, so a return row reaches the rail whatever role the seed gives it. Rows carry a narrowed `return` object.
- Exposure: a return is left out of the 30-day sum when it is filed, or when its `led_to` notice is itself in the file. Without that rule the Apr-Jun 2025 mismatch would be counted once as the return and again as the Rs 5,12,000 demand it produced.

## 2026-07-26 — Rate verdicts in the reply, and Ask
- `components/lib/documents.ts`: parse the invoice `evidence` block (hsn, goods, gst_rate) onto `DocumentRow`; split `fetchAllRows` / `inTheFile` / `purchaseInvoices` so one fetch serves both the rail and the rate check.
- `components/lib/rate.ts`, `components/lib/rate-index.ts`: build a per-invoice `RateCheck` index on the server from `lib/rates.checkRate`, plus the copy for each verdict.
- `components/detail/ReplyPreview.tsx`: HSN and Rate columns; matches stay silent, mismatch is tinted with a consequence note, ambiguous and unknown say so plainly.
- `components/detail/ActionBar.tsx`: releases its sticky pin while a reply is under review so all 14 rows can flow.
- `components/detail/AskPanel.tsx`, `components/lib/ask.ts`: a collapsed question field on every document, with a pending state and the tool trace rendered as what the system read.
- `app/globals.css`: `ledger-in` fills `backwards` rather than `both`, so finished rows leave no identity transform behind.

## 2026-07-26 — Inbox rebuilt to the Industry design
- Replaced the two-pane master-detail inbox with the single scrolling page from `design/namma-msme.design.html`: nav bar, three-cell headline row, GST returns plate, document table, accuracy scoreboard.
- Added `components/inbox/**` (Blueprint primitive, HeadlineRow, ReturnsPlate, DocumentTable, Scoreboard, row/speech/style helpers) and `components/shell/NavBar.tsx`.
- Deleted `components/shell/{Rail,RailRow,ReturnRow,ExposurePanel,IdentityBar}.tsx` and `components/detail/EmptyDetail.tsx`; `Shell.tsx` is now nav + main only.
- `components/lib/money.ts` now emits the `₹` glyph; `components/lib/exposure.ts` gained `overdueReceivables` and `mostUrgent`.

## 2026-07-26 — Document detail screens ported to the Industry design
- `app/doc/[id]/page.tsx`: the detail route is now a centred 1280px page inside `Shell`, opening with the design's `← Inbox` ghost button. The rail is gone with the inbox rebuild.
- `components/detail/DetailBody.tsx` (new, the one client boundary): the design's `1fr / 400px` grid. Left column is header, fact strip, plain-words card, consequence ladder, evidence assembly, Ask. Right column is the facsimile, the checks panel and the file card, sticky at 76px. It owns the highlight key, the reply draft fetch, and the filing call, so the filed confirmation can replace the whole screen.
- `components/detail/RefusalPanel.tsx`: rebuilt as the design's loud refusal — an `--color-accent-900` field with a 5px `--stamp` edge, a circle-slash at stroke 1.5, "This will not be filed" at 44px condensed, one hairline-separated row per blocker with "Show me on the page", and the file action present, disabled and wired to its reason through `aria-describedby`. When a document is refused the right-column file card is not drawn, exactly as the design does it.
- New: `TracedFacts` + `FactCell` (the bordered three-cell fact strip with dotted-accent trace buttons and the speak button), `PlainWords`, `ChecksPanel` (three yes/no checks derived from the blocker kinds), `EvidenceTable` (design table plus the claimed / matched / unmatched footer, the third cell tinted `--color-accent-100`), `FilePanel`, `FiledScreen`, `ReturnFilePanel`.
- Deleted: `TraceLayout`, `FactsColumn`, `ActionBar`, `ReplyPreview`, `ReturnActionBar`, `ui/SectionHeading`, `ui/DocTypeStamp`, `ui/DayCount`, and the duplicate `ui/Blueprint` (the inbox primitive is the one).
- `SourcePane` keeps click-to-highlight both ways; the highlight is now steel accent rather than stamp, since stamp is reserved for lateness and refusal.
- `CapturePlaceholder` carries both design screens: the dashed blueprint drop zone and, while working, the two-up processing view with a preview plate and the measured hop log.
- `ui/{Money,SpeakButton,buttons}.ts(x)` moved onto the system: condensed display numerals, a Lucide speaker at stroke 1.5 in a `.btn .btn-icon .btn-ghost`, and `.btn`/`.btn-primary`/`.btn-secondary` in place of the old hand-rolled classes. `ui/Kicker.tsx` reads the inbox's `KICKER` token so the two cannot drift.
- `components/lib/money.ts` gained `inRupees`, which rewrites `Rs 4,00,000` in seeded and model-written prose to the glyph on the way to the screen.

## 2026-07-26 — Inbox: rank the answer, translate the jargon, cut the noise

- `app/page.tsx` now renders four things in order of what the owner needs: one loud answer, three quiet figures, a three-column table, one line of session counts. The old H1 is gone; the answer is the H1.
- Added `components/inbox/FirstAction.tsx` and `components/inbox/first.ts`. `firstAction` ranks deterministically — a late GST return outranks everything (it compounds daily and blocks every filing behind it), then whatever falls due soonest, then the oldest receivable. The plate is the only framed element on the page and carries the only display-size type.
- Added `components/inbox/forms.ts`: `GSTR-3B` reads as "GST return", `GSTR-1` as "sales list", `GSTR-9` as "yearly GST return", with the form code demoted to a quiet second label. `feePerDay` derives the ₹50 daily fee from the seeded late fee rather than hard-coding it.
- Replaced `HeadlineRow` with `Standing.tsx`: the same three figures at 21px instead of 54px, no frames, no speaker buttons, whitespace instead of rules.
- Deleted `ReturnsPlate.tsx`. Three identical overdue cards collapse into one statement in the plate plus a quiet tail line that still links every late return and the next one due.
- Deleted `Scoreboard.tsx` in favour of `SessionNote.tsx`, one 11px sentence at the foot of the page.
- `DocumentTable.tsx` dropped to three columns — what to do, how much, by when. "Other party" is gone (the action line carries the name), the status column is gone with it, and "Seeded" with it. Type is a small uppercase mark on the action line; blocked rows carry one stamp-red word. Row sub-lines removed.
- `rows.ts`: `actionTitle` speaks plainly ("Answer the tax demand", "Renew your food licence"), `kindMark` replaces `kindLabel`, `isBlocked` replaces the status tag map, and `actionDetail`/`STATUS_LABEL`/`STATUS_TAG` are gone.
- MSMED section 15 now reads "The law lets you charge interest on this." Show cause notices, DRC-06, outward supplies and Rule 59(6) no longer appear on the inbox.
- `styles.ts`: `FIGURE`/`SCORE` replaced by `LEAD`, `SECOND_FIGURE`, `QUIET_FIGURE`, `BODY`, `MARK` — four ranks of type instead of one shouted size.
