"use client";

import { useEffect, useRef } from "react";
import {
  blockKey,
  pagesIn,
  rectFor,
  type BlockKey,
  type DocumentSource,
} from "@/components/lib/source";
import { Blueprint } from "@/components/inbox/Blueprint";
import { Kicker } from "@/components/ui/Kicker";

interface SourcePaneProps {
  source: DocumentSource | null;
  pageLabel: string;
  active: BlockKey | null;
  onSelect: (key: BlockKey) => void;
}

const SHEET = { backgroundColor: "var(--color-surface)" };

const HIGHLIGHT = {
  color: "var(--color-text)",
  backgroundColor: "color-mix(in srgb, var(--color-accent) 18%, transparent)",
  boxShadow: "0 0 0 2px var(--color-accent)",
};

function centreOffset(scroller: HTMLElement, element: HTMLElement): number {
  const scrollerBox = scroller.getBoundingClientRect();
  const elementBox = element.getBoundingClientRect();

  return (
    elementBox.top - scrollerBox.top - (scroller.clientHeight - elementBox.height) / 2
  );
}

export function SourcePane({ source, pageLabel, active, onSelect }: SourcePaneProps) {
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

  if (source === null) {
    return (
      <Blueprint className="border-dashed p-[var(--space-6)]">
        <Kicker as="h2">No page was captured</Kicker>
        <p className="mt-2 max-w-[46ch] text-[13px] opacity-70 [text-wrap:pretty]">
          The figures came in with the row rather than off a page, so there is nothing
          to trace them to. Photograph the document to make them checkable.
        </p>
      </Blueprint>
    );
  }

  const activeBlock = active
    ? (source.blocks.find((block) => blockKey(block.page, block.block) === active) ??
      null)
    : null;

  return (
    <section aria-labelledby="source-heading">
      <h2 id="source-heading" className="sr-only">
        Where this came from
      </h2>

      <Blueprint className="p-[var(--space-2)]">
        <div
          ref={scrollerRef}
          className="max-h-[392px] overflow-y-auto overscroll-contain"
          style={SHEET}
        >
          {pagesIn(source).map((page) => (
            <div
              key={page}
              className="facsimile relative w-full border-b border-rule last:border-b-0"
              style={{
                ...SHEET,
                aspectRatio: `${source.pageWidth} / ${source.pageHeight}`,
              }}
            >
              {source.blocks
                .filter((block) => block.page === page)
                .map((block) => {
                  const key = blockKey(block.page, block.block);
                  const rect = rectFor(block, source);
                  const isActive = key === active;

                  return (
                    <button
                      key={key}
                      type="button"
                      data-active={isActive}
                      aria-pressed={isActive}
                      onClick={() => onSelect(key)}
                      className="facsimile-block cursor-pointer text-left"
                      style={{
                        left: `${rect.left}%`,
                        top: `${rect.top}%`,
                        width: `${rect.width}%`,
                        fontSize: `${rect.fontSize}cqw`,
                        ...(isActive ? HIGHLIGHT : null),
                      }}
                    >
                      {block.text}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        <div className="mt-[7px] flex items-baseline justify-between gap-3">
          <Kicker style={{ letterSpacing: "0.12em", opacity: 0.45 }}>{pageLabel}</Kicker>
          <span aria-live="polite" className="text-right text-[11px] opacity-60">
            {activeBlock
              ? `Page ${activeBlock.page}, block ${activeBlock.block}`
              : "Select any figure to see where it came from"}
          </span>
        </div>
      </Blueprint>
    </section>
  );
}
