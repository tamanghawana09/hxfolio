import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function qs<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function qsa<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function splitWords(element: HTMLElement) {
  if (element.dataset.splitReady === 'true') return;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (node.textContent?.trim()) nodes.push(node);
  }

  nodes.forEach((node) => {
    const fragment = document.createDocumentFragment();
    const parts = node.textContent?.split(/(\s+)/) ?? [];
    parts.forEach((part) => {
      if (!part.trim()) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = 'word';
      inner.className = 'word-inner';
      inner.textContent = part;
      outer.appendChild(inner);
      fragment.appendChild(outer);
    });
    node.replaceWith(fragment);
  });
  element.dataset.splitReady = 'true';
}

function initHeader() {
  const header = qs<HTMLElement>('[data-header]');
  const toggle = qs<HTMLButtonElement>('[data-menu-toggle]');
  const panel = qs<HTMLElement>('[data-mobile-panel]');
  if (!header) return;

  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 22);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeMenu = () => {
    header.classList.remove('menu-active');
    document.body.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
  };

  toggle?.addEventListener('click', () => {
    const active = !header.classList.contains('menu-active');
    header.classList.toggle('menu-active', active);
    document.body.classList.toggle('menu-open', active);
    toggle.setAttribute('aria-expanded', String(active));
  });

  panel?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
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
  qsa<HTMLElement>('.magnetic').forEach((element) => {
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

function initTiltCards() {
  if (window.matchMedia('(pointer: coarse)').matches || reducedMotion) return;
  qsa<HTMLElement>('[data-tilt-card]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateY: x * 10,
        rotateX: y * -8,
        transformPerspective: 1100,
        duration: 0.45,
        ease: 'power2.out',
      });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

function initHero() {
  const hero = qs<HTMLElement>('[data-hero]');
  const pageHero = qs<HTMLElement>('[data-page-hero]');

  if (hero) {
    const timeline = gsap.timeline({ defaults: { ease: 'power4.out' } });
    timeline
      .from('.hero-line > span', { yPercent: 115, rotate: 3, duration: 1.05, stagger: 0.11 })
      .from('.hero-reveal', { y: 28, autoAlpha: 0, duration: 0.72, stagger: 0.08 }, '-=0.65')
      .from('.floating-chip', { scale: 0.5, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.8)' }, '-=0.5');

    if (!reducedMotion) {
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

  if (pageHero) {
    gsap.from(qsa<HTMLElement>('.hero-reveal', pageHero), {
      y: 45,
      autoAlpha: 0,
      duration: 0.95,
      stagger: 0.1,
      ease: 'power4.out',
    });
    if (!reducedMotion) {
      gsap.to('.page-hero .orb-one', {
        yPercent: 22,
        xPercent: -8,
        scrollTrigger: { trigger: pageHero, start: 'top top', end: 'bottom top', scrub: 1.2 },
      });
    }
  }

  const articleHero = qs<HTMLElement>('.article-hero');
  if (articleHero) {
    gsap.from(qsa<HTMLElement>('.hero-reveal', articleHero), {
      y: 42,
      autoAlpha: 0,
      duration: 0.85,
      stagger: 0.09,
      ease: 'power4.out',
    });
  }
}

function initRevealAnimations() {
  if (reducedMotion) {
    gsap.set('.reveal-up, .reveal-scale, [data-project-card], [data-blog-card], [data-video-card]', { autoAlpha: 1 });
    return;
  }

  gsap.set('.reveal-up', { y: 34, autoAlpha: 0 });
  gsap.set('.reveal-scale', { y: 28, scale: 0.965, autoAlpha: 0 });
  gsap.set('[data-project-card]', { y: 52, clipPath: 'inset(10% 0 0 0 round 38px)', autoAlpha: 0 });
  gsap.set('[data-blog-card], [data-video-card]', { y: 40, scale: 0.98, autoAlpha: 0 });

  qsa<HTMLElement>('[data-split]').forEach(splitWords);
  qsa<HTMLElement>('[data-split]').forEach((heading) => {
    const words = qsa<HTMLElement>('.word-inner', heading);
    gsap.from(words, {
      yPercent: 115,
      duration: 0.8,
      stagger: 0.022,
      ease: 'power4.out',
      scrollTrigger: { trigger: heading, start: 'top 84%', once: true },
    });
  });

  ScrollTrigger.batch('.reveal-up', {
    start: 'top 88%',
    once: true,
    onEnter: (elements) => gsap.fromTo(elements,
      { y: 34, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.72, stagger: 0.08, ease: 'power3.out', overwrite: true }
    ),
  });

  ScrollTrigger.batch('.reveal-scale', {
    start: 'top 88%',
    once: true,
    onEnter: (elements) => gsap.fromTo(elements,
      { y: 28, scale: 0.965, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.9, stagger: 0.09, ease: 'power3.out', overwrite: true }
    ),
  });

  ScrollTrigger.batch('[data-project-card]', {
    start: 'top 89%',
    once: true,
    onEnter: (elements) => gsap.fromTo(elements,
      { y: 52, clipPath: 'inset(10% 0 0 0 round 38px)', autoAlpha: 0 },
      { y: 0, clipPath: 'inset(0% 0 0 0 round 38px)', autoAlpha: 1, duration: 0.9, stagger: 0.12, ease: 'power3.out' }
    ),
  });

  ScrollTrigger.batch('[data-blog-card], [data-video-card]', {
    start: 'top 90%',
    once: true,
    onEnter: (elements) => gsap.fromTo(elements,
      { y: 40, scale: 0.98, autoAlpha: 0 },
      { y: 0, scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    ),
  });

  const proseChildren = qsa<HTMLElement>('[data-article-content] > *');
  if (proseChildren.length) {
    ScrollTrigger.batch(proseChildren, {
      start: 'top 91%',
      once: true,
      onEnter: (elements) => gsap.from(elements, { y: 22, autoAlpha: 0, duration: 0.58, stagger: 0.04, ease: 'power2.out' }),
    });
  }
}

function initScrollEffects() {
  const progress = qs<HTMLElement>('[data-scroll-progress]');
  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.15 },
    });
  }

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

  if (!reducedMotion) {
    qsa<HTMLElement>('.project-visual, .blog-art').forEach((visual) => {
      gsap.to(visual, {
        backgroundPosition: '50% 90%',
        ease: 'none',
        scrollTrigger: { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: 1.4 },
      });
    });
  }
}

function initContactForm() {
  const form = qs<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const textarea = qs<HTMLTextAreaElement>('textarea[name="message"]', form);
  const count = qs<HTMLElement>('[data-char-count]', form);
  const note = qs<HTMLElement>('[data-form-note]', form);

  textarea?.addEventListener('input', () => {
    if (count) count.textContent = String(textarea.value.length);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const firstName = String(data.get('firstName') ?? '');
    const lastName = String(data.get('lastName') ?? '');
    const email = String(data.get('email') ?? '');
    const topic = String(data.get('topic') ?? 'Portfolio enquiry');
    const message = String(data.get('message') ?? '');
    const subject = `${topic} enquiry from ${firstName} ${lastName}`.trim();
    const body = `Hi Hawana,\n\n${message}\n\nFrom: ${firstName} ${lastName}\nEmail: ${email}`;
    window.location.href = `mailto:hawanatamang@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if (note) note.textContent = 'Your email app should open with the message prepared. You can review it before sending.';
  });
}

function initAccordion() {
  const accordion = qs<HTMLElement>('[data-accordion]');
  if (!accordion) return;
  const items = qsa<HTMLDetailsElement>('details', accordion);
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

function initScrollTop() {
  qs<HTMLElement>('[data-scroll-top]')?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
}

function init() {
  initHeader();
  initCursor();
  initMagnetic();
  initTiltCards();
  initHero();
  initRevealAnimations();
  initScrollEffects();
  initContactForm();
  initAccordion();
  initScrollTop();
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

init();
