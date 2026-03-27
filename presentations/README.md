# Presentation folders

Each **talk** is a directory that contains a `slides.md` file.

## Flat layout

```text
presentations/
  my-talk/
    slides.md
```

Run: `npm run dev -- --deck my-talk`

## Nested layout (series, classes, parts)

Use **any depth** of subfolders under `presentations/`. The last folder is the talk; everything above it is hierarchy for the gallery and your own organization.

Examples:

```text
presentations/
  class-1/
    part-1/
      lecture-intro/
        slides.md
      lecture-advanced/
        slides.md
    part-2/
      workshop/
        slides.md
```

Deck id (for `--deck`) is the path with forward slashes:

```bash
npm run dev -- --deck class-1/part-1/lecture-intro
```

## Scaffold a new talk under a path

```bash
npm run new:presentation -- --under class-1/part-1 --slug lecture-intro --title "Lecture intro"
```

`titleShort` defaults to a hyphenated id (e.g. `class-1-part-1-lecture-intro`) so feedback stays unique in Tally/GitHub.

Parent folders (`class-1`, `part-1`) are normal directories only — they do not need their own `slides.md` unless you want a deck at that level too.

## Hiding a talk from the gallery

In that talk’s `presentation.config.json`, set `"hidden": true`. It still builds for GitHub Pages (direct URL works) and stays in git, but it will not appear on the gallery index.
