# Decision Log

Every decision, why it was made, and what it constrains. Append-only. Newest section at the bottom.

Format: **D-nn — Decision** / Why / Constrains / Status.

---

## 2026-07-26 — Pre-build decisions

### D-01 — Build for MSME document obligations, not an ERP
**Decision:** One engine, one inbox, many document types. No per-domain modules (no inventory screen, no staff screen).
**Why:** Every MSME problem has the same shape — paper arrives, it contains an obligation, the owner can't parse it, the obligation lapses, it costs money. Modules would demonstrate zero document intelligence, which is the scored Sarvam parameter.
**Constrains:** Navigation is two screens. Adding a document type is a prompt example, never a new surface.
**Status:** Locked.

### D-02 — Selected Sarvam parameter is Document Intelligence
**Decision:** Document Intelligence, weighted 2.5×. Voice used only as one-way TTS on three fields.
**Why:** A photographed notice is the hard input and sits at the centre of the job. Additional Sarvam capabilities score zero.
**Constrains:** No STT, no streaming, no telephony, no interruption handling.
**Status:** Locked.

### D-03 — The job is: notice → verified extraction → filed reply
**Decision:** The demo completes one job end to end, ending in a state change (filing) rather than a document.
**Why:** JTBD completion is weighted 2.5× and scores job completion, not comprehension. A summariser caps at L3.
**Constrains:** Exactly one document type gets an action path. All others stop at the inbox.
**Status:** Locked.

### D-04 — Notice type is ITC mismatch under §73
**Decision:** The hero notice alleges input tax credit claimed that suppliers did not report. Section 73, not 74.
**Why:** ITC mismatch is the only demand type where purchase invoices constitute the defence, which the evidence-assembly feature depends on. It is also the most common notice in practice (auto-generated from GSTR-2B vs GSTR-3B). §74 alleges wilful suppression and makes the protagonist look guilty.
**Constrains:** Seed invoices must reconcile exactly to the claimed ITC. Evidence assembly is only meaningful for this type.
**Status:** Locked.

### D-05 — Locked figures
**Decision:**
Notice: tax ₹4,00,000 + interest ₹72,000 + penalty ₹40,000 = **₹5,12,000**.
Records: 14 invoices, ₹18,00,000 ITC claimed; 11 matched (₹14,00,000); 3 unmatched (₹4,00,000).
**Why:** Every figure is verified live on stage, so they are engineered to reconcile exactly. Earlier figures (₹4,12,000 / ₹4,87,300) were internally inconsistent — the department demands only the unmatched portion, not the whole claim.
**Constrains:** Seed data cannot drift from these numbers. The ₹4,00,000 gap is derived (claimed minus department-visible), not seeded; naming *which* three suppliers is seeded and must be labelled as such.
**Status:** Locked. Supersedes earlier figures.

### D-06 — Language is Hindi; trader is in Ludhiana
**Decision:** Hindi throughout — UI, explanation, TTS. Trader relocated from Erode to Ludhiana.
**Why:** The binding criterion is proofreadability, not model coverage. A language nobody on the team can verify cannot be shipped — subtly wrong output is invisible to the team and obvious to a judge. Ludhiana is a genuine textile/hosiery MSME cluster, so the story survives the move.
**Override:** If a native Tamil reader on the team will personally proofread every string, Tamil is better for an Indic-focused audience.
**Constrains:** One language end to end. No mixed-language surfaces.
**Status:** Locked.

### D-07 — Storage is Supabase
**Decision:** Supabase (Postgres). Convex only if a team member has shipped it before.
**Why:** The dominant risk in a six-hour build is learning a tool under time pressure. Convex reactivity is nicer and does not matter enough. Local JSON and SQLite are rejected — they do not persist on serverless.
**Constrains:** Seeded and live rows share one table. A reset endpoint truncates and reseeds.
**Status:** Locked.

### D-08 — Single obligation schema, ten columns
**Decision:** `id, doc_type, obligation, amount, doc_date, deadline, counterparty, consequence, direction, status, blockers[], source_ref, file_url, created_at`.
**Why:** One schema across all document types is what makes cross-document reasoning possible and makes new types a prompt change rather than a build.
**Constrains:** Any field that triggers nothing gets cut. No analytics columns.
**Status:** Locked.

