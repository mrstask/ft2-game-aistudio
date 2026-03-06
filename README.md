# Local Run and Tests

## Prerequisites

- Node.js
- npm

## Local Setup

1. Install dependencies:
   `npm install`
2. Configure env vars (if AI features are used):
   `cp .env.example .env.local`
   then set `GEMINI_API_KEY` in `.env.local`

## Run Locally

- Start dev server (port 3000):
  `npm run dev`
- Build production bundle:
  `npm run build`
- Preview built app locally:
  `npm run preview`

## Tests and Checks

- Type check (no emit):
  `npm run lint`
- Run unit tests:
  `npm test`

## Available Local URLs (Dev Server)

With `npm run dev`, open:

- `http://localhost:3000/` - Main app entry (`App`)
- `http://localhost:3000/tile-lab.html` - Tile lab tools and tile workflow
- `http://localhost:3000/wall-lab.html` - Wall lab tools and wall workflow
- `http://localhost:3000/animation-preview.html` - Animation preview page
- `http://localhost:3000/dev-level-editor.html` - Dev level editor
- `http://localhost:3000/dev-level-preview.html` - Dev level preview
- `http://localhost:3000/dev-character-editor.html` - Dev character editor
- `http://localhost:3000/dev-character-preview.html` - Dev character preview
- `http://localhost:3000/dev-systems.html` - Dev systems reference
