// Dicebear pixel-art trait options. Values come from
// https://www.dicebear.com/playground/?style=pixel-art
// Pick the ones that look distinct + flattering. More options = more decision fatigue.

export const TRAITS = {
  skinColor: [
    { value: 'ffe4c0', label: 'Light' },
    { value: 'eac393', label: 'Tan' },
    { value: 'b68655', label: 'Medium' },
    { value: '8d5524', label: 'Brown' },
    { value: '5c3317', label: 'Deep' },
  ],
  hair: [
    { value: 'short01', label: 'Short A' },
    { value: 'short02', label: 'Short B' },
    { value: 'short03', label: 'Short C' },
    { value: 'short04', label: 'Buzz' },
    { value: 'short05', label: 'Mohawk' },
    { value: 'long01',  label: 'Long A' },
    { value: 'long02',  label: 'Long B' },
    { value: 'long03',  label: 'Long C' },
    { value: 'long04',  label: 'Long D' },
    { value: 'long05',  label: 'Long E' },
    { value: 'long06',  label: 'Pigtails' },
    { value: 'long07',  label: 'Ponytail' },
  ],
  hairColor: [
    { value: '000000', label: 'Black' },
    { value: '5b3a29', label: 'Brown' },
    { value: 'd2691e', label: 'Auburn' },
    { value: 'f4a460', label: 'Blonde' },
    { value: 'cfcfcf', label: 'Silver' },
    { value: 'ff7b7b', label: 'Coral' },
    { value: 'c8b6ff', label: 'Lavender' },
    { value: 'b8e0d2', label: 'Mint' },
  ],
  eyes: [
    { value: 'variant01', label: 'Round' },
    { value: 'variant02', label: 'Sleepy' },
    { value: 'variant03', label: 'Wink' },
    { value: 'variant04', label: 'Sharp' },
    { value: 'variant05', label: 'Wide' },
    { value: 'variant06', label: 'Squint' },
  ],
  eyesColor: [
    { value: '5b3a29', label: 'Brown' },
    { value: '4a6b8a', label: 'Blue' },
    { value: '3d6b3d', label: 'Green' },
    { value: '6b4a8a', label: 'Violet' },
    { value: '2d2d44', label: 'Ink' },
  ],
  mouth: [
    { value: 'happy01', label: 'Smile' },
    { value: 'happy02', label: 'Grin' },
    { value: 'happy03', label: 'Smirk' },
    { value: 'sad01',   label: 'Pout' },
    { value: 'sad02',   label: 'Flat' },
  ],
  accessories: [
    { value: 'none',       label: 'None' },
    { value: 'variant01',  label: 'Glasses' },
    { value: 'variant02',  label: 'Headband' },
    { value: 'variant03',  label: 'Eyepatch' },
    { value: 'variant04',  label: 'Earring' },
  ],
};

// Default config = "blank slate" first-time character
export const DEFAULT_CONFIG = {
  skinColor:   'ffe4c0',
  hair:        'short01',
  hairColor:   '5b3a29',
  eyes:        'variant01',
  eyesColor:   '5b3a29',
  mouth:       'happy01',
  accessories: 'none',
};

// Build the Dicebear URL from a config object
export function avatarUrl(config, size = 96) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(config)) {
    if (key === 'accessories' && value === 'none') {
      params.set('accessoriesProbability', '0');
    } else {
      params.set(key, value);
      if (key === 'accessories') params.set('accessoriesProbability', '100');
    }
  }
  params.set('size', String(size * 2)); // 2x for retina, scaled by CSS
  return `https://api.dicebear.com/9.x/pixel-art/svg?${params.toString()}`;
}

// Parse stored config (it's JSON in users.avatar_seed)
export function parseConfig(stored) {
  if (!stored) return DEFAULT_CONFIG;
  try {
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // Legacy: if avatar_seed is still a plain seed string from old code,
    // treat as default config. Migrate on next save.
    return DEFAULT_CONFIG;
  }
}

export function serializeConfig(config) {
  return JSON.stringify(config);
}

// Pick a random preset for every trait
export function randomize(config = DEFAULT_CONFIG) {
  const next = { ...config };
  for (const key of Object.keys(TRAITS)) {
    const opts = TRAITS[key];
    next[key] = opts[Math.floor(Math.random() * opts.length)].value;
  }
  return next;
}