### D-09 — `doc_date` is distinct from `deadline` *(reversal)*
**Decision:** Add `doc_date` as a separate column.
**Why:** Evidence assembly filters invoices by invoice date. For an invoice, `deadline` is the payment due date, not the invoice date. Conflating them would pull the wrong invoices and the defect would surface at V4 with two hours left.
**Constrains:** Extraction must populate both for invoices.
**Status:** Locked. **Reverses an earlier nine-column schema.**

### D-10 — Verification by dual extraction, normalised comparison *(reversal)*
**Decision:** Run Vision Extract and Vision Digitise on the same image. Compare numbers after normalising both sides to integers (strip all non-digits). Do not compare literally.
**Why:** Literal matching fails on `₹5,12,000/-` versus `512000` and produces a false refusal on a valid notice. A false refusal on the happy path kills the run being scored — worse than having no check at all.
**Constrains:** All numeric comparison goes through one normaliser.
**Status:** Locked. **Reverses "character for character" matching.**

### D-11 — Arithmetic check is a flag, not a blocker *(reversal)*
**Decision:** Compare tax + interest + penalty against the printed total with a ₹100 tolerance. Mismatch flags; it does not disable filing.
**Why:** Real notices legitimately fail exact equality — interest is computed to a stated date, and penalty under §73 is "10% of tax or ₹10,000, whichever is higher," a conditional rather than a percentage.
**Constrains:** Only three conditions block filing (D-12).
**Status:** Locked. **Reverses strict equality.**

### D-12 — Refusal is gated on three binary conditions, not a model score
**Decision:** Filing is blocked when (1) the two extractions disagree on a number after normalisation, (2) the document references an annexure not present in the uploaded pages, or (3) a required field is absent. Confidence is derived from these, not read from the model.
**Why:** Sarvam may not return per-field confidence, and an uncalibrated float is not a sound gate on a money action. Binary signals we control are more robust and explainable in one sentence on stage.
**Constrains:** Refusal must be rare. A system that refuses often is a broken system with good manners.
**Status:** Locked.

### D-13 — The language model never touches consequential fields
**Decision:** The reasoning model receives Digitise text as its only source and produces only the plain-language explanation and consequence ladder. Amount, deadline and section are locked by the verification layer before it runs.
**Why:** Language models explain well and count badly. The architecture reflects that rather than hoping.
**Constrains:** No LLM call may write into the obligation row's numeric fields.
**Status:** Locked.

### D-14 — Evidence assembly is the headline feature; HTML only, no PDF
**Decision:** The DRC-06 reply attaches the 14 purchase invoices, sums their GST, and derives the unmatched gap. Rendered as HTML in-app and in the email.
**Why:** Turns the reply from a form fill into a defence assembled from documents already held — moves Memory & Context to L5 and retroactively justifies the whole inbox. PDF generation is where the time goes and nobody opens a PDF during a demo.
**Constrains:** Sits at V4 with an explicit cut line at 3:45 PM — drop the table, file the plain reply.
**Status:** Locked.

### D-15 — Three document types; the fourth is a live party trick
**Decision:** Build for GST notice, supplier invoice, licence certificate. Demonstrate a fourth live as a prompt example.
**Why:** The three are maximally unalike — dense legal prose, a number table, a single date on decorative paper. Three unlike documents prove generality; eight similar ones prove nothing.
**Constrains:** No fourth type in the build. Pre-test the live paste on the exact document.
**Status:** Locked.

### D-16 — The receivables collection action is cut
**Decision:** Not built. Explicit non-goal.
**Why:** It competes with evidence assembly for the same hour, and evidence assembly is strictly better — it deepens the path being rehearsed rather than adding one that needs separate rehearsal. Flagging it twice as "optional" is how features get half-built at 4:15 PM.
**Constrains:** Twenty-minute bonus only if V5 is complete and rehearsed.
**Status:** Locked (cut).

