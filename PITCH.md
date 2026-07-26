# Namma MSME — three minutes

Say the words. Do not read the slides. The demo is the argument.

---

## 0:00–0:30 · The cold open

> A textile trader in Ludhiana lost his bank account to a letter he never opened.
>
> The GST department served him a demand notice. Not by post. They uploaded it to the portal, into a sub-tab called "Additional Notices." He logs in once a month to file returns. He never opened that tab.
>
> Thirty days to reply. Missed. An order passed without hearing him. Three months to appeal, and only if he paid ten percent up front. Missed. Then recovery.
>
> He wasn't guilty. He didn't know.

Beat.

> This happens so often that the Delhi, Madras and Gauhati High Courts have all had to quash these orders in the last two years. The courts are cleaning it up one writ at a time. Which means the system only helps you after you have already hired a lawyer.

**Do not** say "AI", "pipeline", "Sarvam" or "stack" in these thirty seconds.

---

## 0:30–1:00 · What actually goes wrong

> Forty documents a year reach a business like his. A notice, a supplier bill, a licence renewal, a return that falls due whether or not paper arrives.
>
> Every one of them hides three things: a number, a date, and something bad that happens if you ignore it.
>
> He can't read them. Not because he's careless, because they're in legal English and he's running a shop. So the deadlines pass on their own.

Open the inbox.

> This is his desk. One thing to do today. Two lakh eighty-five hundred in late fees, growing fifty rupees a day. Everything else is quiet, because everything else can wait.

---

## 1:00–2:00 · The demo. This is the pitch.

**Upload the notice.** Let the hop log run.

> Every step is timestamped, so you can check the speed instead of believing me.

**The facts land.** Tap the amount.

> Five lakh twelve thousand. Tap it, and it shows you where on the page it read that. He never has to trust us.

**Open the reply.**

> And here is the part that matters. This reply is not a form we filled in. It is assembled from fourteen purchase bills already in his file.
>
> Eighteen lakh claimed. Fourteen lakh confirmed by the department. And four lakh unmatched, which we state openly, because his suppliers never filed. The tax was paid. A supplier's failure is not the buyer's liability, and that is the argument.

**Show the filled form.**

> There is no GST filing API. So we do not pretend to file. We write out every field of Form DRC-06, and he pastes it into the portal. Nine fields filled, one his choice, none guessed.

---

## 2:00–2:30 · The moment that wins the room

**Upload the second notice.** Wait. Let them read it.

> This one refers to Annexure-A. That page wasn't in what he uploaded.
>
> So it stops. **"This will not be filed."** The button is dead, and it tells him why.

Beat. Let it sit.

> Every other AI product you will see today answers every question you ask it. This one declines. And it declines in the one case where declining is correct, because a wrong reply filed is harder to undo than no reply at all.
>
> That is not a limitation we are apologising for. It is the product.

---

## 2:30–3:00 · The close

**Open the May 2025 return.**

> One last thing. This is a return he filed himself, eleven months before that notice arrived.
>
> He claimed eighteen lakh of credit. His suppliers reported fourteen. That four lakh gap sat there for eleven months and then became the notice you just watched us answer.
>
> A small business has no memory. The tax department has perfect memory. Every notice is the state remembering something the owner forgot.

Land it:

> **We are the memory that matches theirs. So when the notice comes, the answer is already assembled.**

Stop. Do not add a roadmap slide.

---

## If the live run stalls

Do not apologise twice. Say:

> "That call is running long, so let me show you the one that matters."

Go straight to the refusal. It is the stronger moment anyway.

---

## Answers to the four questions you will get

**"Can you actually file it?"**
> No, and we say so on screen. Real filing needs a GSP licence, which you don't get in a build window. But filing was never the hard part. Those thirty days were not lost to a form submission. They were lost to not knowing, and to having no defence ready. That is what this finishes.

**"Is this real data?"**
> The rate schedule is: one thousand and thirty-five HSN codes compiled from the CBIC's own tables, which is how we caught a supplier billing twelve percent on goods the schedule puts at five. The documents are ours. No real business has used this yet, and that is the first thing we would change.

**"How do you know the extraction is right?"**
> We don't trust it. The model reads the page, and every number it reports has to appear in the OCR text or it gets blocked. During testing the smaller model returned four lakh as the total when the total was five lakh twelve. The arithmetic check caught it before we did. That is a real failure, caught by a rule we wrote before we saw it.

**"How would a trader actually get documents in?"**
> Today, a camera, because every one of these businesses has a drawer of paper. The real channel is WhatsApp, since they already forward these to their nephew or their CA. And the version that matters polls the portal directly through a GSP, so the notice reaches him the day it is issued instead of the day the window shuts. That is the whole problem: nobody opens that tab.

---

## The five things not to do

1. Don't open with the stack.
2. Don't say "we use AI to". Say what it does for him.
3. Don't multiply anything by 7.3 crore MSMEs. Give the one-business number and stop.
4. Don't rush the refusal. It needs four seconds of silence.
5. Don't close on architecture. Close on the reconciliation.
