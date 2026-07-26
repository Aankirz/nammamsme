"use client";

import { useEffect, useRef } from "react";
import {
  blockKey,
  pagesIn,
  rectFor,
  type BlockKey,
  type DocumentSource,
} from "@/components/lib/source";

interface SourcePaneProps {
  source: DocumentSource | null;
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
}

/** Roughly a third of the pane. Keeps the highlight off the very edge. */
function centreOffset(scroller: HTMLElement, element: HTMLElement): number {
  const scrollerBox = scroller.getBoundingClientRect();
  const elementBox = element.getBoundingClientRect();

  return (
    elementBox.top - scrollerBox.top - (scroller.clientHeight - elementBox.height) / 2
  );
}

function NoSource() {
  return (
    <div className="rounded-md border border-dashed border-rule-strong bg-paper-raised px-5 py-6">
      <p className="text-base text-ink">No page was captured for this document.</p>
      <p className="mt-2 max-w-[46ch] text-sm text-ink-muted">
        The figures on the left came in with the row rather than off a page, so there
        is nothing to trace them to. Photograph the document to make them checkable.
      </p>
    </div>
  );
}

/**
 * The document itself, reproduced from its text blocks.
 *
 * There is no scan image: each block is drawn at the position it was found on
 * the page, at the size the box it occupied implies. Clicking a figure on the
 * left highlights the block it was read from, and clicking a block does the
 * same in reverse. This is the whole trust claim, so it is exact rather than
 * decorative.
 */
export function SourcePane({ source, active, onSelect }: SourcePaneProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || active === null) return;

    const target = scroller.querySelector<HTMLElement>('[data-active="true"]');
    if (!target) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollBy({
      top: centreOffset(scroller, target),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [active]);

  const activeBlock =
    source && active
      ? (source.blocks.find((block) => blockKey(block.page, block.block) === active) ??
        null)
      : null;

  return (
    <section aria-labelledby="source-heading">
      <h2 id="source-heading" className="eyebrow border-b border-rule pb-2">
        Where this came from
      </h2>

      {source === null ? (
        <div className="mt-4">
          <NoSource />
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="mt-4 max-h-[calc(100dvh-18rem)] overflow-y-auto overscroll-contain rounded-md border border-rule bg-paper p-3"
          >
            <div className="flex flex-col gap-3">
              {pagesIn(source).map((page) => (
                <div
                  key={page}
                  className="facsimile relative w-full rounded-sm border border-rule shadow-[var(--shadow-sheet)]"
                  style={{ aspectRatio: `${source.pageWidth} / ${source.pageHeight}` }}
                >
                  {source.blocks
                    .filter((block) => block.page === page)
                    .map((block) => {
                      const key = blockKey(block.page, block.block);
                      const rect = rectFor(block, source);

                      return (
                        <button
                          key={key}
                          type="button"
                          data-active={key === active}
                          aria-pressed={key === active}
                          onClick={() => onSelect(key)}
                          className="facsimile-block cursor-pointer text-left hover:bg-paper-sunk"
                          style={{
                            left: `${rect.left}%`,
                            top: `${rect.top}%`,
                            width: `${rect.width}%`,
                            fontSize: `${rect.fontSize}cqw`,
                          }}
                        >
                          {block.text}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          <p aria-live="polite" className="mt-3 min-h-[3.5rem] text-sm">
            {activeBlock ? (
              <span className="block rounded-sm border border-rule bg-paper-raised px-3 py-2">
                <span className="numerals block font-mono text-xs text-ink-faint">
                  Page {activeBlock.page}, block {activeBlock.block}
                </span>
                <span className="mt-1 block whitespace-pre-wrap font-mono text-xs text-ink">
                  {activeBlock.text}
                </span>
              </span>
            ) : (
              <span className="block text-sm text-ink-faint">
                Select any figure on the left to see where on the page it was read from.
              </span>
            )}
          </p>
        </>
      )}
    </section>
  );
}
