# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Site

This is a static site — no build step required. Serve it with any local HTTP server:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Open `http://localhost:8000` and navigate to any `.html` file directly.

## Architecture

**Stack**: Vanilla HTML5, CSS3, JavaScript — no frameworks, no bundler, no npm.

**Pages** (each is a self-contained HTML file):
- `office.html` — main portfolio; office scene with a character on a ladder, scrollable wall with flippable frames, resume viewer
- `gallery.html` — gallery walk scene; character walks horizontally, artworks on wall are zoomable
- `music.html` — music player UI with character animations
- `chihiro.html` — Spotify-style music UI with song cards, spinning disk, text input
- `pants.html` / `pants2.html` — pants image classifier; `pants2.html` uses TensorFlow.js for client-side inference

**Core patterns used across pages:**

1. **Wall scroll system** — a `#wall` div (or equivalent) is repositioned via `transform: translateX()` as the user scrolls or presses keys. The character sprite moves within the fixed viewport while the wall content shifts behind it.

2. **Sprite animation** — character states (standing, climbing, walking, thinking, etc.) are driven by cycling through numbered SVG files (e.g. `goingdownladder1.svg` → `goingdownladder2.svg`) using `setInterval`. The active frame is set via `img.src`.

3. **Flippable frames** — office frames are `<div class="frame">` elements with front/back faces using CSS `transform-style: preserve-3d` and `rotateY`. Clicking triggers a 3D flip and zoom overlay.

4. **ML inference** (pants2.html) — loads a TensorFlow.js SavedModel from `/models/pants_savedmodel/`, accepts drag-dropped images, preprocesses with canvas, and runs `model.predict()` client-side.

## Asset Layout

- SVG files are in the root directory (82 total); named by subject (e.g. `desk.svg`, `officeframe3.svg`, `officeframe3back.svg`)
- `gallery-character/` — walk cycle SVGs for the gallery page
- `gallery-objects/` — lamp, plant SVGs for gallery scene
- `models/` — TensorFlow SavedModel used by `pants2.html`
- `Mara_Resume.pdf` — embedded in the office page resume viewer
- `*.keras` files and Jupyter notebooks are ML training artifacts, not used by the website at runtime

## Making Changes

Since each page is one HTML file with inline `<style>` and `<script>` blocks, edits are local to that file. There is no shared CSS or JS file across pages — copy patterns between pages manually when needed.

When editing SVG assets, be aware that many have embedded `<style>` blocks with animation keyframes; those animations play independently of JS control.
