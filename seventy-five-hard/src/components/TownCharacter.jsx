import { spriteUrl } from '../lib/species';

// The walking character is the player's species sprite at its current evolution
// stage (cub/sprout/beast by day). Glides between tiles and bobs when idle.
export default function TownCharacter({ species, day, leftPct, topPct, sizePct, stepMs, idle = false }) {
  return (
    <img
      src={spriteUrl(species, day)}
      alt=""
      aria-hidden="true"
      className={idle ? 'pixelated character-idle' : 'pixelated'}
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${sizePct}%`,
        height: `${sizePct}%`,
        imageRendering: 'pixelated',
        transition: `left ${stepMs}ms linear, top ${stepMs}ms linear`,
        pointerEvents: 'none',
        zIndex: 5,
        filter: 'drop-shadow(1px 2px 0 rgba(45,45,68,0.5))',
      }}
    />
  );
}
