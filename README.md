# nika's journal

A super old-school, 90s-computer-styled personal journal. Static site,
zero dependencies, entries are plain markdown files you edit by hand.

## Adding an entry

1. Create a new file in `entries/`, named like `YYYY-MM-DD-short-slug.md`
   (the date prefix controls sort order, newest first).
2. Use this format:

   ```
   ---
   title: My Entry Title
   date: 2026-08-18
   mood: optional, e.g. "tired but happy"
   ---

   Your entry text here. Supports **bold**, *italic*, [links](url),
   and "- " bullet lists. Separate paragraphs with a blank line.
   ```

3. Rebuild the site:

   ```
   node build.js
   ```

4. The generated site lands in `docs/` — open `docs/index.html`
   locally, or push to GitHub to publish.

## Previewing locally

```
cd docs && python3 -m http.server 8000
```

then visit http://localhost:8000

## Deploying (GitHub Pages)

One-time setup:

1. Create a new (empty, no README) repo on GitHub, e.g. `journal-site`.
2. In this folder, run:
   ```
   git remote add origin git@github.com:YOUR_USERNAME/journal-site.git
   git push -u origin main
   ```
3. On GitHub: repo → **Settings → Pages** → under "Build and deployment",
   set Source = "Deploy from a branch", Branch = `main`, Folder = `/docs`.
   Save.
4. Your site will be live in a minute or two at
   `https://YOUR_USERNAME.github.io/journal-site/`.

Publishing new entries after that:

```
node build.js
git add -A
git commit -m "new entry"
git push
```

GitHub Pages auto-updates within a minute of the push.
