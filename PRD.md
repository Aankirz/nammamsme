# PRD — Namma MSME: document obligation engine

**Date:** 2026-07-26
**Context:** Sarvam Epoch Buildathon. Six-hour build, on-site, public URL required, three-minute live demo.
**Selected Sarvam parameter:** Document Intelligence.

---

## Problem Statement

A micro business owner in India receives roughly forty documents a year. Each one hides three things: a number, a date, and a consequence if ignored. He cannot read most of them — they arrive in legal English, and he runs a shop.

The sharpest case is a GST demand notice. The department serves a **DRC-01** by uploading it to the GST portal, frequently into a sub-tab labelled "Additional Notices." The owner never opens it. The clock then runs without him:

1. ~30 days to reply in **DRC-06** — missed
2. Ex-parte order under **§73** confirms tax, interest and penalty
3. 3 months to appeal, requiring a 10% pre-deposit — missed
4. Time-barred. Bank account attached.

He loses the business over a letter he never saw. This failure is systemic enough that Delhi, Madras and Gauhati High Courts have repeatedly quashed ex-parte GST orders in 2024–25, holding that portal-only service violates natural justice.

Meanwhile the same owner is owed money he hasn't chased, and holds licences he hasn't tracked. He is not short of money. He is short of visibility, and every gap has a deadline attached.

## Solution

One inbox that reads every document a business receives, extracts the obligation hidden in it, and — on the one document that is about to cost him his bank account — files the reply on his behalf, with evidence attached.

Three properties distinguish it from a document summariser:

1. **It verifies before it acts.** Two independent extractions must agree on every consequential number, and the arithmetic must tie out, before the file button enables.
2. **It refuses.** If the notice references an annexure that isn't present, or the two extractions disagree, it declines to file and says why. Refusal blocks a money action, not an explanation.
3. **The reply is assembled from documents already held.** The DRC-06 is not a form fill. It attaches the 14 purchase invoices backing the disputed ITC, sums them, and honestly identifies the unmatched portion.

## User Stories

### Seeing the paper

1. As a micro business owner, I want to open the app and immediately see every obligation I have, so that I don't have to remember them.
2. As a micro business owner, I want obligations sorted by deadline, so that the most urgent thing is at the top.
3. As a micro business owner, I want a single number showing my total exposure over the next 30 days, so that I understand the scale of what's coming.
4. As a micro business owner, I want deadlines within 7 days marked in red, so that urgency is visible without reading.
5. As a micro business owner, I want to see money owed to me alongside money I owe, so that I can see that a collection would cover a demand.
6. As a micro business owner, I want the app in Hindi, so that I can read it without help.
7. As a micro business owner, I want to hear the key facts read aloud, so that I can use the product even if reading is slow for me.
8. As a micro business owner, I want no login, so that I can use it immediately.

### Getting paper in

9. As a micro business owner, I want to photograph a document with my phone camera, so that I don't have to scan or type anything.
10. As a micro business owner, I want a crumpled, badly-lit photo to work, so that I don't have to prepare the document.
11. As a micro business owner, I want the system to work out what kind of document it is, so that I don't have to categorise it.
12. As a micro business owner, I want to see progress while it processes, so that I know it hasn't frozen.
13. As a judge evaluating the product, I want to see each processing step with a timestamp, so that latency claims are verifiable.

### Understanding a notice

14. As a micro business owner, I want to see how much, by when, and who from as three large facts, so that I can act without reading the notice.
15. As a micro business owner, I want an explanation in plain Hindi of what the notice alleges, so that I understand what I'm accused of.
16. As a micro business owner, I want to see what happens at each future date if I do nothing, so that the consequence is concrete rather than vague.
17. As a micro business owner, I want to tap any number and see exactly where on the scanned page it came from, so that I can verify the system rather than trust it.
18. As a micro business owner, I want the explanation to distinguish what the department directed from what it alleges I did, so that the summary isn't misleading.

