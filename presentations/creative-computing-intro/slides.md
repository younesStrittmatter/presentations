---
theme: default
title: Creative Computing Intro
info: A starter deck in your presentation engine
class: text-left
drawings:
  persist: false
transition: slide-left
mdc: true
---

<script setup>
import meta from "./presentation.config.json";
</script>

# {{ meta.title }}

<div class="hero-subtitle">Art, code, and interaction in one flow.</div>
<div class="hero-meta">
  <span class="hero-meta-item">{{ meta.presentedAt || "Date TBD" }}</span>
  <span class="hero-meta-divider">•</span>
  <span class="hero-meta-item">{{ meta.presentedWhere || "Location TBD" }}</span>
  <span class="hero-meta-divider">•</span>
  <span class="hero-meta-item">{{ meta.occasion || "Occasion TBD" }}</span>
</div>

---
layout: two-cols
---

## Structure

- Write quickly in Markdown
- Drop to Vue/HTML for custom scenes
- Keep demos and notebooks with the deck

::right::

```bash
npm run dev -- --deck creative-computing-intro
```

---

## Notebook-ready workflow

- Keep `.ipynb` files in `./notebooks`
- Link direct download from your slides
- Add a Colab URL for easy audience execution

<a class="pill-link" href="./notebooks/" target="_blank">Open notebooks</a>

---

# Build immersive demos

`./demos` can host p5.js, three.js, or any mini app.

---

# Thank you

<div class="hero-subtitle">Make every technical talk feel like a crafted piece.</div>

---
src: ./feedback.md
---

<style>
@import url("../../engine/styles/artsy.css");
</style>
