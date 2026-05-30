# 00 — Setup

## GOAL

Scaffold a working Vite + React project with all dependencies installed, a Supabase project created (empty), and a GitHub repo pushed. End state: `npm run dev` opens a blank React page on `localhost:5173` and you can sign in to Supabase dashboard.

---

## STEPS

### 1. Create the Vite app

```bash
npm create vite@latest seventy-five-hard -- --template react
cd seventy-five-hard
npm install
```

Why not TypeScript: speed of v1, you can refactor later. Why "seventy-five-hard" not "75-hard": npm package names can't start with a number.

### 2. Install runtime deps

```bash
npm install @supabase/supabase-js react-router-dom
```

### 3. Install dev deps (PWA + types if you want them later)

```bash
npm install -D vite-plugin-pwa
```

### 4. Add NES.css + fonts via index.html

Open `index.html` and replace the contents of `<head>` with:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
<meta name="theme-color" content="#FFB5A7" />

<!-- iOS PWA -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="75 HARD" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- NES.css + fonts -->
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
<link href="https://unpkg.com/nes.css@latest/css/nes.min.css" rel="stylesheet" />

<title>75 HARD</title>
```

### 5. Create the env file

```bash
touch .env.local
echo ".env.local" >> .gitignore
```

Add the placeholders (you'll fill these in step 01-supabase):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Create Supabase project

1. Go to https://supabase.com → sign up if needed (free)
2. New project → name it `75-hard` → set a strong DB password (save it in a password manager)
3. Region: pick closest to you (e.g. `us-west-1`)
4. Wait ~2 min for provisioning
5. Settings → API → copy the **Project URL** and **anon public key** into `.env.local`

### 7. Create the GitHub repo

```bash
git init
git add .
git commit -m "scaffold: vite + react + nes.css"
gh repo create seventy-five-hard --private --source=. --push
```

If you don't have `gh` CLI, create the repo via github.com UI and add as remote manually.

### 8. Smoke test

```bash
npm run dev -- --host
```

Open `http://localhost:5173` in a browser — you should see the default Vite page. Then on your phone (same WiFi), open the IP address Vite prints (something like `http://192.168.1.42:5173`) and confirm it loads.

---

## DONE WHEN

- [ ] `npm run dev -- --host` shows the Vite welcome page on desktop AND phone
- [ ] `.env.local` has real Supabase URL and anon key
- [ ] `.env.local` is in `.gitignore` (verify: `git status` should NOT list it)
- [ ] GitHub repo exists and has at least one commit pushed
- [ ] Supabase dashboard loads at supabase.com/dashboard with your project visible

---

## NEXT

`build/01-supabase.md` — create the database schema, RLS policies, and storage bucket for photos.