### D-17 — Filing goes to a Beeceptor mock, stated aloud
**Decision:** `POST /drc06 → { arn, filed_at, status }`. One failure response defined, recovery visible on screen.
**Why:** Real filing needs a GSP licence, unobtainable in a build window. The handbook explicitly blesses faithful mocks. Preempting the question costs eight seconds; being caught hiding it costs the round.
**Constrains:** Everything up to the destination must be genuinely real.
**Status:** Locked.

### D-18 — Accuracy scoreboard is included but honestly labelled
**Decision:** Show processed / filed / refused / wrong. Label the corpus "12 test documents, hand-labelled by us." Show the failure case aloud.
**Why:** Claiming a measured accuracy rate on self-authored documents is not measurement. Credibility comes from volunteering the failure, not from the percentage.
**Constrains:** No percentage may be presented as a benchmark.
**Status:** Locked.

### D-19 — Read-aloud on the three summary cards only
**Decision:** TTS applies to amount, deadline, counterparty. Not the explanation.
**Why:** Long TTS on stage is dead air, and dead air is the most expensive thing in a three-minute demo.
**Status:** Locked.

### D-20 — Prove the hardest dependency at minute one
**Decision:** Before schema, UI, or repo structure: one tiny image through Vision upload → job ID → poll → result printed to terminal.
**Why:** Sarvam Vision is asynchronous with a 10-page cap. A frozen upload screen during judging is a named, common failure. If it doesn't work, the whole plan changes and that must be known at 10:35 AM.
**Constrains:** V0 cannot be cut or deferred.
**Status:** Locked.

### D-21 — No new code after V4
**Decision:** V5 assembles working parts. V6 is deploy and rehearsal only.
**Why:** Four of the five available rubric level-jumps are bought with evidence and rehearsal rather than code. Building past hour four actively lowers the score.
**Constrains:** The non-goals list exists so mid-build additions have a written answer and need not be argued under time pressure.
**Status:** Locked.

### D-22 — Impact rests on obtaining one real redacted DRC-01
**Decision:** Treated as task zero, owned by a named person, before any code.
**Why:** Without it the entire demonstration runs on self-authored documents, and "has a real business seen this?" is unanswerable. Zero build hours; highest available return.
**Constrains:** Blocks Impact L3 → L4 and nothing else.
**Status:** Open — not yet obtained.

### D-23 — Distribution wedge is the chartered accountant
**Decision:** CA, not distributor or NBFC.
**Why:** One CA serves 50–200 small businesses and already does this work informally and unpaid. Can onboard a whole client book in a week.
**Constrains:** Pitch only. Changes nothing about the build.
**Status:** Locked.

### D-24 — Testing: three pure seams, no mocks
**Decision:** Unit test `verifyExtraction`, `assembleEvidence`, `classifyDocType` only. Vision calls, DB, mock POST and UI are covered by the V6 acceptance runs.
**Why:** If a test needs a mock, the seam is in the wrong place. The build window does not permit ceremony, and ceremony is not what catches the bugs that matter. False-refusal cases matter more than true-refusal cases.
**Constrains:** No mocking frameworks, no fixtures, no per-function suites.
**Status:** Locked.

---

## 2026-07-26 — V0 findings (build day, pre-code)

### D-25 — There is no Sarvam Extract API; the cross-check is redesigned *(reversal)*
**Decision:** Verification cross-checks a **language-model extraction against the Digitise OCR text**, not two Sarvam Vision calls.
**Why:** Introspecting the `sarvamai` SDK shows exactly one document surface — `documentIntelligence` (Digitise). `Extract` exists only as a Doc AI Studio UI page. The dual-Vision design in D-10 is not buildable.
**Replacement pipeline:** Digitise → OCR text with block provenance → language model extracts fields as JSON from that text → every number the model reports must be findable in the OCR text, else refuse.
**Why this is better than the original:** the two sources are now genuinely independent in *kind* — one is a model, one is deterministic text off the page. Two calls to the same vendor model would have had correlated errors. This directly enforces "the model may not invent a number that is not printed on the page."
**Constrains:** `verifyExtraction(extract, digitise)` signature is unchanged — `extract` now means the model's JSON, `digitise` the OCR result. No rework required downstream.
**Status:** Locked. **Reverses the dual-Vision half of D-10. The normalisation rule in D-10 stands.**

