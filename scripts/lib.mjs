import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const PRESENTATIONS_DIR = path.join(ROOT, "presentations");

export function ensurePresentationsDir() {
  fs.mkdirSync(PRESENTATIONS_DIR, { recursive: true });
}

/**
 * Walk presentations/ recursively. A "deck" is any directory that contains slides.md
 * (leaf or not — if a folder has slides.md it counts). Relative path uses forward slashes.
 */
export function listDecks() {
  ensurePresentationsDir();
  const out = [];
  walk(PRESENTATIONS_DIR, "", out);
  return out.sort();
}

function walk(dir, relPosix, out) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const slidesHere = path.join(dir, "slides.md");
  if (fs.existsSync(slidesHere) && relPosix) {
    out.push(relPosix.replace(/\\/g, "/"));
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const childRel = relPosix ? `${relPosix}/${entry.name}` : entry.name;
    walk(path.join(dir, entry.name), childRel, out);
  }
}

/** Normalize deck id: "a/b/c" or legacy single segment */
export function normalizeDeckId(deck) {
  return String(deck || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");
}

export function deckToFsPath(deck) {
  const id = normalizeDeckId(deck);
  if (!id || id === ".") {
    return PRESENTATIONS_DIR;
  }
  return path.join(PRESENTATIONS_DIR, ...id.split("/"));
}

export function resolveDeckSlides(deck) {
  const id = normalizeDeckId(deck);
  if (id === "." || id === "") {
    return path.join(PRESENTATIONS_DIR, "slides.md");
  }
  return path.join(deckToFsPath(deck), "slides.md");
}

export function assertDeckExists(deck) {
  const slidesPath = resolveDeckSlides(deck);
  if (!fs.existsSync(slidesPath)) {
    throw new Error(
      `Deck "${normalizeDeckId(deck)}" not found. Expected file: presentations/${normalizeDeckId(deck)}/slides.md`
    );
  }
  return slidesPath;
}

export function parseDeckArg(argv) {
  const deck = argv.deck || argv.d;
  if (!deck) {
    const decks = listDecks();
    const available = decks.length ? decks.join(", ") : "(none yet)";
    throw new Error(
      `Missing --deck <path>. Examples: my-talk or class-1/part-1/my-talk. Available: ${available}`
    );
  }
  return normalizeDeckId(deck);
}

/** Parent path for gallery grouping (all but last segment). "" = root-level talk. */
export function deckGroupKey(deckId) {
  const id = normalizeDeckId(deckId);
  if (!id || id === ".") return "";
  const parts = id.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

/** Last segment = talk folder name */
export function deckTalkSegment(deckId) {
  const id = normalizeDeckId(deckId);
  if (!id || id === ".") return "";
  const parts = id.split("/").filter(Boolean);
  return parts[parts.length - 1] || id;
}
