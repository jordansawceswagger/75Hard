# Gotchas

Known weird shit that will trip you up. Organized by where you'll hit them.

---

## iOS Safari / PWA quirks

### Audio won't play until first user tap
iOS Safari blocks `Audio.play()` until the user has interacted with the page. The `sfx.play()` helper swallows the autoplay-blocked error silently. After the first tap on any button, audio works for the rest of the session.

**Symptom:** You think sound is broken on initial app load.
**Fix:** Tap anything. It works after.

### `window.navigator.standalone` is iOS-only
Detecting "is this PWA installed" needs both checks:
```js
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || window.navigator.standalone;
```
The `||` matters — neither check alone covers both platforms.

### iOS Safari URL bar covers content
On iPhone, Safari's URL bar takes ~50px at the top. Use `100dvh` (dynamic viewport height) instead of `100vh` to handle this correctly when the bar collapses on scroll.

### Safe-area insets for the notch
iPhone X+ phones have a notch and home-bar inset area. Add to your root container:
```css
padding-top: max(16px, env(safe-area-inset-top));
padding-bottom: max(16px, env(safe-area-inset-bottom));
```
Otherwise the bottom nav gets eaten by the home indicator.

### iOS storage eviction
If a PWA sits unused for ~7 weeks, iOS may clear localStorage, IndexedDB, and the cache storage. Users will be signed out and have to re-magic-link. Irrelevant for daily-use apps.

### "Add to Home Screen" only works in Safari
Chrome on iOS does NOT support adding PWAs to the home screen — even though Chrome on Android does. If a friend says "the install thing isn't working" — first ask if they're in Safari.

### Photo capture rotation
iPhone photos have EXIF orientation metadata. When you draw a raw photo file to a canvas, it may appear rotated wrong (sideways or upside-down). The current `pixelate()` function doesn't handle this — if you see rotated photos, add EXIF correction with the `exif-js` library or use `createImageBitmap()` with `imageOrientation: 'from-image'` (Safari 14+).

### PWA splash screen color
The splash background color is controlled by `background_color` in the manifest. iOS uses this for the launch screen. It must match your CSS background or you'll see a flash on app launch.

---

## Supabase

### RLS errors are silent in the wrong way
When RLS blocks a query, you get `data: []` (empty array) and `error: null`. You won't see a permission denied error — it just looks like no data. If a `select` is returning empty unexpectedly, check RLS first.

### Magic-link emails go to spam
Supabase's default sender is `noreply@mail.supabase.io`. Gmail/Outlook frequently spam-filter it on first send. Tell your friends to check spam folder once.

### Free-tier email rate limit
Supabase free tier limits auth emails to ~30/hour. Plenty for 4 friends, but if you're rapidly testing sign-in flows, you'll get rate-limited. Wait an hour or use a paid SMTP provider.

### `auth.uid()` returns null when run from dashboard SQL editor
You're signed into the dashboard with a different session than the app. To test RLS as a specific user, use the Supabase impersonation feature or just delete/insert through the Table Editor.

### Storage signed URLs expire
The `createSignedUrl(path, 3600)` URL expires in 1 hour. Don't store signed URLs in the DB — store the path, generate URL at display time.

### Storage policies need `storage.foldername()` for path checks
To restrict uploads to a user's own folder, the policy uses:
```sql
(storage.foldername(name))[1] = auth.uid()::text
```
The `[1]` is 1-indexed and grabs the first folder in the path. Easy to forget.

### `upsert` requires matching unique constraint
`supabase.from('x').upsert(data, { onConflict: 'col1,col2' })` requires `(col1, col2)` to be a UNIQUE constraint in the database. If it's not, the upsert will insert duplicates instead.

### Realtime needs Replication enabled per table
Realtime subscriptions don't fire unless Replication is enabled for the table. Supabase dashboard → Database → Replication → toggle the table.

---

## Vite / Build

### Env vars need `VITE_` prefix
`import.meta.env.VITE_FOO` works. `import.meta.env.FOO` is undefined in client code. Easy mistake when migrating from Create React App where `REACT_APP_` was the prefix.

### `npm run dev --host` exposes to local network
You need `--host` (or `--host 0.0.0.0`) to access from your phone on the same WiFi. Without it, the server only binds to localhost.