### D-26 — Digitise pipeline shape confirmed end to end
**Decision:** Five steps: `initialise({job_parameters})` → `getUploadLinks({job_id, files})` → `PUT` to the returned Azure blob URL → `start(jobId)` → poll `getStatus(jobId)` → `getDownloadLinks(jobId)` → download and unzip.
**Measured:** 7.4 s wall clock for a one-page PDF. Job reached `Completed` on the third 2 s poll.
**Gotchas found, all of which would have cost build time:**
- `output_format` accepts only `html` or `md`. The published docs list `json`; the API rejects it. Page-level JSON ships in the ZIP regardless.
- `initialise` and `getUploadLinks` take an object; `start`, `getStatus` and `getDownloadLinks` take the job id **positionally**. The SDK is inconsistent.
- Response shapes are `upload_urls[filename].file_url` and `download_urls["document.zip"].file_url`.
- Upload is a raw `PUT` to Azure with `x-ms-blob-type: BlockBlob`. Returns 201.
- Output is a **ZIP** that must be downloaded and unzipped — not a JSON response. Budget for this.
- Rate limit is 10 requests/minute across the account.
**Status:** Verified working against the real API.

### D-27 — OCR fidelity on a synthetic notice is exact
**Result:** Every figure read correctly — ₹18,00,000, ₹14,00,000, ₹4,00,000, tax ₹4,00,000, interest ₹72,000, penalty ₹40,000, total ₹5,12,000 — plus the `Annexure-A` reference the refusal case depends on.
**Caveat:** this was a clean machine-generated PDF. Fidelity on a crumpled phone photo of a real notice is **unproven** and remains the largest technical unknown. It is the reason D-22 (obtain a real notice) matters.
**Status:** Verified on synthetic input only.

### D-28 — Block confidence exists, is uncalibrated, and will not gate filing
**Finding:** Each block carries a `confidence` float. A block read **perfectly** scored 0.52; another scored 0.83. The values do not track correctness.
**Why it matters:** confirms D-12. Gating a filing decision on this number would refuse valid documents and accept invalid ones. Blocking stays on the three binary conditions.
**Secondary use:** confidence may still rank which region to crop first in the escalation UI, where being wrong is cheap.
**Status:** Locked.

### D-29 — Provenance is real; an adapter isolates the vendor shape
**Finding:** Page JSON gives `page_num`, `image_width`, `image_height`, and per block: `block_id`, `coordinates {x1,y1,x2,y2}`, `layout_tag`, `confidence`, `reading_order`, `text`. Coordinates are in image pixel space, so tap-to-source highlighting and crop-on-refusal are both buildable with real geometry rather than a stub.
**Decision:** `lib/types.ts` stays vendor-neutral. A `lib/sarvam.ts` adapter maps Sarvam's page JSON into our `DigitiseResult`.
**Why:** insulates every consumer from SDK churn and from the ZIP unpacking, and meant the in-flight verification work needed no change when D-25 landed.
**Status:** Locked.

### D-30 — Rows have a `role`: obligation vs evidence *(modelling fix)*
**Decision:** `ObligationRow.role` is `"obligation" | "evidence"`. The inbox shows obligations only; evidence rows surface when a reply is assembled.
**Why:** the 14 purchase invoices are not pending obligations — they were paid, and they exist to back the ITC claim. Modelling them as obligations made them render as year-overdue payables and pushed the hero notice to row 17 of a deadline-sorted list, because its 2026-08-14 deadline is the furthest-out date in the set.
**Found by:** the data agent, which flagged the sort symptom; the role confusion underneath it was the actual defect.
**Constrains:** inbox shows 3 rows (notice, receivable, licence), not 17. `assembleEvidence` considers only `role === "evidence"` candidates. `GET /api/documents` filters by role, with `?role=evidence|all` for the other views.
**Status:** Locked.

