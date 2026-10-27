# 🦄 Pony Notebook  (React + Vite, Vercel + Supabase)

## 1. Supabase (2 min)
1. Create a project at supabase.com.
2. SQL Editor -> New query -> paste `supabase/schema.sql` -> Run.
3. Project Settings -> API: copy the **Project URL** and the **service_role** key.

## 2. Credentials
Edit the `.env` file in this folder and fill in the three values:
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NOTEBOOK_PASSWORD
- `.env` is gitignored, so it will not be pushed to GitHub. Never commit it.
- Vercel does NOT read `.env` on deploy: add the same three values under
  Project -> Settings -> Environment Variables.

## 3. Run locally
    npm install
    npx vercel dev        # runs the React app AND the /api functions, reading .env
(`npm run dev` alone only starts the front end; the API needs `vercel dev`.)

## 4. Deploy
Push this folder to GitHub -> Vercel -> Add New Project -> import.
Vercel auto-detects Vite. Add the 3 environment variables, then Deploy.

## Stable wget links (public, content only)
    wget -O page.txt "https://YOUR-SITE.vercel.app/p/<pageid>.txt"
The page id never changes. Use the "Copy wget" button on each page.
Anyone with the link can read that page (ids are random 12-char strings).
Listing, editing and deleting need the password.

## Themes
Pick one in the sidebar: Galaxy, Pastel, Sunset, Mint, Neon.
To make your own, add a `[data-theme="mine"]` block in `src/styles.css`.

## Project layout
    src/App.jsx    the notebook UI
    src/api.js     fetch helper + password
    src/zip.js     "download all" zip writer
    src/styles.css themes + layout
    api/*.js       Vercel serverless functions (talk to Supabase)
    lib/db.js      Supabase + auth helpers
    supabase/schema.sql
Pages up to about 4 MB of text work (Vercel request limit is 4.5 MB).
