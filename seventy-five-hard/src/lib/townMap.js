// Town grid: 10x10 tiles. Buildings are obstacles; the character routes around
// them on the 4-neighbour grid, preferring dirt-path tiles (cheaper) so it walks
// the "roads". Positions are {col,row}; the screen renders them as percentages.

export const GRID = 10;

// Dirt-path corridors. Everything else is grass. Both are walkable; path tiles
// are cheaper for the router so the character prefers them.
const PATH = new Set();
const addH = (row, c0, c1) => { for (let c = c0; c <= c1; c++) PATH.add(`${c},${row}`); };
const addV = (col, r0, r1) => { for (let r = r0; r <= r1; r++) PATH.add(`${col},${r}`); };
addV(2, 1, 8);
addV(7, 1, 8);
addH(4, 2, 7);
addH(8, 2, 7);
addV(5, 4, 8);

export function tileType(col, row) {
  return PATH.has(`${col},${row}`) ? 'P' : 'G';
}

export const TILES = Array.from({ length: GRID }, (_, row) =>
  Array.from({ length: GRID }, (_, col) => tileType(col, row))
);

export const START_CELL = { col: 5, row: 6 };

// task/label/id match the original emoji buildings; col/row place them on the
// grid, approach is the walkable tile the character stands on to interact.
export const BUILDINGS = [
  { id: 'library', task: 'reading', label: 'LIBRARY',      emoji: '📚', col: 1, row: 1, approach: { col: 2, row: 1 } },
  { id: 'photo',   task: 'photo',   label: 'PHOTO STUDIO', emoji: '📸', col: 8, row: 1, approach: { col: 7, row: 1 } },
  { id: 'well',    task: 'water',   label: 'WELL',         emoji: '⛲', col: 1, row: 4, approach: { col: 2, row: 4 } },
  { id: 'park',    task: 'outdoor', label: 'PARK',         emoji: '🌳', col: 8, row: 4, approach: { col: 7, row: 4 } },
  { id: 'tavern',  task: 'alcohol', label: 'TAVERN',       emoji: '🍺', col: 4, row: 5, approach: { col: 4, row: 4 } },
  { id: 'gym',     task: 'gym',     label: 'GYM',          emoji: '🏋️', col: 1, row: 8, approach: { col: 2, row: 8 } },
  { id: 'kitchen', task: 'diet',    label: 'KITCHEN',      emoji: '🍳', col: 5, row: 9, approach: { col: 5, row: 8 } },
  { id: 'inn',     task: 'sleep',   label: 'INN',          emoji: '🛏️', col: 8, row: 8, approach: { col: 7, row: 8 } },
];

const BLOCKED = new Set(BUILDINGS.map(b => `${b.col},${b.row}`));

export function isWalkable(col, row) {
  return col >= 0 && col < GRID && row >= 0 && row < GRID && !BLOCKED.has(`${col},${row}`);
}

const KEY = (c, r) => `${c},${r}`;
const enterCost = (c, r) => (tileType(c, r) === 'P' ? 1 : 3);

// A* on the 4-neighbour grid (path tiles cheaper). Returns the steps from start
// (exclusive) to goal (inclusive), or [] if unreachable / already there.
export function findPath(start, goal) {
  if (!isWalkable(goal.col, goal.row)) return [];
  const startK = KEY(start.col, start.row);
  const goalK = KEY(goal.col, goal.row);
  if (startK === goalK) return [];

  const open = [{ c: start.col, r: start.row, f: 0 }];
  const came = {};
  const gScore = { [startK]: 0 };
  const h = (c, r) => Math.abs(c - goal.col) + Math.abs(r - goal.row);

  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    const curK = KEY(cur.c, cur.r);
    if (curK === goalK) break;
    for (const [dc, dr] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nc = cur.c + dc, nr = cur.r + dr;
      if (!isWalkable(nc, nr)) continue;
      const nk = KEY(nc, nr);
      const tentative = gScore[curK] + enterCost(nc, nr);
      if (gScore[nk] === undefined || tentative < gScore[nk]) {
        gScore[nk] = tentative;
        came[nk] = curK;
        open.push({ c: nc, r: nr, f: tentative + h(nc, nr) });
      }
    }
  }

  if (gScore[goalK] === undefined) return [];
  const path = [];
  let k = goalK;
  while (k !== startK) {
    const [c, r] = k.split(',').map(Number);
    path.push({ col: c, row: r });
    k = came[k];
    if (k === undefined) return [];
  }
  return path.reverse();
}

// Direction the character should face moving from cell a -> b.
export function dirBetween(a, b) {
  if (b.col > a.col) return 'right';
  if (b.col < a.col) return 'left';
  if (b.row > a.row) return 'down';
  return 'up';
}