### D-31 — Extraction model is `sarvam-30b`; `sarvam-105b` is too slow for the demo
**Finding:** valid models are `sarvam-30b` and `sarvam-105b` only. `sarvam-105b` took **24.4 s** to extract eleven fields — on top of ~7.4 s of OCR, that is a ~32 s wait inside a 180 s demo.
**Decision:** default to `sarvam-30b`. Extraction quality was identical on the test notice — every field verbatim and correct.
**Constrains:** the hop log (D-26) must stay visible during the wait; a spinner would make this feel broken. If 30b proves materially worse on a real notice, the fallback is to pre-process the hero document and run only the refusal case live.
**Status:** Locked, pending a 30b latency measurement on the real notice.

### D-32 — Two distinct test documents are required
**Decision:** the hero notice must NOT reference an absent annexure. The refusal case is a **separate** document that does.
**Why:** the V0 test notice referenced `Annexure-A` without including it, which under D-12 correctly makes it refuse. Using it as the hero would mean the happy path never files. This was invisible until the refusal rule and the seed data were considered together.
**Constrains:** hero = annexure reference removed or the annexure page attached. Refusal case = annexure referenced, page withheld. Per D-25 the refusal document should be a real notice with a page removed, not a fabrication.
**Status:** Locked.

### D-33 — The model is prompt-constrained against arithmetic
**Decision:** the extraction system prompt forbids inferring, computing, estimating or converting, and requires verbatim copying or `null`.
**Why:** D-13 keeps the model away from consequential fields architecturally; this closes the same gap at the prompt layer. A model that computes a total instead of reading it would produce a figure that is arithmetically right but not printed on the page — and the grounding check would then correctly refuse a valid notice.
**Also:** unparseable JSON from the model returns an empty field set rather than throwing, so every required field reads as absent and filing is blocked. A model that cannot produce JSON has established nothing.
**Status:** Locked.

### D-31a — Extraction model is `sarvam-105b`, not `sarvam-30b` *(reverses D-31)*
**Measured on the hero notice, same prompt, `temperature: 0`, `max_tokens: 4096`:**

| Model | Latency | `amount` returned | Reasoning tokens |
|---|---|---|---|
| `sarvam-30b` | 23.1 s | ₹4,00,000 — **WRONG** (returned the tax, not the total) | 9,082 chars |
| `sarvam-105b` | 18.0 s | ₹5,12,000 — correct | 4,304 chars |

**Decision:** `sarvam-105b` is the default. It is both faster and more accurate here; 30b spends roughly twice the reasoning and arrives somewhere worse. The earlier D-31 timing (105b at 24.4 s) was measured without an explicit `max_tokens` and is superseded.
**Full pipeline budget:** ~5.5 s OCR + ~18 s extraction ≈ **23.5 s** per document. Acceptable only because the hop log makes the wait legible; a spinner here would read as broken.
**Status:** Locked. **Reverses D-31.**

### D-34 — Both Sarvam chat models are reasoning models with two silent failure modes
**Finding 1 — null content.** `message` carries `content`, `reasoning_content`, `refusal` and `tool_calls`. With no explicit `max_tokens`, the reasoning trace can consume the entire allowance and `content` returns **null with `finish_reason: "stop"` and no error**. The first full-pipeline run failed exactly this way after 15.8 s.
**Finding 2 — tier ceiling.** `max_tokens` above **4096** is a 400 on the starter tier. The cap must be set, and set at 4096.
**Decision:** always send `max_tokens: 4096`. Treat null content as "nothing established" — return an empty field set so every required field reads absent and filing is blocked. Never treat it as a successful empty extraction.
**Why it matters:** a naive `message.content.trim()` throws, and a naive null-coalesce silently files a reply with no verified fields. Both are worse than refusing.
**Status:** Locked.

### D-35 — The 30b failure is evidence the verification design works
**Observation:** 30b's wrong `amount` (₹4,00,000 against a stated total of ₹5,12,000) would have been caught by the arithmetic check — 4,00,000 + 72,000 + 40,000 ≠ 4,00,000, a ₹1,12,000 discrepancy far outside the ₹100 tolerance — and surfaced as a flag.
**Why recorded:** this is a real, unstaged instance of a language model misreading a consequential field on a document we control, caught by a check built before the failure was observed. It is the most credible thing we can say about the refusal design, and it should be said on stage.
**Status:** Recorded as demo evidence.
