// Town world: 16x16 tiles, rendered at TILE px each into a fixed-size world that
// the camera pans across (see Today.jsx). Buildings + decorations + the river are
// obstacles; the character routes around them on the 4-neighbour grid, preferring
// dirt-path tiles (cheaper) so it walks the "roads". Positions are {col,row}.
//
// A river winds top-to-bottom and splits the town into a west and an east bank.
// It is impassable except at the single BRIDGE tile — half the tasks live across
// the water, so the character routes over the bridge to reach them.

export const GRID = 16;
export const TILE = 48;            // px per tile
export const WORLD = GRID * TILE;  // px

// ---- Roads -----------------------------------------------------------------
// Dirt-path avenues on each bank, joined across the water by the bridge.
const PATH = new Set();
const addH = (row, c0, c1) => { for (let c = c0; c <= c1; c++) PATH.add(`${c},${row}`); };
const addV = (col, r0, r1) => { for (let r = r0; r <= r1; r++) PATH.add(`${col},${r}`); };
addH(3, 1, 8);  addH(7, 1, 9);  addH(12, 1, 8);   // west bank horizontals
addH(3, 11, 14); addH(7, 11, 15); addH(12, 11, 14); // east bank horizontals
addV(3, 3, 12); addV(7, 3, 12);                   // west verticals
addV(13, 3, 12);                                  // east vertical

// ---- River + bridge --------------------------------------------------------
// One orthogonally-continuous band of water from the top edge to the bottom
// edge, so the only way across is the bridge tile.
const RIVER = new Set([
  '10,0', '10,1', '10,2', '9,2', '9,3', '9,4', '9,5', '10,5', '10,6',
  /* 10,7 is the BRIDGE (walkable) */
  '10,8', '11,8', '11,9', '11,10', '11,11', '10,11',
  '10,12', '10,13', '10,14', '10,15',
]);
const BRIDGE = '10,7';

export function tileType(col, row) {
  const k = `${col},${row}`;
  if (k === BRIDGE) return 'B';            // bridge — walkable, walks like a road
  if (RIVER.has(k)) return 'W';            // water — impassable
  return PATH.has(k) ? 'P' : 'G';          // path / grass
}

export const TILES = Array.from({ length: GRID }, (_, row) =>
  Array.from({ length: GRID }, (_, col) => tileType(col, row))
);

export const START_CELL = { col: 7, row: 7 };  // west-bank road junction

// ---- Buildings (interactive) -----------------------------------------------
// Scattered across the interior and both banks. `approach` is the road tile the
// character stands on to interact (always a path tile, so always reachable).
export const BUILDINGS = [
  // West bank
  { id: 'library', task: 'reading', label: 'LIBRARY',      emoji: '📚', col: 6,  row: 2,  approach: { col: 6,  row: 3 } },
  { id: 'gym',     task: 'gym',     label: 'GYM',          emoji: '🏋️', col: 2,  row: 6,  approach: { col: 3,  row: 6 } },
  { id: 'kitchen', task: 'diet',    label: 'KITCHEN',      emoji: '🍳', col: 6,  row: 9,  approach: { col: 7,  row: 9 } },
  { id: 'well',    task: 'water',   label: 'WELL',         emoji: '⛲', col: 4,  row: 11, approach: { col: 3,  row: 11 } },
  // East bank (reached across the bridge)
  { id: 'photo',   task: 'photo',   label: 'PHOTO STUDIO', emoji: '📸', col: 12, row: 2,  approach: { col: 12, row: 3 } },
  { id: 'park',    task: 'outdoor', label: 'PARK',         emoji: '🌳', col: 14, row: 5,  approach: { col: 13, row: 5 } },
  { id: 'tavern',  task: 'alcohol', label: 'TAVERN',       emoji: '🍺', col: 12, row: 8,  approach: { col: 12, row: 7 } },
  { id: 'inn',     task: 'sleep',   label: 'INN',          emoji: '🛏️', col: 14, row: 13, approach: { col: 14, row: 12 } },
];

// ---- Decorative houses (non-interactive, but solid) ------------------------
export const COTTAGES = [
  { col: 1,  row: 1 },
  { col: 5,  row: 1 },
  { col: 1,  row: 4 },
  { col: 8,  row: 5 },
  { col: 1,  row: 13 },
  { col: 6,  row: 14 },
  { col: 13, row: 1 },
  { col: 15, row: 9 },
  { col: 14, row: 14 },
];

const BLOCKED = new Set([
  ...BUILDINGS.map(b => `${b.col},${b.row}`),
  ...COTTAGES.map(c => `${c.col},${c.row}`),
]);

export function isWalkable(col, row) {
  if (col < 0 || col >= GRID || row < 0 || row >= GRID) return false;
  if (tileType(col, row) === 'W') return false;        // river is impassable
  return !BLOCKED.has(`${col},${row}`);
}

const KEY = (c, r) => `${c},${r}`;
const enterCost = (c, r) => {
  const t = tileType(c, r);
  return (t === 'P' || t === 'B') ? 1 : 3;             // roads + bridge are cheap
};

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
