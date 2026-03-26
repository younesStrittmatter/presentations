# Presentation Engine

Markdown-first presentation workspace powered by Slidev, with reusable shared assets and per-talk folders.

## Why this setup

- Fast authoring in Markdown with room for advanced interactions.
- Shared `engine` styles/components to keep a distinctive visual identity.
- One-command scaffolding for new presentations.
- Static builds for GitHub Pages.

## Project layout

- `engine/` shared styles/components and reusable content blocks.
- `presentations/<slug>/` each talk with its own slides, assets, demos, and notebooks.
- `scripts/new-presentation.mjs` generator for new talks.

## Quick start

```bash
npm install
npm run new:presentation -- --slug my-talk --title "My Talk"
npm run dev -- --deck my-talk
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

- put notebooks in `presentations/<slug>/notebooks/`
- link them from slides with direct download links
- add "Open in Colab" buttons for runnable cloud notebooks

## GitHub Pages

The included workflow builds every deck and deploys to Pages.
Each deck is published at:

- `https://<username>.github.io/<repo>/<slug>/`
- Gallery landing page: `https://<username>.github.io/<repo>/`
