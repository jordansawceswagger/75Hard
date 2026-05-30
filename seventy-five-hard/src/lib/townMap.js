// Town world: 16x16 tiles, rendered at TILE px each into a fixed-size world that
// the camera pans across (see Today.jsx). Buildings + decorations are obstacles;
// the character routes around them on the 4-neighbour grid, preferring dirt-path
// tiles (cheaper) so it walks the "roads". Positions are {col,row}.

export const GRID = 16;
export const TILE = 48;            // px per tile
export const WORLD = GRID * TILE;  // px

// Dirt-path avenues: 3 horizontal (rows 3,8,12) x 3 vertical (cols 2,7,13),
// forming a connected road grid. Everything else is grass.
const PATH = new Set();
const addH = (row, c0, c1) => { for (let c = c0; c <= c1; c++) PATH.add(`${c},${row}`); };
const addV = (col, r0, r1) => { for (let r = r0; r <= r1; r++) PATH.add(`${col},${r}`); };
addH(3, 2, 13); addH(8, 2, 13); addH(12, 2, 13);
addV(2, 3, 12); addV(7, 3, 12); addV(13, 3, 12);

export function tileType(col, row) {
  return PATH.has(`${col},${row}`) ? 'P' : 'G';
}

export const TILES = Array.from({ length: GRID }, (_, row) =>
  Array.from({ length: GRID }, (_, col) => tileType(col, row))
);

export const START_CELL = { col: 7, row: 8 };

// Buildings sit just off the avenues; `approach` is the road tile the character
// stands on to interact (always on an avenue, so always reachable).
export const BUILDINGS = [
  { id: 'library', task: 'reading', label: 'LIBRARY',      emoji: '📚', col: 3,  row: 2,  approach: { col: 3,  row: 3 } },
  { id: 'photo',   task: 'photo',   label: 'PHOTO STUDIO', emoji: '📸', col: 12, row: 2,  approach: { col: 12, row: 3 } },
  { id: 'well',    task: 'water',   label: 'WELL',         emoji: '⛲', col: 1,  row: 8,  approach: { col: 2,  row: 8 } },
  { id: 'park',    task: 'outdoor', label: 'PARK',         emoji: '🌳', col: 14, row: 8,  approach: { col: 13, row: 8 } },
  { id: 'tavern',  task: 'alcohol', label: 'TAVERN',       emoji: '🍺', col: 8,  row: 7,  approach: { col: 8,  row: 8 } },
  { id: 'gym',     task: 'gym',     label: 'GYM',          emoji: '🏋️', col: 3,  row: 13, approach: { col: 3,  row: 12 } },
  { id: 'kitchen', task: 'diet',    label: 'KITCHEN',      emoji: '🍳', col: 8,  row: 13, approach: { col: 8,  row: 12 } },
  { id: 'inn',     task: 'sleep',   label: 'INN',          emoji: '🛏️', col: 12, row: 13, approach: { col: 12, row: 12 } },
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
