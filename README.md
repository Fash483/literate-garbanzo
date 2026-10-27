# 🦄 Pony Notebook (Vercel + Supabase)

## 1. Supabase (2 min)
1. Create a project at supabase.com.
2. SQL Editor -> New query -> paste `supabase/schema.sql` -> Run.
3. Project Settings -> API: copy the **Project URL** and the **service_role** key (keep it secret).

## 2. Vercel (2 min)
1. Put this folder in a GitHub repo, then Vercel -> Add New Project -> import it.
   (Or run `npx vercel` in this folder.)
2. Add Environment Variables:
   - `SUPABASE_URL`  = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = the service_role key
   - `NOTEBOOK_PASSWORD` = a password you choose
3. Deploy. Open the site, enter the password once (the browser remembers it).

## Stable wget links (public, content only)
    wget -O page.txt "https://YOUR-SITE.vercel.app/p/<pageid>.txt"
The page id never changes. Use the "Copy wget" button on each page.
Anyone with the link can read that page, so ids are random 12-character strings.
Everything else (list, edit, delete) needs the password.

## Notes
- Pages up to about 4 MB of text work (Vercel function body limit is 4.5 MB).
- Bookmarklet: drag the star link to your bookmarks bar, click it on any site,
  and that page's text becomes a new notebook page.
- The service_role key is only used in /api (server side) and never reaches the browser.
