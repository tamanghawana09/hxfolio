import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function qs<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function qsa<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) return;
  const aura = qs<HTMLElement>('[data-cursor-aura]');
  const dot = qs<HTMLElement>('[data-cursor-dot]');
  if (!aura || !dot) return;

  const auraX = gsap.quickTo(aura, 'x', { duration: 0.38, ease: 'power3' });
  const auraY = gsap.quickTo(aura, 'y', { duration: 0.38, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.09, ease: 'power2' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.09, ease: 'power2' });

  window.addEventListener('pointermove', (event) => {
    document.body.classList.add('cursor-active');
    auraX(event.clientX);
    auraY(event.clientY);
    dotX(event.clientX);
    dotY(event.clientY);
  }, { passive: true });

  qsa<HTMLElement>('a, button, input, textarea, select, summary, [data-tilt-card]').forEach((element) => {
    element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
    element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
  });
}

function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) return;
  qsa<HTMLElement>('.magnetic:not(.button):not(.header-cta)').filter((element) => !element.closest('[data-tilt-card]')).forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      gsap.to(element, { x: x * 0.14, y: y * 0.14, duration: 0.35, ease: 'power3.out' });
    });
    element.addEventListener('pointerleave', () => {
      gsap.to(element, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

let tiltMedia: ReturnType<typeof gsap.matchMedia> | undefined;

function initTiltCards() {
  if (tiltMedia) return;
  tiltMedia = gsap.matchMedia();
  tiltMedia.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const listeners = new AbortController();
    const options = { signal: listeners.signal, passive: true };
    qsa<HTMLElement>('[data-tilt-card]').forEach((card) => {
      // Rotation stays independent of ScrollTrigger's reveal translation.
      const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.4, ease: 'power2.out' });
      const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.4, ease: 'power2.out' });
      gsap.set(card, { transformPerspective: 1100 });
      let bounds: DOMRect | undefined;
      const reset = () => { bounds = undefined; rotateX(0); rotateY(0); };
      card.addEventListener('pointerenter', () => { bounds = card.getBoundingClientRect(); }, options);
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        if ((event.target as Element).closest('a, button, input, select, textarea')) {
          reset();
          return;
        }
        bounds ??= card.getBoundingClientRect();
        const x = gsap.utils.clamp(-0.5, 0.5, (event.clientX - bounds.left) / bounds.width - 0.5);
        const y = gsap.utils.clamp(-0.5, 0.5, (event.clientY - bounds.top) / bounds.height - 0.5);
        rotateX(-y * 8);
        rotateY(x * 8);
      }, options);
      card.addEventListener('pointerleave', reset, options);
      card.addEventListener('pointercancel', reset, options);
      card.addEventListener('focusin', reset, options);
      window.addEventListener('scroll', reset, options);
      window.addEventListener('resize', reset, options);
    });
    return () => listeners.abort();
  });
}

function initHero() {
  if (reducedMotion) return;
  const hero = qs<HTMLElement>('[data-hero]');

  if (hero) {
    if (!reducedMotion) {
      // Float the wrapper so hover rotation on the terminal remains independent.
      gsap.to('.terminal-float', {
        y: -10,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.floating-chip', {
        y: (index) => index % 2 === 0 ? -13 : 13,
        rotate: (index) => index % 2 === 0 ? '+=3' : '-=3',
        duration: 2.8,
        stagger: 0.35,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to('.orbit-one', { rotate: '+=360', duration: 46, repeat: -1, ease: 'none' });
      gsap.to('.orbit-two', { rotate: '-=360', duration: 56, repeat: -1, ease: 'none' });
      gsap.to('.hero-aura-one', {
        yPercent: 24,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.1 },
      });
      gsap.to('.hero-stage', {
        yPercent: 12,
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.2 },
      });
    }
  }

}

function initScrollEffects() {
  qsa<HTMLElement>('[data-timeline]').forEach((timeline) => {
    const line = qs<HTMLElement>('[data-timeline-progress]', timeline);
    if (!line) return;
    gsap.to(line, {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: { trigger: timeline, start: 'top 72%', end: 'bottom 58%', scrub: 0.8 },
    });
  });

  const marquee = qs<HTMLElement>('[data-marquee]');
  if (marquee && !reducedMotion) {
    gsap.to(marquee, { xPercent: -50, duration: 48, repeat: -1, ease: 'none' });
  }

}

export async function initMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);
  // Yield between independent setup steps instead of one long startup task.
  for (const setup of [initHero, initScrollEffects, initCursor, initMagnetic, initTiltCards]) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    setup();
  }
  ScrollTrigger.refresh();
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) tiltMedia?.revert();
});
