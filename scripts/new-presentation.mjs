import fs from "node:fs";
import path from "node:path";
import minimist from "minimist";
import { PRESENTATIONS_DIR, ensurePresentationsDir } from "./lib.mjs";

const argv = minimist(process.argv.slice(2));
const slug = String(argv.slug || argv.s || "").trim();
const title = String(argv.title || argv.t || "").trim();

if (!slug || !title) {
  console.error(
    'Usage: npm run new:presentation -- --slug my-talk --title "My Talk"'
  );
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error("Slug must contain only lowercase letters, numbers, and dashes.");
  process.exit(1);
}

ensurePresentationsDir();
const deckDir = path.join(PRESENTATIONS_DIR, slug);
if (fs.existsSync(deckDir)) {
  console.error(`Deck "${slug}" already exists at presentations/${slug}.`);
  process.exit(1);
}

const files = [
  ["slides.md", slidesTemplate(title, slug)],
  ["README.md", readmeTemplate(title, slug)],
  ["notebooks/README.md", notebookTemplate()],
  ["demos/README.md", demosTemplate()],
  ["assets/.gitkeep", ""]
];

for (const [relativeFile, content] of files) {
  const outPath = path.join(deckDir, relativeFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, "utf8");
}

console.log(`Created deck: presentations/${slug}`);
console.log(`Run: npm run dev -- --deck ${slug}`);

function slidesTemplate(deckTitle, deckSlug) {
  return `---
theme: default
title: ${deckTitle}
info: ${deckTitle} by Younes
class: text-left
drawings:
  persist: false
transition: slide-left
mdc: true
---

# ${deckTitle}

<div class="hero-subtitle">A living deck from your presentation engine</div>

---
layout: two-cols
---

## Why this deck exists

- Markdown-first writing
- Art direction via shared styles
- Easy custom interactivity when needed

::right::

\`\`\`bash
npm run dev -- --deck ${deckSlug}
\`\`\`

---

## Notebook + demo block

- Notebook folder: \`./notebooks\`
- Demo folder: \`./demos\`
- Share download and Colab links directly in slides

<a class="pill-link" href="./notebooks/" target="_blank">Download notebooks</a>

---

# Thank you

<div class="hero-subtitle">Now go make something beautiful.</div>

<style>
@import url("../../engine/styles/artsy.css");
</style>
`;
}

function readmeTemplate(deckTitle, deckSlug) {
  return `# ${deckTitle}

## Run

\`\`\`bash
npm run dev -- --deck ${deckSlug}
\`\`\`

## Build

\`\`\`bash
npm run build -- --deck ${deckSlug}
\`\`\`
`;
}

function notebookTemplate() {
  return `Place your .ipynb files here.

Recommended links to include in slides:

- Direct download: ./notebooks/<file>.ipynb
- Colab: https://colab.research.google.com/github/<owner>/<repo>/blob/main/presentations/<slug>/notebooks/<file>.ipynb
`;
}

function demosTemplate() {
  return `Place custom live demo files here.

You can embed demos in slides with iframe or custom Vue components.
`;
}
