export type Queen = { row: number; col: number };
export const totals: Record<number, number> = { 4: 2, 5: 10, 6: 4, 7: 40, 8: 92, 9: 352, 10: 724 };

export function attacks(a: Queen, b: Queen): boolean {
  return a.row === b.row || a.col === b.col || Math.abs(a.row - b.row) === Math.abs(a.col - b.col);
}

export function conflicts(board: Queen[]) {
  const involved = new Set<number>();
  let pairs = 0;
  board.forEach((a, i) => board.slice(i + 1).forEach((b, offset) => {
    if (attacks(a, b)) { involved.add(i); involved.add(i + offset + 1); pairs++; }
  }));
  return { involved, pairs };
}

export function toggleQueen(board: Queen[], queen: Queen): Queen[] {
  return board.some(q => q.row === queen.row && q.col === queen.col)
    ? board.filter(q => q.row !== queen.row || q.col !== queen.col)
    : [...board, queen];
}

// Row-ordered columns preserve rotations and reflections as distinct solutions.
export function solutionKey(board: Queen[]): string {
  return [...board].sort((a, b) => a.row - b.row).map(q => q.col).join(',');
}

export function generateSolutions(size: number): Queen[][] {
  const solutions: Queen[][] = [];
  const board: Queen[] = [];
  function visit(row: number) {
    if (row === size) { solutions.push(board.map(q => ({ ...q }))); return; }
    for (let col = 0; col < size; col++) {
      const queen = { row, col };
      if (board.some(q => attacks(q, queen))) continue;
      board.push(queen); visit(row + 1); board.pop();
    }
  }
  visit(0);
  return solutions;
}

export function compatibleSolution(solutions: Queen[][], board: Queen[]): Queen[] | undefined {
  return solutions.find(solution => board.every(q => solution.some(s => s.row === q.row && s.col === q.col)));
}

export type SolverStep = { board: Queen[]; kind: 'try' | 'conflict' | 'backtrack' | 'solved'; queen?: Queen };
export function* solverSteps(size: number): Generator<SolverStep> {
  const board: Queen[] = [];
  function* visit(row: number): Generator<SolverStep, boolean> {
    if (row === size) { yield { board: [...board], kind: 'solved' }; return true; }
    for (let col = 0; col < size; col++) {
      const queen = { row, col };
      const blocked = board.some(q => attacks(q, queen));
      yield { board: [...board, queen], kind: 'try', queen };
      if (blocked) yield { board: [...board, queen], kind: 'conflict', queen };
      else {
        board.push(queen);
        if (yield* visit(row + 1)) return true;
        board.pop();
      }
      yield { board: [...board], kind: 'backtrack', queen };
    }
    return false;
  }
  yield* visit(0);
}
