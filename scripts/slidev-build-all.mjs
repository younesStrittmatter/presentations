import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, listDecks, deckGroupKey } from "./lib.mjs";

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

const deckCards = decks.map((slug) => readDeckCard(slug));
const visibleCards = deckCards.filter((card) => !card.hidden);
const feedbackConfig = readFeedbackConfig();
const indexHtml = renderIndexGrouped(visibleCards, feedbackConfig);
const indexPath = path.join(ROOT, "dist", "index.html");
fs.mkdirSync(path.dirname(indexPath), { recursive: true });
fs.writeFileSync(indexPath, indexHtml, "utf8");
console.log("\nGenerated dist/index.html");

function renderIndexGrouped(cards, feedback) {
  if (!cards.length) {
    return renderIndexShell(
      `<p class="sub">No public talks in the gallery yet. Decks with <code>hidden: true</code> in <code>presentation.config.json</code> stay in the repo but are not listed here.</p>`
    );
  }
  const sorted = [...cards].sort((a, b) => a.slug.localeCompare(b.slug));
  const groups = new Map();
  for (const card of sorted) {
    const key = deckGroupKey(card.slug);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }
  const order = [...groups.keys()].sort((a, b) => {
    if (a === "") return -1;
    if (b === "") return 1;
    return a.localeCompare(b);
  });

  const sections = order
    .map((key) => {
      const items = groups.get(key);
      const title =
        key === ""
          ? "Standalone talks"
          : breadcrumbTitle(key);
      const grid = items
        .map(
          (card, idx) => `<article class="card">
          <span class="chip">#${String(idx + 1).padStart(2, "0")}</span>
          <p class="meta path">${escapeHtml(card.slug)}</p>
          <h2>${escapeHtml(card.title)}</h2>
          ${card.subtitle ? `<p class="meta blurb">${escapeHtml(card.subtitle)}</p>` : ""}
          <p class="meta">${escapeHtml(card.presentedAt || "Date TBD")} · ${escapeHtml(card.presentedWhere || "Location TBD")}</p>
          <p class="meta">${escapeHtml(card.occasion || "Occasion TBD")}</p>
          <div class="actions">
            <a class="btn" href="./${encodePathForHref(card.slug)}/">Open</a>
            <a class="btn subtle" href="${buildFeedbackUrl(card, feedback)}" target="_blank" rel="noopener noreferrer">Add feedback</a>
          </div>
        </article>`
        )
        .join("\n");
      return `<section class="series-block">
      <h2 class="series-title">${escapeHtml(title)}</h2>
      <div class="grid">
${grid}
      </div>
    </section>`;
    })
    .join("\n");

  return renderIndexShell(sections);
}

function encodePathForHref(slug) {
  return String(slug)
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function breadcrumbTitle(groupKey) {
  return groupKey
    .split("/")
    .map((seg) => humanize(seg))
    .join(" · ");
}

function renderIndexShell(sectionsHtml) {
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
      .series-block {
        margin-bottom: 2.5rem;
      }
      .series-title {
        font-family: "Cormorant Garamond", serif;
        font-size: 1.45rem;
        margin: 0 0 0.85rem;
        color: #e8dcff;
        font-weight: 600;
      }
      .path {
        font-size: 0.78rem;
        color: #9a8bc4;
        letter-spacing: 0.02em;
      }
      .blurb {
        margin: 0.35rem 0 0;
        color: #d4c8ffcc;
        font-size: 0.9rem;
        line-height: 1.35;
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
      .meta {
        margin: 0.15rem 0 0;
        color: var(--soft);
        font-size: .92rem;
      }
      .actions {
        margin-top: 0.9rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .btn {
        display: inline-block;
        text-decoration: none;
        color: var(--ink);
        border: 1px solid #ffffff47;
        border-radius: 999px;
        padding: 0.36rem 0.72rem;
        font-size: 0.86rem;
      }
      .btn:hover {
        border-color: #ffffff99;
      }
      .btn.subtle {
        color: var(--glow);
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Presentation Gallery</h1>
      <p class="sub">A curated collection of visual talks, interactive demos, and computational storytelling.</p>
${sectionsHtml}
    </main>
  </body>
</html>`;
}

function readDeckCard(slug) {
  const talkSeg = slug.includes("/") ? slug.split("/").pop() : slug;
  const fallback = {
    slug,
    title: humanize(talkSeg || slug),
    titleShort: slug.replace(/\//g, "-"),
    presentedAt: "",
    presentedWhere: "",
    occasion: "",
    hidden: false,
    subtitle: ""
  };
  const configPath = path.join(ROOT, "presentations", ...slug.split("/"), "presentation.config.json");
  if (!fs.existsSync(configPath)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      slug,
      title: parsed.title || fallback.title,
      titleShort: parsed.titleShort || fallback.titleShort,
      presentedAt: parsed.presentedAt || "",
      presentedWhere: parsed.presentedWhere || "",
      occasion: parsed.occasion || "",
      hidden: Boolean(parsed.hidden),
      subtitle: typeof parsed.subtitle === "string" ? parsed.subtitle : ""
    };
  } catch {
    return fallback;
  }
}

function readFeedbackConfig() {
  const configPath = path.join(ROOT, "engine", "feedback.config.json");
  const fallback = {
    feedbackFormUrl: "https://tally.so/r/REPLACE_WITH_YOUR_FORM",
    feedbackFieldKey: "presentation"
  };
  if (!fs.existsSync(configPath)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return {
      feedbackFormUrl: parsed.feedbackFormUrl || fallback.feedbackFormUrl,
      feedbackFieldKey: parsed.feedbackFieldKey || fallback.feedbackFieldKey
    };
  } catch {
    return fallback;
  }
}

function buildFeedbackUrl(card, feedback) {
  const formBase = String(feedback.feedbackFormUrl || "").trim();
  if (!formBase) {
    return "#";
  }
  const separator = formBase.includes("?") ? "&" : "?";
  const key = encodeURIComponent(feedback.feedbackFieldKey || "presentation");
  const value = encodeURIComponent(card.titleShort || card.slug);
  return `${formBase}${separator}${key}=${value}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function humanize(slug) {
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