### Verification and refusal

19. As a micro business owner, I want the system to check its own extraction twice before showing me a number, so that I'm not acting on a misread figure.
20. As a micro business owner, I want the system to verify that tax, interest and penalty add up to the stated total, so that arithmetic errors surface.
21. As a micro business owner, I want the system to refuse rather than guess when it cannot read a figure, so that I don't file something wrong.
22. As a micro business owner, I want to be told plainly when a referenced annexure is missing, so that I know the amount may be incomplete.
23. As a micro business owner, I want the file button disabled when the system is not confident, so that I cannot accidentally act on bad data.
24. As a micro business owner, I want to see the exact region of the page the system is unsure about, so that I can look at it myself.
25. As a micro business owner, I want to forward an uncertain document to my CA in one tap, so that a human can resolve it.

### Filing the reply

26. As a micro business owner, I want to confirm the extracted facts before anything is filed, so that I stay in control of my own money.
27. As a micro business owner, I want to correct a field the system got wrong, so that errors don't propagate.
28. As a micro business owner, I want my corrections remembered, so that I never enter the same thing twice.
29. As a micro business owner, I want the reply to include the purchase invoices backing my claim, so that my defence is evidenced rather than asserted.
30. As a micro business owner, I want the reply to state honestly which part of my claim is unmatched, so that I am not blindsided later.
31. As a micro business owner, I want a reference number after filing, so that I have proof it happened.
32. As a micro business owner, I want an email containing the reference number and the original notice, so that I can show it to my CA.
33. As a micro business owner, I want a clear error and a retry if filing fails, so that I know whether it went through.

### Other document types

34. As a micro business owner, I want a supplier invoice to produce a row with amount and payment due date, so that payables are tracked with everything else.
35. As a micro business owner, I want a licence certificate to produce a row with its expiry date, so that a lapse doesn't shut my shop.
36. As a micro business owner, I want overdue receivables past 45 days flagged, so that I know I have a statutory claim under MSMED §15.

### Demo and evaluation

37. As a demonstrator, I want to reset the app to seeded state, so that judges can run it more than once.
38. As a demonstrator, I want to add a new document type as a prompt example and see it work live, so that generality is proven rather than claimed.
39. As a demonstrator, I want a visible count of documents processed, filed, refused and wrong, so that accuracy is measured rather than asserted.
40. As a demonstrator, I want a recording of the full journey, so that a failed live run costs nothing.
41. As a judge, I want to hand the system a notice with a missing page and watch it decline, so that I can test the refusal claim rather than take it on faith.

## Implementation Decisions

### Domain lock

- Notice type is an **ITC mismatch under §73**. This is the only demand type where purchase invoices constitute the defence, and it is the most common notice in practice (auto-generated from GSTR-2B vs GSTR-3B comparison). §74 is rejected because alleging wilful suppression makes the protagonist unsympathetic.
- Language is **Hindi**, trader located in Ludhiana. Selection criterion is proofreadability by the team, not model coverage — a language nobody on the team can verify cannot be shipped.

### Locked figures

Every figure below is checked live during the demo, so they are engineered to reconcile exactly.

| Notice line | Amount |
|---|---|
| Unmatched ITC (tax demanded) | ₹4,00,000 |
| Interest @ 18% p.a., one year | ₹72,000 |
| Penalty @ 10% (§73) | ₹40,000 |
| **Total demand** | **₹5,12,000** |

| Trader records | Invoices | ITC |
|---|---|---|
| Total claimed | 14 | ₹18,00,000 |
| Matched in GSTR-2B | 11 | ₹14,00,000 |
| Unmatched | 3 | ₹4,00,000 |

The ₹4,00,000 gap is **derived** — claimed ITC minus the figure the notice states the department can see. Identifying *which three suppliers* requires seeded data and must be labelled as seeded when demonstrated.

### The obligation schema

A single table. Every document type — notice, invoice, licence — becomes one row with the same shape. Adding a document type is a prompt example, not a schema change.

