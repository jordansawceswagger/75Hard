# 09 — PWA Config

## GOAL

The app is installable on iOS and Android with a proper icon, opens fullscreen (no Safari URL bar) once added to home screen, has a service worker that caches the shell for offline launch, and shows the cream background as a splash screen.

---

## STEPS

### 1. Generate the icons

You need 4 sizes minimum:
- `apple-touch-icon.png` — 180×180 (iOS home screen)
- `pwa-192x192.png` — 192×192 (Android, manifest)
- `pwa-512x512.png` — 512×512 (Android maskable, splash)
- `favicon.ico` — 32×32 (browser tab)

Make these pixel-art obvious. Quick paths:
- Aseprite (paid, $20) or Piskel (free, browser-based) — pixel directly at 64×64, then upscale with nearest-neighbor to all sizes
- Or: Midjourney/DALL-E prompt: `"8-bit pixel art icon for a fitness tracking app, 75 in chunky pixels, peach and lavender palette, retro game cartridge style, simple, centered, plain background"` — then run through https://www.pixelied.com/photo-editor/pixel-art

Save all 4 into `public/`.

### 2. Configure vite-plugin-pwa

Replace `vite.config.js` with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'sfx/*.wav'],
      manifest: {
        name: '75 HARD',
        short_name: '75 HARD',
        description: 'A pixel-art 75 Hard tracker for you and your party.',
        theme_color: '#FFB5A7',
        background_color: '#FFF4E0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,wav,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dicebear-avatars',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/nes\.css.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nes-css',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
```

### 3. Register the service worker

Vite-plugin-pwa with `registerType: 'autoUpdate'` injects this automatically. No code changes needed in `main.jsx`.

But for the "update available, reload?" UX, add this to `src/main.jsx`:

```jsx
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    // Could show a UI prompt; for v1 just auto-reload after 2s
    if (confirm('New version available. Reload?')) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});
```

### 4. Verify the manifest in dev

```bash
npm run build
npm run preview
```

Open the preview URL on your phone (you'll need to use the `--host` flag and the IP). Chrome dev tools or Safari Web Inspector → Application → Manifest — should show your manifest fields. Application → Service Workers — should show the SW registered.

### 5. Test "Add to Home Screen" on iPhone

1. Open the deployed URL (or preview build via local IP) in Safari on iPhone
2. Tap Share → scroll down → "Add to Home Screen"
3. Confirm the icon is your apple-touch-icon.png
4. Tap the icon on home screen — app should open with:
   - No URL bar
   - No Safari chrome
   - Cream splash screen
   - Goes straight into the app
5. Force-quit Safari, force-quit the PWA — relaunch the PWA — should still open (service worker caches the shell)

---

## DONE WHEN

- [ ] All 4 icon files exist in `public/`
- [ ] `vite.config.js` includes VitePWA plugin with the manifest
- [ ] `npm run build` succeeds without warnings
- [ ] `npm run preview` shows manifest + service worker in browser dev tools
- [ ] Installed PWA on iPhone opens fullscreen
- [ ] App launches when phone is in airplane mode (cached shell works)

---

## GOTCHAS

- **Icons MUST be PNG with no alpha for iOS.** iOS will reject transparent icons silently and use a default white square. Test by adding to home screen and checking what icon shows up.
- **The cream splash screen color** comes from `background_color` in the manifest. iOS uses `apple-mobile-web-app-status-bar-style="default"` (set in step 00) which respects this.
- **Service worker won't update automatically in dev mode.** You have to test SW behavior via `npm run preview` or after deploying. In dev (`npm run dev`), the SW is disabled by default.
- **iOS PWA storage eviction**: if no one opens the app for ~7 weeks, iOS may clear local data (cached SW, localStorage). Daily users will never hit this.
- **`registerType: 'autoUpdate'`** means new versions install silently on next page load. Combined with the `confirm()` prompt, the user gets asked before reload. If you'd rather just silent-update, remove the confirm.

---

## NEXT

`build/10-deploy.md` — ship it to Cloudflare Pages, configure custom domain (optional), set up GitHub auto-deploy.
