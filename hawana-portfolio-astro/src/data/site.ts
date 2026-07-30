export const site = {
  name: 'Hawana Tamang',
  shortName: 'HT',
  role: 'Backend Developer & WordPress Engineer',
  description:
    'Building scalable REST APIs, custom WordPress solutions, and thoughtful web experiences from Bhaktapur, Nepal.',
  email: 'hawanatamang@gmail.com',
  phone: '+977 9808691807',
  secondPhone: '+977 9762108621',
  location: 'Bhaktapur, Bagmati Province, Nepal',
  timezone: 'NPT, UTC+5:45',
  availability: 'Open to backend roles, WordPress projects, and freelance work.',
  responseTime: 'Usually within 24 hours on weekdays.',
  resumeUrl: 'https://hawanatamang.com.np/HawanaTamang_CV.pdf',
};

export const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Blog', href: '/blog' },
  { label: 'Videos', href: '/videos' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const socials = [
  { label: 'GitHub', href: 'https://github.com/tamanghawana09' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hawana0911/' },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCvUR3omHzCkwIUiF7-LgPYw' },
  { label: 'X / Twitter', href: 'https://twitter.com/HawanaTamang' },
];

export type Accent = 'yellow' | 'blue' | 'coral' | 'mint' | 'violet';

export type Project = {
  number: string;
  title: string;
  description: string;
  details: string[];
  tags: string[];
  href: string;
  linkLabel: string;
  accent: Accent;
  featured?: boolean;
  type: string;
};

export const projects: Project[] = [
  {
    number: '01',
    title: 'AniMatch',
    description:
      'A full-stack anime discovery platform with a Spring Boot backend, server-rendered UI, and optimized relational data models.',
    details: [
      'Consumes real-time anime data through the Jikan API.',
      'Handles user-specific saved anime and discovery features.',
      'Uses PostgreSQL for structured, query-efficient data storage.',
    ],
    tags: ['Spring Boot', 'PostgreSQL', 'Thymeleaf', 'Jikan API', 'Java'],
    href: 'https://animatch-ue3t.onrender.com',
    linkLabel: 'View project',
    accent: 'yellow',
    featured: true,
    type: 'Full-stack platform',
  },
  {
    number: '02',
    title: 'PvmLogistiek',
    description:
      'A complete WordPress website built from scratch with responsive layouts, fast loading, and tailored client functionality.',
    details: [
      'Designed and developed the full website from the ground up.',
      'Created a responsive custom theme for every screen size.',
      'Implemented client-specific features without unnecessary bloat.',
    ],
    tags: ['WordPress', 'PHP', 'Custom theme'],
    href: 'https://pvmlogistiek.nl',
    linkLabel: 'View site',
    accent: 'blue',
    featured: true,
    type: 'Custom WordPress',
  },
  {
    number: '03',
    title: 'Alecto Australia',
    description:
      'Advanced dual-search and filtering functionality designed to improve recruiter workflows and candidate discovery.',
    details: [
      'Integrated advanced dual search with FacetWP.',
      'Customized filters around real recruiter workflows.',
      'Preserved visual consistency with the existing theme.',
    ],
    tags: ['FacetWP', 'WordPress', 'React'],
    href: 'https://www.alectoaustralia.com',
    linkLabel: 'View site',
    accent: 'coral',
    featured: true,
    type: 'Search experience',
  },
  {
    number: '04',
    title: 'Alison Deyette',
    description:
      'A full theme and content migration completed without content loss, with search-friendly on-page structure and hosting migration.',
    details: [
      'Transitioned the theme while preserving visual integrity.',
      'Migrated all posts and pages to the new environment.',
      'Implemented on-page SEO with Yoast and moved hosting safely.',
    ],
    tags: ['WordPress', 'Yoast SEO', 'Migration'],
    href: 'https://alisondeyette.com',
    linkLabel: 'View site',
    accent: 'mint',
    featured: true,
    type: 'Migration & SEO',
  },
  {
    number: '05',
    title: 'Curtis Myrie',
    description:
      'A multi-page rebuild and redesign using Divi, closely matched to supplied design references and optimized across devices.',
    details: [
      'Rebuilt and redesigned multiple pages in Divi.',
      'Restored complex layouts and updated global navigation.',
      'Maintained styling accuracy across mobile and desktop.',
    ],
    tags: ['WordPress', 'Divi', 'Migration'],
    href: 'https://curtismyrie.com',
    linkLabel: 'View site',
    accent: 'violet',
    featured: true,
    type: 'Website redesign',
  },
  {
    number: '06',
    title: 'Moorebank Amcal Pharmacy',
    description:
      'A modern, responsive sleep apnoea service page with integrated forms and a clearer journey from education to enquiry.',
    details: [
      'Rebuilt the service page with a modern visual structure.',
      'Implemented responsive behavior across breakpoints.',
      'Integrated a multi-step enquiry form.',
    ],
    tags: ['Webflow', 'Responsive', 'Multi-step form'],
    href: 'https://www.moorebankamcal.com.au',
    linkLabel: 'View site',
    accent: 'yellow',
    featured: true,
    type: 'Healthcare landing page',
  },
  {
    number: '07',
    title: 'Klussenbedrijf Schagen',
    description:
      'A complete page recreation with a refreshed layout, improved usability, consistent styling, and performance-focused implementation.',
    details: [
      'Recreated all major pages with a modern visual system.',
      'Improved hierarchy and usability across the site.',
      'Focused on performance and cross-page consistency.',
    ],
    tags: ['WordPress', 'Responsive', 'Performance'],
    href: 'https://klussenbedrijfschagen.nl',
    linkLabel: 'View site',
    accent: 'blue',
    type: 'Website rebuild',
  },
  {
    number: '08',
    title: 'Clownbijouxxx',
    description:
      'An Avada-based reconstruction that modernized the experience while retaining the brand identity and improving page speed.',
    details: [
      'Reconstructed the full site using Avada.',
      'Improved page speed and overall user experience.',
      'Kept the original brand recognizable throughout the redesign.',
    ],
    tags: ['WordPress', 'Avada', 'Performance'],
    href: 'https://clownbijouxxx.nl/nieuw',
    linkLabel: 'View site',
    accent: 'coral',
    type: 'Theme reconstruction',
  },
  {
    number: '09',
    title: 'Magnus Schaak',
    description:
      'A sponsor showcase page with clear visual tiers, linked sponsor identities, and responsive presentation.',
    details: [
      'Created a dedicated main and sub-sponsor layout.',
      'Linked every sponsor logo to its external website.',
      'Configured safe new-tab behavior and responsive spacing.',
    ],
    tags: ['WordPress', 'Sponsors', 'Responsive'],
    href: 'https://www.magnusschaak.nl',
    linkLabel: 'View site',
    accent: 'mint',
    type: 'Feature page',
  },
  {
    number: '10',
    title: 'Landen Zeezicht',
    description:
      'A Gravity Forms reservation rebuild with business-rule validation and a safe staging-to-production rollout.',
    details: [
      'Rebuilt the reservations flow using Gravity Forms.',
      'Added validation for a minimum booking of eight people.',
      'Tested on a noindex staging route before replacing production.',
    ],
    tags: ['Gravity Forms', 'Validation', 'WordPress'],
    href: 'https://landenzeezicht.nl',
    linkLabel: 'View site',
    accent: 'violet',
    type: 'Form engineering',
  },
  {
    number: '11',
    title: 'Job Portal Website',
    description:
      'A Laravel and MySQL job platform with role-based authentication, job publishing, search, filtering, and application management.',
    details: [
      'Built around MVC architecture with Laravel and MySQL.',
      'Implemented authorization for job seekers and employers.',
      'Created job posting, search, filtering, and application flows.',
    ],
    tags: ['Laravel', 'MySQL', 'MVC', 'Authentication'],
    href: 'https://github.com/tamanghawana09/Job-portal-website',
    linkLabel: 'View repository',
    accent: 'yellow',
    type: 'Full-stack application',
  },
];

export const skills = {
  Backend: ['Java', 'Spring Boot', 'REST APIs', 'JPA / Hibernate', 'JWT / OAuth', 'PHP / Laravel'],
  'Databases & tools': ['PostgreSQL', 'SQL', 'Git', 'Postman', 'Python', 'C / C++'],
  'Frontend & CMS': ['WordPress', 'Gutenberg blocks', 'React.js', 'Thymeleaf', 'HTML / CSS', 'JavaScript'],
};

export const experience = [
  {
    period: 'Jul 2026 – present',
    company: 'Khoja Nepal Pvt Ltd',
    role: 'Web Developer & Digital Team Lead',
    points: [
      'Leading the digital team and managing web development projects.',
      'Collaborating on project planning, execution, and delivery quality.',
    ],
  },
  {
    period: 'Feb 2026 – Apr 2026',
    company: 'iSmart',
    role: 'Java Developer Intern',
    points: [
      'Implemented scalable services for AniMatch and an Expense Tracker using Java Spring Boot.',
      'Integrated JWT and OAuth for secure authentication and authorization.',
      'Built protected REST API communication between services.',
    ],
  },
  {
    period: 'Jul 2024 – Oct 2025',
    company: 'WPDrops Pvt. Ltd.',
    role: 'Jr WordPress Developer',
    points: [
      'Built custom Gutenberg blocks and plugins using React and Swiper.js.',
      'Delivered full-site builds and advanced block-based features for international clients.',
    ],
  },
  {
    period: 'Apr 2024 – Jun 2024',
    company: 'WPDrops Pvt. Ltd.',
    role: 'WordPress Developer Intern',
    points: [
      'Created custom meta boxes, custom post types, and theme customizations.',
      'Collaborated with frontend teams on dynamic content integration.',
    ],
  },
];

export const values = [
  {
    title: 'Clean architecture',
    text: 'Code that a stranger can understand six months later: clear naming, separation of concerns, and no hidden magic.',
    accent: 'yellow' as Accent,
  },
  {
    title: 'Performance matters',
    text: 'A slow API or a four-second page load is not a minor detail. It is part of the product experience.',
    accent: 'blue' as Accent,
  },
  {
    title: 'Writing to learn',
    text: 'Explaining an idea exposes gaps quickly. Writing is part of the engineering process, not decoration.',
    accent: 'coral' as Accent,
  },
  {
    title: 'Always shipping',
    text: 'Deployed and improving beats perfect and invisible. Real feedback creates better work than endless polishing.',
    accent: 'mint' as Accent,
  },
];

export const storyTimeline = [
  {
    year: '2022',
    title: 'Started BIT and wrote the first line of C',
    meta: 'KIST College',
  },
  {
    year: '2024',
    title: 'Built AniMatch, the first full-stack Java project',
    meta: 'Spring Boot · PostgreSQL · Thymeleaf',
  },
  {
    year: 'Apr – Jun 2024',
    title: 'WordPress Developer Internship',
    meta: 'WPDrops Pvt. Ltd.',
  },
  {
    year: 'Jul 2024 – Oct 2025',
    title: 'Jr WordPress Developer',
    meta: 'WPDrops Pvt. Ltd.',
  },
  {
    year: 'Nov 2025',
    title: 'BIT Graduation',
    meta: 'KIST College · Purbanchal University',
  },
];

export const videos = [
  {
    title: 'IntelliJ IDEA Beginner Tutorial (नेपाली)',
    subtitle: 'Install, Maven Project Creation & File Structure',
    date: 'June 14, 2026',
    id: '14h-0AiQCCM',
  },
  {
    title: "Hawana's Blueprint for 2026",
    subtitle: 'Backend Developer Vision',
    date: 'May 25, 2026',
    id: 'jLpKZRJEaIo',
  },
  {
    title: 'HackerRank: Grading Students in Nepali',
    subtitle: 'Problem-solving walkthrough',
    date: 'March 2, 2026',
    id: 'Af5ebh0sTqE',
  },
];


export const academicProjects = [
  { title: 'Railway Reservation System', stack: 'C++' },
  { title: 'Bike Rental System', stack: 'C#' },
  { title: 'MusicVerse', stack: 'Java' },
  { title: 'Job Application', stack: 'PHP' },
  { title: 'Sign Language Recognition System', stack: 'Python' },
];

export const faqs = [
  {
    question: 'Are you open to remote work?',
    answer:
      'Yes. My professional experience at WPDrops included delivering projects remotely for international clients.',
  },
  {
    question: 'What kind of projects do you take on?',
    answer:
      'Java and Spring Boot backend APIs, WordPress plugins, themes and Gutenberg blocks, plus selected full-stack builds.',
  },
  {
    question: 'Are you available for full-time roles?',
    answer:
      'Yes. I am actively open to full-time backend opportunities, while freelance and contract projects are also welcome.',
  },
  {
    question: 'What is your preferred stack?',
    answer:
      'Java, Spring Boot, and PostgreSQL for backend systems; WordPress and React for CMS work. I stay open to the right tools for the problem.',
  },
  {
    question: 'Can I see your resume?',
    answer:
      'Yes. Use the resume button in the navigation or contact me for the latest copy.',
  },
  {
    question: 'Do you do code reviews or consulting?',
    answer:
      'On a case-by-case basis. Share the Spring Boot or WordPress codebase and the outcome you need, and we can define the scope.',
  },
];
