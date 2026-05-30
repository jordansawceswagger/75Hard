// Character identity = one of four species. The map/Friends sprite evolves
// across the 75-day run (cub -> sprout -> beast). All driven by the player's
// real day = daysSince(start_date) (NOT users.current_day, which is never
// maintained and would freeze everyone at stage 1).

export const SPECIES = [
  { id: 'rhino',   label: 'RHINO',    tag: 'Sensei' },
  { id: 'otter',   label: 'OTTER',    tag: 'Tactical' },
  { id: 'giraffe', label: 'GIRAFFE',  tag: 'Corporate' },
  { id: 'cat',     label: 'CAT',      tag: 'Formal chaos' },
];

// Evolution stages in progression order.
export const STAGES = ['cub', 'sprout', 'beast'];

export function getStage(day) {
  if (day <= 25) return 'cub';
  if (day <= 50) return 'sprout';
  return 'beast';
}

export function spriteUrl(species, day) {
  return `/town/${species || 'rhino'}-${getStage(day)}.png`;
}

// Tavern physically builds up over the run, in 4 quarters.
export function tavernUrl(day) {
  const q = day <= 18 ? 1 : day <= 37 ? 2 : day <= 56 ? 3 : 4;
  return `/town/tavern-q${q}.png`;
}
