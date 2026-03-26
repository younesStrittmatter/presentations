import fs from "node:fs";
import path from "node:path";

export const ROOT = process.cwd();
export const PRESENTATIONS_DIR = path.join(ROOT, "presentations");

export function ensurePresentationsDir() {
  fs.mkdirSync(PRESENTATIONS_DIR, { recursive: true });
}

export function listDecks() {
  ensurePresentationsDir();
  return fs
    .readdirSync(PRESENTATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function resolveDeckSlides(deck) {
  return path.join(PRESENTATIONS_DIR, deck, "slides.md");
}

export function assertDeckExists(deck) {
  const slidesPath = resolveDeckSlides(deck);
  if (!fs.existsSync(slidesPath)) {
    throw new Error(
      `Deck "${deck}" not found. Expected file: presentations/${deck}/slides.md`
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
      `Missing --deck <slug>. Available decks: ${available}. Use "npm run new:presentation -- --slug my-talk --title \\"My Talk\\"" first.`
    );
  }
  return deck;
}
