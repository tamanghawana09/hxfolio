import gsap from 'gsap';
import { attacks, conflicts, toggleQueen, generateSolutions, compatibleSolution, solutionKey, solverSteps, type Queen } from '../lib/nqueens';

function mountGame(root: HTMLElement) {
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const canvas = get<HTMLCanvasElement>('[data-board]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const status = get('[data-status]');
  const sizeSelect = get<HTMLSelectElement>('[data-size]');
  const speed = get<HTMLInputElement>('[data-speed]');
  const play = get<HTMLButtonElement>('[data-play]');
  const pause = get<HTMLButtonElement>('[data-pause]');
  const listeners = new AbortController();
  const signal = listeners.signal;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const css = getComputedStyle(root);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const palette = {
    light: color('--bg'), dark: color('--yellow-soft'), ink: color('--text'),
    attack: color('--text-soft'), conflict: color('--coral-soft'),
    red: color('--coral'), blue: color('--blue'),
  };
  let size = 8;
  let board: Queen[] = [];
  let solutions = generateSolutions(size);
  let found = new Set<string>();
  const sessionProgress = new Map<number, Set<string>>();
  let moves = 0;
  let cursor: Queen = { row: 0, col: 0 };
  let iterator: ReturnType<typeof solverSteps> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let demonstration = false;
  let revealIndex = 0;
  let width = 0;

  function announce(message: string, success = false) {
    gsap.killTweensOf(status);
    gsap.set(status, { clearProps: 'transform' });
    status.textContent = message;
    status.dataset.success = String(success);
    if (success && !motion.matches) gsap.fromTo(status, { y: 5, scale: .97 }, { y: 0, scale: 1, duration: .4, ease: 'back.out(1.5)' });
  }

  function readProgress() {
    found = sessionProgress.get(size) ?? new Set();
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(`nqueens:v1:${size}`) ?? '[]');
      const valid = new Set(solutions.map(solutionKey));
      if (Array.isArray(stored)) {
        for (const key of stored) if (typeof key === 'string' && valid.has(key)) found.add(key);
      }
    } catch { /* Storage can be blocked or contain malformed data. */ }
    sessionProgress.set(size, found);
  }

  function draw() {
    if (!ctx || !width) return;
    const cell = width / size;
    const { involved } = conflicts(board);
    ctx.clearRect(0, 0, width, width);
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      const index = board.findIndex(q => q.row === row && q.col === col);
      const conflict = involved.has(index);
      const attacked = board.some(q => (q.row !== row || q.col !== col) && attacks(q, { row, col }));
      const x = col * cell, y = row * cell;
      ctx.fillStyle = conflict ? palette.conflict : (row + col) % 2 ? palette.dark : palette.light;
      ctx.fillRect(x, y, cell, cell);
      if (attacked && index === -1) {
        ctx.globalAlpha = .09;
        ctx.fillStyle = palette.ink;
        ctx.fillRect(x, y, cell, cell);
        ctx.globalAlpha = .55;
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * .045, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (index !== -1) {
        // A font-independent vector crown, in normalized square coordinates.
        ctx.save(); ctx.translate(x, y); ctx.scale(cell, cell);
        ctx.fillStyle = conflict ? palette.red : palette.ink;
        ctx.strokeStyle = palette.ink; ctx.lineWidth = .025;
        ctx.beginPath(); ctx.moveTo(.25, .68); ctx.lineTo(.18, .32);
        ctx.lineTo(.36, .46); ctx.lineTo(.5, .22); ctx.lineTo(.64, .46);
        ctx.lineTo(.82, .32); ctx.lineTo(.75, .68); ctx.closePath(); ctx.fill(); ctx.stroke();
        for (const [cx, cy] of [[.18, .28], [.5, .18], [.82, .28]]) {
          ctx.beginPath(); ctx.arc(cx, cy, .05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.fillRect(.23, .74, .54, .08); ctx.strokeRect(.23, .74, .54, .08);
        if (conflict) {
          ctx.beginPath(); ctx.moveTo(.79, .78); ctx.lineTo(.93, .92); ctx.moveTo(.93, .78); ctx.lineTo(.79, .92); ctx.lineWidth = .04; ctx.stroke();
        }
        ctx.restore();
      }
    }
    if (document.activeElement === canvas) {
      ctx.strokeStyle = palette.ink; ctx.lineWidth = 3;
      ctx.strokeRect(cursor.col * cell + 3, cursor.row * cell + 3, cell - 6, cell - 6);
      ctx.strokeStyle = palette.blue; ctx.lineWidth = 2;
      ctx.strokeRect(cursor.col * cell + 6, cursor.row * cell + 6, cell - 12, cell - 12);
    }
  }

  function resize() {
    width = canvas.getBoundingClientRect().width;
    const pixels = Math.round(width * (window.devicePixelRatio || 1));
    canvas.width = pixels; canvas.height = pixels;
    ctx!.setTransform(pixels / width || 1, 0, 0, pixels / width || 1, 0, 0);
    draw();
  }

  function render() {
    const pairs = conflicts(board).pairs;
    get('[data-stats]').textContent = `Queens ${board.length} / ${size} · Conflicts ${pairs} · Moves ${moves}`;
    get('[data-progress]').textContent = `Found ${found.size} of ${solutions.length}`;
    canvas.setAttribute('aria-label', `${size} by ${size} N-Queens board. ${board.length} queens, ${pairs} attacking pairs. Cursor row ${cursor.row + 1}, column ${cursor.col + 1}.`);
    draw();
  }

  function stop(discard = true) {
    clearTimeout(timer); timer = undefined; running = false;
    play.disabled = false; pause.disabled = true;
    if (discard) iterator = undefined;
  }

  function checkWin() {
    if (board.length !== size || conflicts(board).pairs) return;
    if (demonstration) { announce('A valid arrangement. Reset to start your own discovery.', true); return; }
    const key = solutionKey(board);
    const duplicate = found.has(key);
    found.add(key);
    let saved = true;
    try { localStorage.setItem(`nqueens:v1:${size}`, JSON.stringify([...found])); } catch { saved = false; }
    announce(`${duplicate ? 'You already found this solution.' : 'Solution found!'} Found ${found.size} of ${solutions.length}.${saved ? '' : ' Progress is saved for this visit only; browser storage is unavailable.'}`, true);
  }

  function toggle(queen: Queen) {
    stop();
    const existed = board.some(q => q.row === queen.row && q.col === queen.col);
    board = toggleQueen(board, queen); moves++;
    announce(`Queen ${existed ? 'removed from' : 'placed at'} row ${queen.row + 1}, column ${queen.col + 1}. ${conflicts(board).pairs} attacking pairs.`);
    checkWin(); render();
  }

  function reset() {
    stop(); board = []; moves = 0; demonstration = false; cursor = { row: 0, col: 0 };
    announce('A fresh board. Your discoveries are kept.'); render();
  }

  function advance() {
    if (!iterator) { iterator = solverSteps(size); board = []; moves = 0; demonstration = true; }
    const next = iterator.next();
    if (next.done) { stop(); return; }
    board = next.value.board;
    const { kind, queen } = next.value;
    const position = queen ? `row ${queen.row + 1}, column ${queen.col + 1}` : '';
    announce(kind === 'solved' ? 'Solver finished. Reset to find a solution yourself.'
      : kind === 'backtrack' ? `Backtrack: remove the queen at ${position}.`
      : kind === 'conflict' ? `Conflict at ${position}. Try another square.`
      : `Try a queen at ${position}.`, kind === 'solved');
    render();
    if (kind === 'solved') stop();
  }

  function tick() {
    advance();
    if (running) timer = setTimeout(tick, 1000 / Number(speed.value));
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    cursor = { row: Math.min(size - 1, Math.max(0, Math.floor((event.clientY - rect.top) / rect.height * size))), col: Math.min(size - 1, Math.max(0, Math.floor((event.clientX - rect.left) / rect.width * size))) };
    canvas.focus({ preventScroll: true }); toggle({ ...cursor });
  }, { signal });
  canvas.addEventListener('keydown', event => {
    const directions: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (directions[event.key]) {
      event.preventDefault();
      const [row, col] = directions[event.key];
      cursor = { row: (cursor.row + row + size) % size, col: (cursor.col + col + size) % size };
      const queen = board.find(q => q.row === cursor.row && q.col === cursor.col);
      announce(`Row ${cursor.row + 1}, column ${cursor.col + 1}: ${queen ? 'queen' : 'empty'}${board.some(q => q !== queen && attacks(q, cursor)) ? ', attacked' : ', safe'}.`);
      render();
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!event.repeat) toggle({ ...cursor }); }
  }, { signal });
  canvas.addEventListener('focus', draw, { signal });
  canvas.addEventListener('blur', draw, { signal });
  get('[data-reset]').addEventListener('click', reset, { signal });
  sizeSelect.addEventListener('change', () => {
    size = Number(sizeSelect.value); solutions = generateSolutions(size); revealIndex = 0;
    readProgress(); reset(); announce(`${size} by ${size} board. ${solutions.length} possible solutions.`);
  }, { signal });
  get('[data-hint]').addEventListener('click', () => {
    stop();
    const solution = compatibleSolution(solutions, board);
    if (!solution) { announce('These queens cannot lead to a full solution. Remove a queen or reset, then try a hint.'); return; }
    const queen = solution.find(q => !board.some(b => b.row === q.row && b.col === q.col));
    if (queen) { cursor = { ...queen }; toggle({ ...queen }); } else announce('This board is already complete. Reset to try another arrangement.');
  }, { signal });
  get('[data-solution]').addEventListener('click', () => {
    stop(); demonstration = true;
    const unseen = solutions.filter(s => !found.has(solutionKey(s)));
    const choices = unseen.length ? unseen : solutions;
    board = choices[revealIndex++ % choices.length].map(q => ({ ...q }));
    announce(`${unseen.length ? 'An undiscovered solution' : 'You have found every solution! An arrangement'} revealed. Reset to start your own discovery.`, true); render();
  }, { signal });
  play.addEventListener('click', () => {
    if (motion.matches) {
      stop(); demonstration = true; moves = 0; board = solutions[0].map(q => ({ ...q }));
      announce('Solver finished instantly with reduced motion. Use Step to inspect decisions, or Reset to play.', true); render(); return;
    }
    running = true; play.disabled = true; pause.disabled = false; tick();
  }, { signal });
  pause.addEventListener('click', () => { stop(false); announce('Solver paused. Play resumes; Step shows the next decision.'); }, { signal });
  get('[data-step]').addEventListener('click', () => { stop(false); advance(); }, { signal });
  speed.addEventListener('input', () => { get('[data-speed-label]').textContent = `${speed.value} steps / second`; }, { signal });
  motion.addEventListener('change', () => { stop(false); gsap.killTweensOf(status); gsap.set(status, { clearProps: 'transform' }); }, { signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(false); }, { signal });
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  window.addEventListener('resize', resize, { signal });
  readProgress(); resize(); render();
  return () => { stop(); listeners.abort(); observer.disconnect(); gsap.killTweensOf(status); };
}

let cleanup: (() => void) | undefined;
function init() {
  cleanup?.();
  const root = document.querySelector<HTMLElement>('[data-queens-game]');
  cleanup = root ? mountGame(root) : undefined;
}
init();
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => cleanup?.());
window.addEventListener('pagehide', () => cleanup?.());
window.addEventListener('pageshow', event => { if (event.persisted) init(); });
