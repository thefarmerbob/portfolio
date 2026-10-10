# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

**Core patterns used across pages:**

1. **Wall scroll system** — a `#wall` div (or equivalent) is repositioned via `transform: translateX()` as the user scrolls or presses keys. The character sprite moves within the fixed viewport while the wall content shifts behind it.

2. **Sprite animation** — character states (standing, climbing, walking, thinking, etc.) are driven by cycling through numbered SVG files (e.g. `goingdownladder1.svg` → `goingdownladder2.svg`) using `setInterval`. The active frame is set via `img.src`.

3. **Flippable frames** — office frames are `<div class="frame">` elements with front/back faces using CSS `transform-style: preserve-3d` and `rotateY`. Clicking triggers a 3D flip and zoom overlay.

4. **ML inference** (`pants.html`) — loads a TensorFlow.js SavedModel from `/models/pants_savedmodel/`, accepts drag-dropped images, preprocesses with canvas, and runs `model.predict()` client-side.

## Making Changes

Most pages keep their `<style>` and `<script>` inline, so edits are usually local to one file — but `ladybug.css` and `ladybug.js` are genuinely shared across pages. Check which before assuming a change is page-local: a fix to the ladybug's flight applies everywhere at once.

When editing SVG assets, be aware that many have embedded `<style>` blocks with animation keyframes; those animations play independently of JS control.
