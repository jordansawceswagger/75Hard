# Deploy — Cloudflare Pages (step 10)

The app is **deploy-ready**: production build is clean, a SPA fallback (`_redirects`)
and a pinned Node version (`.node-version` = 22) are committed. The rest is dashboard
work only you can do.

> ⚠️ **Correction vs `build/10-deploy.md`:** that doc assumes the repo root *is* the app
> and says **Root directory = `/`**. Ours is different — the repo is the whole project and
> the app lives in a subfolder. You **must set Root directory = `seventy-five-hard`**, or
> the build won't find `package.json`.

---

## 1. Connect Cloudflare Pages to the repo
1. Sign in at https://dash.cloudflare.com (free).
2. **Workers & Pages → Create → Pages → Connect to Git.**
3. Authorize GitHub if first time, then select repo **`jordansawceswagger/75Hard`**.

## 2. Build settings
| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | Vite |
| **Root directory** | **`seventy-five-hard`**  ← the important one |
| Build command | `npm run build` |
| Build output directory | `dist` |

Node version is already pinned by `seventy-five-hard/.node-version` (22), so you don't
need a `NODE_VERSION` env var. (Add one `= 22` only if a build ever complains.)

## 3. Environment variables (add to BOTH Production and Preview)
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://hkiipfkuzetoceaakgkh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_sxD7bXMS762UWwyF07Eekw_o4QTrcd6` |

(The `VITE_` prefix is required — without it the value is `undefined` in the browser.
These are the same values from `seventy-five-hard/.env.local`. The anon key is a client
key protected by RLS, so it's fine that it ships to the browser.)

## 4. Save & Deploy
First build ~2–3 min. You'll get a URL like `https://75hard.pages.dev` (or
`75-hard-xxx.pages.dev`). Note the exact URL.

## 5. Point Supabase auth at the live URL  (REQUIRED — or magic links break)
Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://<your-app>.pages.dev`
- **Redirect URLs:** add `https://<your-app>.pages.dev/**`  (keep `http://localhost:5173/**` for local dev)

## 6. Test the live URL
- Open it in Safari on your phone → sign in → magic link → it should redirect back to the
  live site and log you in (NOT localhost).
- Walk all screens: Today (town/camera), Party, Quest, Inventory.
- Share → Add to Home Screen → the pixel "75" icon → opens fullscreen, works offline.

## 7. Auto-deploy is automatic
Every `git push origin main` triggers a rebuild. Nothing else to wire up.

---

## 🔴 Before you share the URL with friends
Run the security SQL in **`SUPABASE-TASKS.md` §1** (the email allowlist + members-only
reads). Until then, anyone who finds the live URL can sign in and read everyone's data.
Add each friend's email to the `allowed_emails` insert first.

## Optional — custom domain
Cloudflare Pages → project → Custom domains → add your domain → set the DNS records it
gives you → update Supabase Site URL + Redirect URLs to the custom domain. `$0` path is
just using the `.pages.dev` URL.