```
id, doc_type, obligation, amount, doc_date, deadline, counterparty,
consequence, direction, status, blockers[], source_ref, file_url, created_at
```

`doc_date` is distinct from `deadline`. For an invoice, `deadline` is the payment due date and `doc_date` is the invoice date; evidence assembly filters on `doc_date`. Conflating them was a defect found during design review.

`direction` is `owing` or `owed`. `status` is one of `seeded`, `extracted`, `refused`, `filed`.

### Extraction and verification

Two independent Sarvam Vision calls on the same image:

- **Extract** — named fields returned directly
- **Digitise** — full page to structured text, retaining page and block provenance

The verification layer is a **pure function** taking both results and returning verified fields plus a list of blockers. It performs no I/O.

**Number comparison is normalised, not literal.** Both sides are reduced to integers by stripping non-digits before comparison. Literal string matching would fail on `₹5,12,000/-` versus `512000` and produce false refusals on valid documents.

**Blocking conditions** (any one disables filing):

1. Extract and Digitise disagree on a number after normalisation
2. The document references an annexure or schedule not present in the uploaded pages
3. A required field is absent

**Non-blocking flag:** arithmetic mismatch. Tax + interest + penalty is compared against the printed total with a ₹100 tolerance. Real notices legitimately fail exact equality — interest is computed to a stated date and penalty under §73 is "10% of tax or ₹10,000, whichever is higher," a conditional rather than a percentage.

**Confidence is derived from these binary checks, not from a model-reported score.** An uncalibrated float is not a sound gate on a filing decision, and Sarvam may not return per-field confidence at all.

### Language model boundary

The reasoning model receives the Digitise text as its only source and is permitted to produce only the plain-language explanation and the consequence ladder. It never touches `amount`, `deadline`, or `section` — those are locked by the verification layer before it runs. Language models explain well and count badly; the architecture reflects that.

### Evidence assembly

A pure function taking the notice row and the set of invoice rows. It filters invoices whose `doc_date` falls within the notice's stated period, sums the GST column, compares to the claimed ITC, and derives the unmatched gap.

Output is rendered as HTML. No PDF generation — it is where the time goes and nobody opens a PDF during a demo.

### Filing contract

```
POST /drc06  →  { arn, filed_at, status }
```

Backed by a Beeceptor mock. One failure response (500 with retry) is defined and recovery is surfaced on screen rather than logged.

The mock is stated aloud during the demo. Real filing requires a GSP licence, which cannot be obtained during a build window. Every step up to the destination is real.

### Surfaces

Two screens: inbox and detail. No settings, no profile, no onboarding, no charts.

The inbox headline is computed by two filters over the same table — obligations due within 30 days, and receivables overdue beyond 45 days. It is not a separate query or a stored aggregate.

Read-aloud is applied to the three summary cards only. Long TTS on stage is dead air.

### Storage

Supabase (Postgres), unless a team member has prior Convex experience, in which case Convex. Selection criterion is prior familiarity — learning a datastore during the build is the dominant risk, and reactivity is not worth it.

Seeded and live-extracted rows occupy the same table and are indistinguishable to the inbox. A `POST /reset` endpoint truncates and reseeds so judges can run the demo repeatedly.

### Build sequencing

The hardest dependency is proven first. Sarvam Vision is asynchronous — upload, job ID, poll, result — with a 10-page cap. Before any schema or UI exists, a single tiny image must complete that round trip and print to a terminal.

| Version | Ships | Acceptance | Cut to |
|---|---|---|---|
| V0 | Vision round trip in terminal | A real field prints from a real photo | Cannot be cut |
| V1 | Notice → Extract → hardcoded reply → mock → ARN | Reference number returns | — |
| V2 | Digitise, agreement gate, arithmetic check, refusal | Hero notice files; stripped notice refuses | Keep gate, drop arithmetic |
| V3 | Schema, classifier, invoice + licence | Three unlike docs, three correct rows | Drop licence |
| V4 | Evidence assembly | Invoice table renders, figures tie out | File plain reply |
| V5 | Inbox, seed, headline, cards, read-aloud, accuracy panel | Full journey on a phone from a public URL | Drop panel, then animation |
| V6 | Deploy, reset, recording, 3 runs, 2 rehearsals | Three clean consecutive runs | Cannot be cut |

