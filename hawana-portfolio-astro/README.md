# Hawana Tamang — Astro Portfolio Redesign

A complete light-mode portfolio redesign built with Astro and GSAP. The content from the existing portfolio has been reorganized into editable data and Markdown while the visual direction has been rebuilt around white space, yellow energy, soft color auras, glass surfaces, and deliberate motion.

## Included routes

- `/` — animated home page
- `/projects` — all documented project work
- `/blog` — article index
- `/blog/[id]` — Markdown-powered article pages
- `/videos` — YouTube video library
- `/about` — story, values, timeline, stack, and interests
- `/resume` — structured resume and extended project history
- `/contact` — contact form, direct details, social links, and FAQs
- Custom `404` page

## Stack

- Astro 7
- TypeScript
- GSAP + ScrollTrigger
- Astro Content Collections
- Static sitemap
- Plain semantic HTML and CSS
- Static output, suitable for Netlify, Vercel, Cloudflare Pages, GitHub Pages, or standard hosting

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Astro.

## Production build

```bash
npm run build
npm run preview
```

The static build is generated in `dist/`.

## Editing content

### Personal details, projects, skills, experience, videos, FAQs

Edit:

```text
src/data/site.ts
```

### Blog posts

Edit or add Markdown files inside:

```text
src/content/blog/
```

Each article uses frontmatter validated by `src/content.config.ts`.

### Theme

The full design system is in:

```text
src/styles/global.css
```

The main palette is defined at the top with CSS custom properties. The current identity uses:

- warm white background
- vivid yellow primary accent
- soft blue, coral, mint, and violet supporting accents
- dark navy text instead of heavy black

### Animation

All GSAP behavior is centralized in:

```text
src/scripts/site.ts
```

It includes:

- hero entrance sequence
- ScrollTrigger reveal animations
- animated timeline progress
- ambient parallax
- infinite skills marquee
- tilt interactions
- magnetic buttons
- pointer aura
- scroll progress indicator
- reduced-motion support

## Contact form behavior

The supplied project is fully static. The contact form validates the fields and opens the visitor's email application with the subject and message pre-filled.

For direct form delivery, replace the submit handler in `src/scripts/site.ts` with one of these options:

- Astro server API endpoint with a deployment adapter
- Netlify Forms
- Formspree
- Resend or another email API

Do not expose private API keys in browser-side JavaScript.

## Before deployment

1. Confirm all dates, employment details, phone numbers, and project descriptions.
2. Replace or retain the original resume URL in `src/data/site.ts`.
3. Test all external project links.
4. Connect a real form endpoint when direct form submission is required.
5. Run Lighthouse and compress any future local images before launch.

## Design rationale

The previous dark portfolio was visually competent but generic. This redesign creates more differentiation through a bright engineering-studio aesthetic: strong typography, yellow as an intentional signal rather than a background wash, supporting color auras, technical interface motifs, and motion that reinforces hierarchy instead of distracting from the work.
