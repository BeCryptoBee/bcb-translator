import { buildProjection, locateInProjection, type Cover } from './projection';

const SEG_CLASS = 'bcb-src-seg';
const ACTIVE_CLASS = 'bcb-src-seg--active';

/**
 * Tweet text is normalized by the injector before being sent to the LLM:
 * single \n (not bordered by \n) -> space, runs of whitespace collapsed.
 * The whitespace-collapse step is NOT length-preserving and would violate
 * the projection contract, so we apply ONLY the length-preserving
 * \n -> space step here. In practice that's sufficient — X.com tweet
 * rendering rarely produces internal whitespace runs.
 */
function tweetProjectionNormalize(s: string): string {
  return s.replace(/(?<!\n)\n(?!\n)/g, ' ');
}

export function wrapTweetSegments(
  root: HTMLElement,
  segments: Array<{ src: string; tgt: string }>,
): void {
  let cursor = 0;
  let wrapped = 0;
  let skipped = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg) continue;
    const proj = buildProjection(root, tweetProjectionNormalize);
    const found = locateInProjection(proj, seg.src, cursor);
    if (!found) {
      const retry = locateInProjection(proj, seg.src, 0);
      if (!retry) {
        skipped += 1;
        continue;
      }
      cursor = retry.endProjected;
      for (const cover of retry.covers) wrapCover(cover, i);
      wrapped += 1;
      continue;
    }
    cursor = found.endProjected;
    for (const cover of found.covers) {
      wrapCover(cover, i);
    }
    wrapped += 1;
  }
  console.log('[BCB] wrapTweetSegments', {
    total: segments.length,
    wrapped,
    skipped,
    rootText: (root.innerText ?? '').slice(0, 80),
    firstSrc: segments[0]?.src.slice(0, 60),
  });
}

function wrapCover(cover: Cover, segmentIndex: number): void {
  const { textNode, startOffset, endOffset } = cover;
  if (endOffset <= startOffset) return;
  const ownerDoc = textNode.ownerDocument;
  if (!ownerDoc) return;

  // Three-way split: before | middle | after. `middle` becomes the wrapped span.
  let middle: Text = textNode;
  if (startOffset > 0) {
    middle = textNode.splitText(startOffset);
  }
  const middleLen = endOffset - startOffset;
  if (middle.nodeValue && middle.nodeValue.length > middleLen) {
    middle.splitText(middleLen);
  }
  const span = ownerDoc.createElement('span');
  span.className = SEG_CLASS;
  span.setAttribute('data-segment-index', String(segmentIndex));
  middle.parentNode?.insertBefore(span, middle);
  span.appendChild(middle);
}

export function unwrapSegmentSpans(root: HTMLElement): void {
  const spans = root.querySelectorAll<HTMLSpanElement>(`.${SEG_CLASS}`);
  spans.forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    if (parent instanceof Element) parent.normalize();
  });
}

export function setActiveSegment(
  root: HTMLElement,
  index: number,
  active: boolean,
): void {
  const spans = root.querySelectorAll<HTMLSpanElement>(
    `.${SEG_CLASS}[data-segment-index="${index}"]`,
  );
  spans.forEach((s) => s.classList.toggle(ACTIVE_CLASS, active));
  console.log('[BCB] setActiveSegment', {
    index,
    active,
    spanCount: spans.length,
  });
}

/**
 * Convenience: clear the active class from ALL wrapped segment spans inside
 * `root`. Used when the popup closes.
 */
export function clearAllActiveSegments(root: HTMLElement): void {
  root.querySelectorAll<HTMLSpanElement>(`.${ACTIVE_CLASS}`).forEach((el) => {
    el.classList.remove(ACTIVE_CLASS);
  });
}