### Vite dev server is HTTP, not HTTPS
Some browser APIs require HTTPS (camera, notifications, service worker). On localhost they work over HTTP, but if you're testing from another device via local IP, you'll hit HTTPS-required errors. Workarounds:
- Use ngrok or Cloudflare Tunnel to expose your dev server via HTTPS
- Use `vite-plugin-mkcert` for local HTTPS
- Just test on the deployed Cloudflare URL

### Service worker won't update in dev
Vite-plugin-pwa disables SW in dev mode. To test SW behavior, run `npm run build && npm run preview`.

### Build hash invalidation
vite-plugin-pwa includes a hash in the SW name on each build. Old SWs auto-update. If you ever see "stuck on old version" — hard refresh (Ctrl+Shift+R) or unregister the SW manually in DevTools.

---

## Cloudflare Pages

### Build fails on Cloudflare, works locally
Usually Node version mismatch. Set `NODE_VERSION` env var in Cloudflare to match your local `node -v`.

### Env vars must be set in both Production AND Preview
If you set `VITE_SUPABASE_URL` only in Production, your preview branches won't have it. Set it in both, or use `Plain text` (not `Secret`) so it shares across environments.

### First request after deploy is slow
Cloudflare's free tier has cold-start latency on first request. 1-2 second delay, then warm.

### Custom domain DNS propagation
After adding a custom domain, DNS can take 1-60 minutes to propagate. If your custom domain isn't loading, wait. Check `dig your-domain.com` to see if DNS has updated.

---

## React / Component-level

### React StrictMode double-renders
In dev, `<StrictMode>` makes useEffect run twice. If you see two of every Supabase query in dev, that's why. Either remove StrictMode or guard your effects with a ref. Production builds don't double-render.

### `crypto.randomUUID()` requires HTTPS or localhost
It works on localhost but if you're testing via local IP over HTTP, `crypto.randomUUID()` is undefined. Use a fallback or test over HTTPS.

### Dicebear API can be slow on cold load
First avatar fetch can take 500ms-2s on a slow network. The service worker caches them after first load, but the initial empty state is jarring. Consider a loading placeholder.

### `input type="file" accept="image/*" capture="environment"` quirks
- `capture` is a hint, not a guarantee. iOS Safari respects it (opens rear camera). Desktop browsers ignore it.
- On iOS, this opens the system camera UI directly, no choice between camera/library. To give choice, omit `capture`.

---

## NES.css specifically

### NES.css fonts override your CSS
If you set `font-family` on an element and it doesn't apply, NES.css probably injected its own. Use inline styles or `!important` on parent containers.

### `.nes-container` has fixed white background
The white `background-color: #fff` is the default. To match the cream palette, override with `!important` in `index.css` (already done in `02-design-system.md`).

### `.nes-btn` text alignment is weird
The button text sits slightly above center due to the pixel font baseline. Don't try to fix it — it's part of the look.

### `.nes-input` is hard to style
Inputs from NES.css come with chunky borders that match the buttons. Don't try to make them slim — they should be chunky.

---

## Sound

### Multiple rapid taps cause audio overlap weirdness
The `cache[name].currentTime = 0` reset before `.play()` makes the same sound restart on rapid tap. This is intentional — the alternative is queueing or muting subsequent plays, which feels worse.

### .wav files vs .mp3
.wav is uncompressed but tiny for short SFX. .mp3 is compressed but adds ~100ms of silence padding on iOS Safari (annoying for instant feedback). Stick with .wav.

---

## When things break in production specifically

### "It works locally but not on Cloudflare"
1. Env vars — set in Cloudflare with VITE_ prefix?
2. Supabase Redirect URLs — does it include the prod domain?
3. Service worker cache — hard refresh / unregister SW
4. Node version — set NODE_VERSION env var

### "Magic link sends but redirects to 404"
Supabase Site URL or Redirect URLs don't include your prod domain. Fix in Supabase dashboard → Authentication → URL Configuration.

### "Photos won't upload"
Most likely: Storage policy doesn't allow the auth user to upload to their folder. Check that `(storage.foldername(name))[1] = auth.uid()::text` policy is active.

### "Friend can't sign in / no email arriving"
1. Check spam folder
2. Check Supabase Auth → Users — was their email captured?
3. Check Supabase Auth → Logs — any errors?
4. Free-tier rate limit (30/hr) hit?
