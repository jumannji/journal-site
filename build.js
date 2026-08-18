#!/usr/bin/env node
// Static site builder for the journal. No dependencies on purpose.
// Reads entries/*.md -> writes docs/index.html + docs/entries/*.html
// (output dir is "docs" so GitHub Pages can serve it straight from main branch)

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ENTRIES_DIR = path.join(ROOT, "entries");
const PUBLIC_DIR = path.join(ROOT, "docs");
const OUT_ENTRIES_DIR = path.join(PUBLIC_DIR, "entries");

fs.mkdirSync(OUT_ENTRIES_DIR, { recursive: true });

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Minimal inline markdown: **bold**, *italic*, [text](url)
function inline(md) {
  let s = escapeHtml(md);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const safeUrl = url.replace(/"/g, "%22");
    return `<a href="${safeUrl}">${text}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return s;
}

// Minimal block markdown: paragraphs and "- " bullet lists.
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let para = [];
  let list = [];

  function flushPara() {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  }
  function flushList() {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
      list = [];
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return out.join("\n");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const [, fm, body] = match;
  const meta = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = value;
  }
  return { meta, body };
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, "");
}

function pageShell({ title, active, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${active === "home" ? "" : "../"}style.css">
</head>
<body>
<div class="crt">

<marquee class="topbar" scrollamount="4">*** WELCOME TO NIKA'S JOURNAL *** BEST VIEWED AT 800x600 *** NOW WITH 100% MORE PIXELS *** SIGN THE GUESTBOOK *** ***</marquee>

<div class="page">
  <table class="window" cellspacing="0" cellpadding="0">
    <tr>
      <td class="titlebar">
        <span>📔 nika's-journal.exe</span>
        <span class="winbtns"><span>_</span><span>□</span><span class="close">✕</span></span>
      </td>
    </tr>
    <tr>
      <td class="content">

        <div class="banner">
          <h1>✦ MY ONLINE JOURNAL ✦</h1>
          <p class="tagline">&lt;&lt; est. 2026 :: thoughts.exe :: private-ish &gt;&gt;</p>
        </div>

        <div class="navbar">
          <a href="${active === "home" ? "" : "../"}index.html" ${active === "home" ? 'class="active"' : ""}>[ HOME ]</a>
          <span class="sep">|</span>
          <a href="mailto:nikagogava00@gmail.com">[ EMAIL ME ]</a>
          <span class="sep">|</span>
          <span class="blink">[ NEW ENTRY! ]</span>
        </div>

        <hr class="dashed">

        ${body}

        <hr class="dashed">

        <div class="footer">
          <div class="counter">
            <span>VISITORS:</span>
            <span id="counter" class="digits">000000</span>
          </div>
          <p class="under-construction">🚧 always under construction 🚧</p>
          <p class="webring">&lt;-- [webring] --&gt;&nbsp;&nbsp;[best viewed in Netscape Navigator]&nbsp;&nbsp;&lt;-- [webring] --&gt;</p>
        </div>

      </td>
    </tr>
  </table>
</div>

</div>
<script src="${active === "home" ? "" : "../"}script.js"></script>
</body>
</html>
`;
}

function buildEntryCard(meta, slug, excerptHtml) {
  return `<div class="entry-card">
  <div class="entry-meta">
    <span class="entry-date">📅 ${escapeHtml(meta.date || "")}</span>
    ${meta.mood ? `<span class="entry-mood">mood: ${escapeHtml(meta.mood)}</span>` : ""}
  </div>
  <h2 class="entry-title"><a href="entries/${slug}.html">${escapeHtml(meta.title || slug)}</a></h2>
  <div class="entry-excerpt">${excerptHtml}</div>
  <a class="readmore" href="entries/${slug}.html">[ read more &gt;&gt; ]</a>
</div>`;
}

function main() {
  const files = fs
    .readdirSync(ENTRIES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse(); // newest filename first (dates prefixed)

  const cards = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ENTRIES_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const slug = slugFromFilename(file);
    const html = markdownToHtml(body);

    const entryBody = `
        <div class="entry-full">
          <div class="entry-meta">
            <span class="entry-date">📅 ${escapeHtml(meta.date || "")}</span>
            ${meta.mood ? `<span class="entry-mood">mood: ${escapeHtml(meta.mood)}</span>` : ""}
          </div>
          <h1 class="entry-title">${escapeHtml(meta.title || slug)}</h1>
          ${html}
        </div>
        <p><a href="../index.html">[ &lt;&lt; back to journal ]</a></p>`;

    fs.writeFileSync(
      path.join(OUT_ENTRIES_DIR, `${slug}.html`),
      pageShell({ title: `${meta.title || slug} :: nika's journal`, active: "entry", body: entryBody })
    );

    const excerptSource = body.trim().split("\n\n")[0] || "";
    const excerptHtml = markdownToHtml(
      excerptSource.length > 220 ? excerptSource.slice(0, 220) + "..." : excerptSource
    );
    cards.push(buildEntryCard(meta, slug, excerptHtml));
  }

  const homeBody = `
        <div class="entries-list">
          ${cards.join("\n") || "<p>No entries yet. Add a .md file to entries/ and rebuild!</p>"}
        </div>`;

  fs.writeFileSync(
    path.join(PUBLIC_DIR, "index.html"),
    pageShell({ title: "nika's journal", active: "home", body: homeBody })
  );

  console.log(`Built ${files.length} entr${files.length === 1 ? "y" : "ies"} -> docs/`);
}

main();
