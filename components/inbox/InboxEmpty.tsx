/** No rows yet — either a fresh reset or the API is not up. Never a crash. */
export function InboxEmpty() {
  return (
    <section className="px-5 pt-10">
      <div className="rounded-panel border-2 border-dashed border-rule-strong bg-paper-raised px-6 py-10 text-center">
        <p className="text-title font-bold text-ink">अभी कोई दस्तावेज़ नहीं</p>
        <p className="mx-auto mt-3 max-w-[28ch] text-body text-ink-soft">
          नीचे वाले बटन से अपने नोटिस, बिल या लाइसेंस की फ़ोटो खींचिए। बाकी काम
          हम कर लेंगे।
        </p>
      </div>
    </section>
  );
}
