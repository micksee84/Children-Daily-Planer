/**
 * Small screen-only motion for building a planner together: a squash-and-stretch when a
 * block lands on the page and a puff of dust when one is removed.
 *
 * Both act on the editor sheet only (#print-sheet), never on the print copy, and the
 * dust is drawn in its own layer on top of the page, so printing and PDF export always
 * see a still page. With "reduce motion" turned on, blocks fade in instead of bouncing
 * and removed blocks fade out without dust.
 */

const LAND_CLASS = 'sb-land';

const prefersReducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const editorBlock = (id: string): HTMLElement | null => {
  try {
    return document.querySelector<HTMLElement>(`#print-sheet [data-block-id="${CSS.escape(id)}"]`);
  } catch {
    return null;
  }
};

/** Where a block sits on screen right now, so it can puff away from that spot. */
export function blockRect(id: string): DOMRect | null {
  const el = editorBlock(id);
  return el ? el.getBoundingClientRect() : null;
}

/**
 * Plays the landing bounce on blocks once React has drawn them in their new place.
 * `stagger` spaces several blocks out (ms each), e.g. when a whole routine drops in.
 */
export function playLanding(ids: string[], stagger = 0): void {
  if (typeof window === 'undefined' || ids.length === 0) return;
  // Two frames: the first lets React commit the new layout, the second starts the animation.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      ids.forEach((id, i) => {
        const el = editorBlock(id);
        if (!el) return;
        el.classList.remove(LAND_CLASS);
        void el.offsetWidth; // restart the animation if it was already running
        el.style.animationDelay = stagger ? `${i * stagger}ms` : '';
        el.classList.add(LAND_CLASS);
        el.addEventListener(
          'animationend',
          () => {
            el.classList.remove(LAND_CLASS);
            el.style.animationDelay = '';
          },
          { once: true }
        );
      });
    })
  );
}

/** Removes any landing bounce still running, e.g. right before a PDF is captured. */
export function stopLanding(root: HTMLElement | null): void {
  root?.querySelectorAll(`.${LAND_CLASS}`).forEach((el) => {
    el.classList.remove(LAND_CLASS);
    (el as HTMLElement).style.animationDelay = '';
  });
}

/** A soft puff of dust where a block used to be. */
export function playDust(rect: DOMRect | null): void {
  if (typeof document === 'undefined' || !rect || rect.width === 0) return;
  const reduce = prefersReducedMotion();

  const layer = document.createElement('div');
  layer.className = 'sb-dust no-print';
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '60',
  });
  document.body.appendChild(layer);

  // The block's outline lingers and shrinks away.
  const ghost = document.createElement('div');
  Object.assign(ghost.style, {
    position: 'absolute',
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: '3px solid #2D2200',
    borderRadius: '12px',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  });
  layer.appendChild(ghost);
  const ghostAnim = ghost.animate(
    reduce
      ? [{ opacity: 0.8 }, { opacity: 0 }]
      : [
          { opacity: 0.9, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.82)' },
        ],
    { duration: reduce ? 180 : 260, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }
  );

  let longest: Animation = ghostAnim;
  if (!reduce) {
    // Puffs spread out from the edges and drift up as they fade, like chalk dust.
    const count = Math.max(8, Math.min(14, Math.round((rect.width + rect.height) / 28)));
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const scale = Math.max(0.9, Math.min(1.3, rect.height / 40));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const sx = cx + Math.cos(angle) * (rect.width / 2) * (0.7 + Math.random() * 0.3);
      const sy = cy + Math.sin(angle) * (rect.height / 2) * (0.7 + Math.random() * 0.3);
      const size = (6 + Math.random() * 9) * scale;
      const travel = (14 + Math.random() * 16) * scale;
      const puff = document.createElement('div');
      Object.assign(puff.style, {
        position: 'absolute',
        left: `${sx - size / 2}px`,
        top: `${sy - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: i % 3 === 0 ? 'rgba(45,34,0,0.28)' : 'rgba(182,178,166,0.75)',
      });
      layer.appendChild(puff);
      const dx = Math.cos(angle) * travel;
      const dy = Math.sin(angle) * travel - 8 * scale;
      const anim = puff.animate(
        [
          { opacity: 0, transform: 'translate(0,0) scale(0.6)' },
          { opacity: 1, transform: `translate(${dx * 0.35}px, ${dy * 0.35}px) scale(1)`, offset: 0.25 },
          { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.35)` },
        ],
        { duration: 380 + Math.random() * 140, delay: 40, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
      );
      longest = anim;
    }
  }

  const cleanup = () => layer.remove();
  longest.onfinish = cleanup;
  // Safety net in case an animation never finishes (e.g. the tab is hidden).
  window.setTimeout(cleanup, 1200);
}