**No new code after V4.** V5 assembles working parts; V6 is rehearsal. Four of the five available rubric level-jumps are bought with evidence and rehearsal rather than code.

## Testing Decisions

No prior art exists — the repository is empty. Conventions are established here.

**A good test here exercises external behaviour through the highest available seam and asserts on returned state, not on which functions were called.** No mocking frameworks, no fixtures, no per-function suites. The build window does not permit ceremony, and ceremony is not what catches the bugs that matter.

Three pure functions carry all the logic that can silently produce a wrong outcome, and they are the only units tested:

1. **`verifyExtraction(extractResult, digitiseResult)` → `{ fields, blockers[] }`**
   The highest and most valuable seam. It decides whether a filing is permitted. Takes two plain objects, returns a plain object, touches no network or database.

   Cases: normalised match across differing formats (`₹5,12,000/-` vs `512000`) passes; genuine numeric disagreement blocks; missing annexure reference blocks; absent required field blocks; arithmetic mismatch under ₹100 does not block; arithmetic mismatch over ₹100 flags but does not block.

   The false-refusal cases matter more than the true-refusal cases. A system that refuses valid documents fails on the run being scored.

2. **`assembleEvidence(notice, invoices)` → `{ rows, claimedTotal, matchedTotal, gap }`**
   Cases: only invoices within the notice period are included; `doc_date` is used rather than `deadline`; totals sum correctly; the derived gap equals claimed minus department-visible.

3. **`classifyDocType(text)` → `doc_type`**
   Cases: one representative sample per supported type resolves correctly.

**Not unit tested:** Vision API calls, database reads and writes, the mock filing POST, and all UI. These are I/O and are covered by the V6 acceptance runs — three consecutive end-to-end executions with no intervention, which is also the rubric's own threshold for job completion.

Tests are assertion-based and runnable with a single command. If a test needs a mock to exist, the seam is in the wrong place.

## Out of Scope

- Authentication, user accounts, profiles, onboarding, settings
- Charts, dashboards, analytics
- PDF generation
- WhatsApp or SMS ingestion
- Inbound email ingestion
- Real GST portal filing or GSP integration
- Notice prediction from purchase-bill rate errors
- The receivables collection action
- A fourth document type in the build — it is demonstrated live as a prompt example
- Transliteration or cross-entity name matching
- Multi-page documents beyond the Sarvam 10-page cap
- Any language other than Hindi

Each exclusion exists so that a mid-build "it would be quick to just add…" has a written answer and does not need to be argued under time pressure.

## Further Notes

**The largest risk is not technical.** Impact scoring rests on the system having been run against a real, redacted DRC-01 obtained from a practising CA. That is a phone call, not a build task, and it is the single highest-value action available before the build begins. Without it, the entire demonstration runs on documents the team authored, and a judge asking "has a real business seen this?" is unanswerable.

**Refusal must be rare and correct.** It is the differentiating behaviour, but a system that refuses frequently is simply a broken system with good manners. The normalisation rule and the arithmetic tolerance exist to keep the refusal rate near zero on valid inputs.

**Three earlier design decisions were reversed during senior review** and are recorded here so they are not reintroduced: literal string matching in the agreement gate (would cause false refusals), strict arithmetic equality (would fire on legitimate notices), and the absence of a `doc_date` column (would break evidence assembly at V4).

**Distribution wedge is the chartered accountant.** One CA serves 50–200 small businesses and already performs this work informally and unpaid. This affects the pitch only; it changes nothing about the build.
