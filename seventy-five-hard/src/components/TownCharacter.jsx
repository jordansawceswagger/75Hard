// Sprite character rendered from the 2-frame x 4-direction sheet
// (/town/character.png). Position is given in px within the world layer; a CSS
// transition tweens the glide between tiles while `frame` toggles the walk cycle.
const DIR_ROW = { down: 0, up: 1, left: 2, right: 3 };

export default function TownCharacter({ dir = 'down', frame = 0, leftPx, topPx, sizePx, stepMs, idle = false }) {
  return (
    <div
      aria-hidden="true"
      className={idle ? 'character-idle' : undefined}
      style={{
        position: 'absolute',
        left: leftPx,
        top: topPx,
        width: sizePx,
        height: sizePx,
        backgroundImage: 'url(/town/character.png)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '200% 400%',
        backgroundPositionX: `${frame * 100}%`,
        backgroundPositionY: `${(DIR_ROW[dir] / 3) * 100}%`,
        imageRendering: 'pixelated',
        transition: `left ${stepMs}ms linear, top ${stepMs}ms linear`,
        pointerEvents: 'none',
        zIndex: 5,
        filter: 'drop-shadow(1px 2px 0 rgba(45,45,68,0.35))',
      }}
    />
  );
}
