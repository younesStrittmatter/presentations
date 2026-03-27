# Presentation Engine

Markdown-first presentation workspace powered by Slidev, with reusable shared assets and per-talk folders.

## Why this setup

- Fast authoring in Markdown with room for advanced interactions.
- Shared `engine` styles/components to keep a distinctive visual identity.
- One-command scaffolding for new presentations.
- Static builds for GitHub Pages.

## Project layout

- `engine/` shared styles/components and reusable content blocks.
- `presentations/` holds talks. A talk is any folder that contains `slides.md`.
  - **Flat:** `presentations/my-talk/`
  - **Nested (series / class / part):** `presentations/class-1/part-1/lecture-intro/` — use `/` in the deck id (see `presentations/README.md`).
- `scripts/new-presentation.mjs` generator for new talks (`--under` for nested paths).

## Quick start

```bash
npm install
npm run new:presentation -- --slug my-talk --title "My Talk"
npm run dev -- --deck my-talk

# Nested example (quote paths with slashes in the shell if needed)
npm run new:presentation -- --under class-1/part-1 --slug intro --title "Part 1 intro"
npm run dev -- --deck class-1/part-1/intro
```

### Della frictionless runner

One-time:

```bash
./scripts/setup-della.sh
```

Daily use:

```bash
./scripts/present.sh dev creative-computing-intro
./scripts/present.sh new -- --slug my-talk --title "My Talk"
./scripts/present.sh build-all
```

Build one deck:

```bash
npm run build -- --deck my-talk
```

Build all decks:

```bash
npm run build:all
```

## Notebook workflow

For each talk:

- put notebooks in `presentations/<path-to-talk>/notebooks/`
- link them from slides with direct download links
- add "Open in Colab" buttons for runnable cloud notebooks

## Default feedback slide

Every new presentation now includes:

- `presentation.config.json` with:
  - `title`
  - `titleShort`
  - `presentedAt`
  - `presentedWhere`
  - `occasion`
  - `hidden` (optional, default `false`) — if `true`, the deck is still built and stays in the repo but does **not** appear on the gallery page
  - `subtitle` (optional) — short line under the title on the title slide and on gallery cards when set
- `feedback.md` as the default final slide
- shared feedback defaults in `engine/feedback.config.json`

The anonymous feedback URL is generated automatically as:

`<engine.feedbackFormUrl>?presentation=<titleShort>`

So each deck passes its own presentation identifier automatically.
Gallery cards also read `presentedAt`, `presentedWhere`, and `occasion` from each deck config.

Suggested setup:

- set your form/repo once in `engine/feedback.config.json`
- keep anonymous form intake (for no-login feedback)
- keep GitHub Issues links (for structured public follow-up)

See `FEEDBACK_SETUP.md` for one-time setup of anonymous form -> auto-created GitHub Issues.

## GitHub Pages

The included workflow builds every deck and deploys to Pages.
Each deck is published at:

- `https://<username>.github.io/<repo>/<deck-path>/` (nested paths keep slashes, e.g. `.../class-1/part-1/intro/`)
- Gallery landing page: `https://<username>.github.io/<repo>/`
