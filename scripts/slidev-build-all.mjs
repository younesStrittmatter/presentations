import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, listDecks } from "./lib.mjs";

const basePrefix = process.env.BASE_PREFIX || "";
const decks = listDecks();
if (!decks.length) {
  console.error("No decks found in presentations/. Create one first.");
  process.exit(1);
}

for (const deck of decks) {
  console.log(`\nBuilding deck: ${deck}`);
  const args = ["run", "build", "--", "--deck", deck];
  if (basePrefix) {
    args.push("--base-prefix", basePrefix);
  }

  const result = spawnSync("npm", args, {
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const indexHtml = renderIndex(decks);
const indexPath = path.join(ROOT, "dist", "index.html");
fs.mkdirSync(path.dirname(indexPath), { recursive: true });
fs.writeFileSync(indexPath, indexHtml, "utf8");
console.log("\nGenerated dist/index.html");

function renderIndex(deckSlugs) {
  const list = deckSlugs
    .map(
      (slug, idx) => `<a class="card" href="./${slug}/">
          <span class="chip">#${String(idx + 1).padStart(2, "0")}</span>
          <h2>${humanize(slug)}</h2>
          <p>Open deck</p>
        </a>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Presentation Engine</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Manrope:wght@400;600&display=swap" rel="stylesheet" />
    <style>
      :root{
        color-scheme: dark;
        --bg:#090611;
        --ink:#f6f0ff;
        --soft:#cdb5ff;
        --glow:#57f5ff;
        --card:#121021cc;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Manrope", sans-serif;
        background:
          radial-gradient(70rem 42rem at 95% 0%, #2f245fcc, transparent 56%),
          radial-gradient(50rem 36rem at -10% 100%, #492e66b3, transparent 58%),
          var(--bg);
        color: var(--ink);
      }
      main {
        width: min(1100px, 92vw);
        margin: 8vh auto;
      }
      h1 {
        font-family: "Cormorant Garamond", serif;
        font-size: clamp(2.6rem, 7vw, 5rem);
        line-height: 0.95;
        margin: 0;
        letter-spacing: 0.01em;
      }
      .sub {
        margin: 1rem 0 2rem;
        color: #e8dcffcc;
        max-width: 48ch;
      }
      .grid {
        display: grid;
        gap: 0.9rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }
      .card {
        background: var(--card);
        border: 1px solid #ffffff2e;
        border-radius: 20px;
        padding: 1rem 1rem 1.1rem;
        text-decoration: none;
        color: var(--ink);
        backdrop-filter: blur(7px);
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }
      .card:hover {
        transform: translateY(-3px);
        border-color: #ffffff66;
        box-shadow: 0 12px 28px #00000059, 0 0 24px #57f5ff22;
      }
      .chip {
        display: inline-block;
        font-size: 0.78rem;
        letter-spacing: .06em;
        color: var(--glow);
      }
      h2 {
        margin: 0.35rem 0 0.4rem;
        font-family: "Cormorant Garamond", serif;
        font-size: 1.6rem;
      }
      p {
        margin: 0;
        color: var(--soft);
        font-size: .92rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Presentation Gallery</h1>
      <p class="sub">A curated collection of visual talks, interactive demos, and computational storytelling.</p>
      <section class="grid">
${list}
      </section>
    </main>
  </body>
</html>`;
}

function humanize(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
