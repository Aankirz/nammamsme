# Demo inputs

Four documents in `demo/inputs/`. Every one has been run through the live pipeline and the behaviour below is measured, not expected.

| # | File | Upload it to show | Result | Time |
|---|---|---|---|---|
| 1 | `1-notice-files-cleanly.pdf` | The whole job, end to end | `gst_notice`, ₹5,12,000, due 2026-08-14, **files, returns an ARN** | ~13s |
| 2 | `2-notice-gets-refused.pdf` | **The refusal.** Annexure-A referenced, page withheld | `refused`, file button dead, reason stated | ~33s |
| 3 | `3-invoice-wrong-rate.pdf` | Generality, and the rate check | `supplier_invoice`, Dhawan Textile Agency, ₹12,04,000, HSN 5208 at 12% vs schedule 5% | ~25s |
| 4 | `4-licence-expiring.pdf` | A third unlike document | `licence`, FSSAI, expires 2026-07-31 | ~16s |

They are deliberately unalike: dense legal prose, a number table, a single date on a certificate. Three unlike documents through one engine proves generality. Eight similar ones prove nothing.

## Order to run them

**1 first.** It is the shortest and it completes the job. Get the ARN on screen before anything can go wrong.

**2 second.** This is the moment. Let the refusal sit for a beat before narrating. Say the button is disabled, then say why.

**3 as the party trick**, if there is time. It is a document type you did not upload during setup, and it lands correctly.

**4 only if asked** whether it handles anything besides tax.

## Latency is the live risk

Measured across runs on the same one-page PDF: **13s to 73s**, almost entirely the extraction call, not the OCR. The hop log makes the wait legible, and the copy says fifteen to seventy seconds so it is never a surprise. If a run stalls past a minute, stop narrating the wait and move to the seeded notice already in the file. Do not apologise for it twice.

## What to say at the ARN

> "That posts to a mock. Real filing needs a GSP licence, which you do not get in a build window. Everything up to the destination is real, and filing was never the hard part. Thirty days are not lost to a form submission, they are lost to not knowing and not having a defence. That is what this finishes."

Eight seconds, said before anyone asks.

## Questions to ask the chatbot

Each one is answered from tools, and each returns a trace showing which:

- "What is my most urgent obligation?" → `list_obligations`
- "Why is that one late?" → resolves *that one* from the previous turn
- "My CA is Rakesh Verma and he only works Tuesdays." → stored, and recalled in later conversations
- "My supplier billed HSN 0402 at 5 percent. Is that wrong?" → **refuses to say**, because that code carries two lawful rates

The last one is the one to ask in front of judges. An agent declining to accuse a supplier is more interesting than an agent answering.

## Do not

- Do not upload a document a judge hands you. The three repeated runs the rubric asks for are your documents, not theirs.
- Do not claim any figure is from a real business. Only the CBIC rate schedule is real government data.
- Do not open with the tech stack.
