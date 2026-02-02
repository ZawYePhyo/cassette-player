# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A retro cassette tape player web application with skeuomorphic design. Features animated spinning reels, a rotary volume knob, tape shelf sidebar, and playlist panel.

## Development

Open `index.html` directly in a browser - no build process required. For live reload during development, use any static file server.

## Architecture

**Three-panel layout:**
- Left: Tape shelf (decorative tape cards)
- Center: Player section (SVG cassette, progress bar, transport controls)
- Right: Playlist panel (track list)

**Key technical details:**
- Cassette visual is an embedded SVG (`📼 Cassette.svg`) loaded via `<object>` tag to allow DOM manipulation
- Reel animation uses `requestAnimationFrame` to rotate SVG elements by modifying their `transform` attribute
- Volume control is a rotary knob with pointer drag interaction
- Demo mode simulates playback when no audio files are configured (playlist items have empty `src`)

**SVG Reel Animation (app.js):**
- On SVG load, spoke and ring elements are grouped into `<g>` elements
- `animateReels()` rotates groups around reel centers (305.25, 211.25) and (460.25, 211.25)
- Spokes rotate at 180°/s, rings at 60°/s

**Adding audio files:**
Update the `playlist` array in `app.js` with actual file paths in the `src` property.
