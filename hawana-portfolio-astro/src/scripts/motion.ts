/** Native enhancements: no animation runtime or scroll-position measurements. */
export function initMotion() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle('ambient-visible', entry.isIntersecting);
    });
    document.querySelectorAll('[data-hero], .marquee-section').forEach((element) => observer.observe(element));
  }
  const visibility = () => document.documentElement.classList.toggle('motion-paused', document.hidden);
  document.addEventListener('visibilitychange', visibility);
  visibility();
  const aura = document.querySelector<HTMLElement>('[data-cursor-aura]');
  const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');
  let card: HTMLElement | null = null;
  let bounds: DOMRect | undefined;
  let frame = 0;
  let x = 0;
  let y = 0;
  const resetCard = () => {
    if (card) card.style.transform = '';
    card = null;
    bounds = undefined;
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    resetCard();
    document.body.classList.remove('cursor-active', 'cursor-hover');
  };
  const paint = () => {
    frame = 0;
    if (preference.matches || !pointer.matches) return;
    // Read geometry before writes; reuse until scroll, resize, or pointer leave.
    if (card && !bounds) bounds = card.getBoundingClientRect();
    if (aura) aura.style.translate = `${x}px ${y}px`;
    if (dot) dot.style.translate = `${x}px ${y}px`;
    document.body.classList.add('cursor-active');
    if (card && bounds && bounds.width && bounds.height) {
      const clamp = (value: number) => Math.max(-0.5, Math.min(0.5, value));
      const rx = -clamp((y - bounds.top) / bounds.height - 0.5) * 8;
      const ry = clamp((x - bounds.left) / bounds.width - 0.5) * 8;
      card.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  };
  window.addEventListener('pointermove', (event) => {
    if (preference.matches || !pointer.matches || event.pointerType === 'touch') return;
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener('pointerover', (event) => {
    if (preference.matches || !pointer.matches || !(event.target instanceof Element)) return;
    const interactive = event.target.closest('a, button, input, textarea, select, summary');
    const next = interactive ? null : event.target.closest<HTMLElement>('[data-tilt-card]');
    if (next !== card) { resetCard(); card = next; }
    document.body.classList.toggle('cursor-hover', Boolean(interactive || next));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', reset);
  document.addEventListener('focusin', resetCard);
  window.addEventListener('blur', reset);
  window.addEventListener('scroll', resetCard, { passive: true });
  window.addEventListener('resize', resetCard, { passive: true });
  preference.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
}
