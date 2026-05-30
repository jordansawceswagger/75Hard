# 10 — Deploy to Cloudflare Pages

## GOAL

Production URL live on Cloudflare Pages, auto-deploying from your GitHub `main` branch. Environment variables configured. Supabase redirect URLs updated to include the production domain.

---

## STEPS

### 1. Push your latest code

```bash
git add .
git commit -m "feat: ready for production"
git push origin main
```

### 2. Connect Cloudflare Pages to GitHub

1. Sign up / sign in at https://dash.cloudflare.com (free)
2. Workers & Pages → Create application → Pages → "Connect to Git"
3. Authorize Cloudflare for GitHub if first time
4. Select your `seventy-five-hard` repo

### 3. Configure the build

Cloudflare will detect Vite automatically. Confirm/override these:

- **Framework preset:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (leave default)
- **Node version:** Add an environment variable `NODE_VERSION` = `20` (or whatever your local `node -v` shows)

### 4. Add environment variables

In the build config screen → Environment variables → add:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | (paste from `.env.local`) |
| `VITE_SUPABASE_ANON_KEY` | (paste from `.env.local`) |

These have to be added in BOTH "Production" and "Preview" environments if you want PR previews to work.

### 5. Deploy

Click "Save and Deploy". First build takes ~2-3 min. You'll get a URL like `seventy-five-hard.pages.dev`.

### 6. Update Supabase redirect URLs

Critical step or auth will break on the live URL.

Supabase dashboard → Authentication → URL Configuration:
- **Site URL:** change to `https://seventy-five-hard.pages.dev`
- **Redirect URLs:** add `https://seventy-five-hard.pages.dev/**` (keep `http://localhost:5173/**` for local dev)

### 7. Test the live URL

1. Open `https://seventy-five-hard.pages.dev` on your phone in Safari
2. Sign in → check email → click magic link
3. Should redirect back to the live site and sign you in
4. Run through all 4 screens: Today, Party, Quest, Inventory
5. Add to Home Screen → confirm the installed PWA works

If the magic link redirects to localhost or 404s, you missed step 6.

### 8. (Optional) Custom domain

If you bought a domain:

1. Cloudflare Pages → your project → Custom domains → Set up a custom domain
2. Enter your domain (e.g. `75hard.party`)
3. Cloudflare will give DNS records — add them at your registrar
4. Once verified (~1-10 min), HTTPS auto-provisions
5. Update Supabase Site URL + Redirect URLs to use the custom domain

If you don't want to buy one, `seventy-five-hard.pages.dev` is fine.

### 9. Set up the auto-deploy workflow (already done!)

Cloudflare auto-deploys on every push to `main`. To deploy: `git push`. That's it.

To pause auto-deploy temporarily: project settings → Builds & deployments → Production branch → toggle off auto-deploy.

---

## DONE WHEN

- [ ] `https://[your-app].pages.dev` loads the app
- [ ] Magic-link sign-in works on the live URL
- [ ] All 4 screens function on the live URL
- [ ] PWA installs from the live URL and opens fullscreen
- [ ] Pushing a new commit to `main` triggers an automatic redeploy (watch in Cloudflare dashboard)

---

## GOTCHAS

- **Build failures on Cloudflare but works locally:** 90% of the time it's a Node version mismatch. Set `NODE_VERSION` env var explicitly to match local.
- **`VITE_` prefix is required** for env vars to be exposed to client code. If you accidentally name it `SUPABASE_URL`, the value will be `undefined` in production.
- **Cloudflare free tier:** unlimited bandwidth, 500 builds/month, 100 custom domains. You will never hit any of these limits.
- **First request after deploy might be slow** (~2 sec) due to cold cache. Subsequent requests are instant.
- **Service worker cache poisoning:** if a deploy ships with a bug, users may stay on the broken version until SW updates. Easy fix: include the build hash in the SW name (vite-plugin-pwa does this automatically with `registerType: 'autoUpdate'`).

---

## NEXT

`build/11-invite-friends.md` — the text message to send your 3 friends, with idiot-proof install instructions.
