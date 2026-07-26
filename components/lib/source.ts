/**
 * The source document, as carried on a row alongside the extracted facts.
 *
 * There is no scan image. The text-on-paper reproduction built from these
 * blocks IS the document view, which is what makes "every figure is traceable"
 * something the owner can check rather than something we assert.
 *
 * The shape is owned by the seed. Everything here is defensive: a row without
 * a `source`, or with a malformed one, must degrade to "no facsimile" and
 * never throw.
 */

/** `[x1, y1, x2, y2]` in the page's own coordinate space. */
export type Bbox = [number, number, number, number];

export interface SourceBlock {
  page: number;
  block: number;
  text: string;
  bbox: Bbox;
}

export interface DocumentSource {
  pageWidth: number;
  pageHeight: number;
  blocks: SourceBlock[];
}

/** Identifies one block across pages. Used as the highlight key. */
export type BlockKey = string;

export function blockKey(page: number, block: number): BlockKey {
  return `${page}:${block}`;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toBbox(value: unknown): Bbox | null {
  if (!Array.isArray(value) || value.length < 4) return null;

  const numbers = value
    .slice(0, 4)
    .map((entry) => (typeof entry === "number" && Number.isFinite(entry) ? entry : null));

  if (numbers.some((entry) => entry === null)) return null;

  return numbers as Bbox;
}

function toBlock(value: unknown): SourceBlock | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Record<string, unknown>;
  const bbox = toBbox(candidate.bbox);

  if (bbox === null || typeof candidate.text !== "string") return null;

  return {
    page: typeof candidate.page === "number" ? candidate.page : 1,
    block: typeof candidate.block === "number" ? candidate.block : 0,
    text: candidate.text,
    bbox,
  };
}

/** Narrows whatever the API returned into a source we can draw, or null. */
export function toDocumentSource(value: unknown): DocumentSource | null {
  if (typeof value !== "object" || value === null) return null;

  const candidate = value as Record<string, unknown>;

  if (!isFinitePositive(candidate.pageWidth)) return null;
  if (!isFinitePositive(candidate.pageHeight)) return null;
  if (!Array.isArray(candidate.blocks)) return null;

  const blocks = candidate.blocks
    .map(toBlock)
    .filter((block): block is SourceBlock => block !== null);

  if (blocks.length === 0) return null;

  return {
    pageWidth: candidate.pageWidth,
    pageHeight: candidate.pageHeight,
    blocks,
  };
}

/** The distinct page numbers present, in order. */
export function pagesIn(source: DocumentSource): number[] {
  return [...new Set(source.blocks.map((block) => block.page))].sort((a, b) => a - b);
}

export interface BlockRect {
  /** All four as percentages of the page box, ready for absolute positioning. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Type size in `cqw`, derived from the box and the line count. */
  fontSize: number;
}

/**
 * A floor only for degenerate boxes with no measurable height. It is kept far
 * below anything real: forcing type up to a comfortable size would push a
 * block past the box it was measured in and over its neighbour, and a
 * reproduction whose lines collide is worse than a small one. The block text
 * is echoed at reading size beneath the page for anyone who needs it.
 */
const MIN_FONT_CQW = 0.4;
/** Cap height as a fraction of the line box. Matches how OCR boxes are drawn. */
const CAP_RATIO = 0.68;

/**
 * Places one block on the page as percentages, and works out the type size that
 * makes its text fill the box it was measured in.
 */
export function rectFor(block: SourceBlock, source: DocumentSource): BlockRect {
  const [x1, y1, x2, y2] = block.bbox;

  const left = (Math.min(x1, x2) / source.pageWidth) * 100;
  const top = (Math.min(y1, y2) / source.pageHeight) * 100;
  const width = (Math.abs(x2 - x1) / source.pageWidth) * 100;
  const height = (Math.abs(y2 - y1) / source.pageHeight) * 100;

  const lines = Math.max(block.text.split("\n").length, 1);
  const lineHeightPx = Math.abs(y2 - y1) / lines;
  /* Container width maps to pageWidth, so page pixels convert to cqw directly. */
  const fontSize = ((lineHeightPx * CAP_RATIO) / source.pageWidth) * 100;

  return {
    left,
    top,
    width,
    height,
    fontSize: Math.max(fontSize, MIN_FONT_CQW),
  };
}
