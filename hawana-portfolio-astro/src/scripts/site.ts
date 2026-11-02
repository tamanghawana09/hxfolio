const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function qs<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

function qsa<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
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

function initRevealAnimations() {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const seen = new WeakSet<Element>();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      // Content already on screen stays visible; never hide it after first paint.
      const firstObservation = !seen.has(entry.target);
      seen.add(entry.target);
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (firstObservation || window.matchMedia('(prefers-reduced-motion: reduce)').matches) continue;
      entry.target.animate([
        { opacity: 0, translate: '0 24px' },
        { opacity: 1, translate: '0 0' },
      ], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }, { threshold: 0 });
  qsa<HTMLElement>('.reveal-up, .reveal-scale, [data-split], [data-project-card], [data-blog-card], [data-video-card]')
    .forEach((element) => observer.observe(element));
}

function initScrollProgress() {
  const progress = qs<HTMLElement>('[data-scroll-progress]');
  if (!progress) return;
  let pending = false;
  const update = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0})`;
    pending = false;
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('load', schedule, { once: true });
  update();
}

function scheduleMotion() {
  if (reducedMotion) return;
  const hasAmbientMotion = qs('[data-hero], [data-timeline], [data-marquee]');
  const hasPointerEffects = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!hasAmbientMotion && !hasPointerEffects) return;
  const load = () => {
    const start = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Visual enhancements must not block the essential page controls.
      void import('./motion').then(({ initMotion }) => initMotion()).catch((error) => {
        console.warn('Optional motion could not load.', error);
      });
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2000 });
    else setTimeout(start, 0);
  };
  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });
}

function init() {
  if (document.documentElement.dataset.interactionsReady === 'true') return;
  document.documentElement.dataset.interactionsReady = 'true';
  initHeader();
  initContactForm();
  initAccordion();
  initScrollTop();
  initScrollProgress();
  initRevealAnimations();
  scheduleMotion();
}

init();
