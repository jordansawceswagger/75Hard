const cache = {};

function getAudio(name) {
  if (!cache[name]) {
    cache[name] = new Audio(`/sfx/${name}.wav`);
    cache[name].volume = 0.4;
  }
  return cache[name];
}

let enabled = true;

export const sfx = {
  setEnabled(v) { enabled = v; },
  play(name) {
    if (!enabled) return;
    const a = getAudio(name);
    a.currentTime = 0;
    a.play().catch(() => {}); // ignore iOS autoplay-blocked errors
  },
};
