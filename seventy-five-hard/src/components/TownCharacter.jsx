import { avatarUrl, parseConfig } from '../lib/character';

// The walking character IS the player's Dicebear pixel-art avatar — the same art
// as the customizable one in Profile/Party. It glides between tiles (CSS
// transition) and bobs when idle. No directional walk frames (Dicebear avatars
// are front-facing busts); the idle bob + movement give it life.
export default function TownCharacter({ config, leftPx, topPx, sizePx, stepMs, idle = false }) {
  return (
    <img
      src={avatarUrl(parseConfig(config), sizePx)}
      alt=""
      aria-hidden="true"
      className={idle ? 'pixelated character-idle' : 'pixelated'}
      style={{
        position: 'absolute',
        left: leftPx,
        top: topPx,
        width: sizePx,
        height: sizePx,
        transition: `left ${stepMs}ms linear, top ${stepMs}ms linear`,
        pointerEvents: 'none',
        zIndex: 5,
        filter: 'drop-shadow(1px 2px 0 rgba(45,45,68,0.5))',
      }}
    />
  );
}
