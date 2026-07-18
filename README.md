<div align="center">

# ◉ SIMBIONTE

### The first living art ecosystem, co-created by its visitors

*"It is not a work of art you look at. It is a work of art that is alive — and you are part of its DNA."*

**Built for [Hack The Arts](https://hackthearts.devpost.com) · Theme: "Create art that couldn't exist without technology"**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![p5.js](https://img.shields.io/badge/p5.js-generative%20engine-ED225D?logo=p5.js&logoColor=white)](https://p5js.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-realtime%20world-010101?logo=socket.io&logoColor=white)](https://socket.io)
[![Supabase](https://img.shields.io/badge/Supabase-persistence-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Claude API](https://img.shields.io/badge/Claude%20API-AI%20Chronicler-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

[Live Demo](#) · [Video Walkthrough](#) · [Report a Bug](#)

</div>

---

## Table of Contents

- [What This Is](#what-this-is)
- [The Thesis](#the-thesis)
- [The Experience](#the-experience)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Current Status & Known Limitations](#current-status--known-limitations)
- [Privacy by Design](#privacy-by-design)
- [Tech Credits & Attributions](#tech-credits--attributions)
- [Hackathon Context](#hackathon-context)

---

## What This Is

**SIMBIONTE** is a shared digital world, accessible from any browser, inhabited by generative art creatures. None of them were designed by anyone. Each one is born from the body of a real visitor.

When you arrive, the system asks for three things:

- 🎙️ **Your voice** — a sound, a word, a hum
- 🖐️ **A gesture** — a free movement of your pointer or finger
- ✍️ **A stroke** — a single line you draw

Those three inputs are fused into a **20-gene digital genome**: your voice defines the creature's sound and rhythm of life, your gesture defines how it moves, and your stroke defines its anatomy and colors.

The creature doesn't vanish when you close the tab. It lives on in a **persistent, shared, real-time ecosystem** alongside the creatures of every other visitor. They attract or avoid one another, **breed by mixing DNA** through a custom genetic algorithm, age, mutate, and eventually die — leaving fossils behind. Meanwhile, a **Chronicler** (optional AI, or a local myth generator) watches everything and writes the world's mythology live, as it happens.

## The Thesis

> A painting can be made without a computer. A sculpture can be carved without code. But a **collective, persistent, evolving organism — fed in real time by the bodies of people across the planet** — is ontologically impossible without technology.

Technology here is not the tool used to make the artwork. **It is the medium, the canvas, and the biological material, all at once.** SIMBIONTE doesn't use code to imitate traditional art — it defines a medium that has no analog outside of it.

## The Experience

### Act 1 — The Birth (~60 seconds)

An intro screen offers two doors: **"Bring a creature to life"** or **"Just observe the world"** for those who want to enter without the ritual.

The birth ritual unfolds in five steps:

1. **Donate your voice** — speak or hum for 3 seconds into the microphone. No mic, or prefer silence? Choose "continue in silence" and the system generates values without ever blocking the flow.
2. **Donate a gesture** — move your pointer freely for 4 seconds.
3. **Give it shape** — draw a free stroke, pick a pre-made avatar, or fine-tune manually with sliders.
4. **DNA fusion animation** — a double helix of converging particles, visualizing voice + gesture + stroke merging into one genome.
5. **Birth** — the creature emerges with a name and a poetic epithet generated from its own genome (e.g. *"born of a low voice and a sharp stroke"*), editable before you release it into the world.

### Act 2 — The Ecosystem (real-time, multiplayer)

Every creature sings with a timbre derived from its creator's voice — a **generative choir** rendered with Tone.js. Creatures with compatible DNA can be **courted** (drag one toward another to preview genetic compatibility before confirming) and **bred**: the offspring inherits mixed traits from both parents plus a random mutation. Any creature in the world can be fed, called, or inspected.

### Act 3 — The Memory (persistence & narrative)

When a creature dies, it leaves behind a fossil carrying its genealogy — creator, voice of origin, descendants. The **Chronicler** writes the world's history into an ancient-book-style panel. Every visitor can download their creature's **Birth Certificate** as a shareable PNG image for social media.

## Architecture

| Component | Technology | Role |
|---|---|---|
| **Visual engine** | p5.js | Renders the world and every creature — anatomy is **100% procedural**, generated from its 20 genes. No sprites, ever. |
| **Voice capture** | Web Audio API | Analyzes the microphone in-browser and extracts pitch, energy, and spectral brightness → genes. Audio never leaves the device. |
| **Gesture / stroke capture** | Pointer & Touch (Canvas) | Records movement and drawing trajectories, normalized into genome traits. |
| **Evolution** | Custom genetic algorithm (JS) | 20-gene genome; crossover (half from each parent) + mutation (random noise). Original code, not a library. |
| **Shared world** | Node.js + Express + Socket.io | Synchronizes positions, births, and deaths in real time across every connected visitor. The server is the single source of truth. |
| **Persistence** | Supabase (PostgreSQL) | Stores DNA, genealogy, and fossils. Optional — without it, the world simply lives in server memory. |
| **Accounts** | Supabase Auth | Automatic anonymous session per visitor, upgradable to a full email/password account without losing progress; falls back to guest mode if it fails. |
| **AI Chronicler** | Anthropic API (Claude) | Writes the world's live mythology from ecosystem events. Optional — without an API key, a local myth loom takes over. |
| **Generative sound** | Tone.js | Synthesizes each creature's "voice" from its inherited sound genes. |
| **Deployment** | Vercel (static frontend) + Render (persistent Node server) | Free hosting with a live link. |

## Project Structure

```
simbionte/
├── server.js              Express + Socket.io server, optional Supabase / AI hooks
├── package.json
├── vercel.json             Static frontend deployment config for Vercel
├── .env.example            Copy to .env to enable Supabase / AI Chronicler
└── public/
    ├── index.html          Screens: intro, ritual, HUD, panels
    ├── css/style.css        "Abyssal bioluminescence" visual design
    └── js/
        ├── config.js        The only file you need to touch for production (URLs, public keys)
        ├── i18n.js           ES/EN languages: every string + the language switcher
        ├── dna.js            20-gene genome: crossover, mutation, name/epithet generation
        ├── audio.js          Visitor voice capture (Web Audio) + world choir (Tone.js)
        ├── capture.js        Gesture and stroke capture (pointer/touch on canvas)
        ├── creature.js       Procedural anatomy & behavior (p5.js) — 100% math, no assets
        ├── world.js          Ecosystem: breeding, fossils, plankton, particles
        ├── chronicle.js       The Chronicler (server AI or local myth loom)
        ├── net.js            Socket.io client + sanctuary mode + Supabase (read)
        ├── auth.js           Accounts (Supabase Auth) — automatic anonymous session
        ├── wallet.js          Diamonds & inventory (account-bound or localStorage)
        ├── courtship.js       Visitor-initiated courtship + genetic compatibility preview
        ├── encounter.js       Aim-based mini-game to "catch" other visitors' creatures
        ├── codex.js           Codex: a permanent record of caught creatures
        ├── missions.js        22 sanctuary missions (progression, riddles, exploration…)
        ├── ladder.js          The Path: a 20-step ladder with reward chests
        ├── wheel.js           Daily prize wheel (one free spin per day)
        ├── streak.js          Daily visit streak, with milestone rewards
        ├── shop.js            The Shop (food, gifts, artifacts, cosmetics)
        ├── leaderboard.js     Live leaderboard by longevity / offspring / sociability
        ├── certificate.js     Downloadable birth certificate PNG (1080×1350)
        └── main.js            Orchestrator: p5 world sketch, ritual flow, HUD
```

## Features

- ✅ **Complete birth ritual** — real voice capture (Web Audio), gesture, free-form stroke, pre-made avatars, and manual slider customization.
- ✅ **20-gene genome** with genetic crossover, mutation, and procedurally generated names and poetic epithets.
- ✅ **Real-time shared world** via Socket.io — every visitor sees births, movement, and deaths instantly.
- ✅ **Sanctuary mode** — if the server is unreachable, the world populates itself with simulated ancestor creatures. The demo is never seen empty.
- ✅ **Courtship & breeding** — drag one creature toward another to preview genetic compatibility before confirming a cross.
- ✅ **Full life cycle** — aging, death, and fossils that preserve genealogy.
- ✅ **AI Chronicler** — real-time mythology (Claude, optional) or a local myth generator as fallback.
- ✅ **Generative choir** — every creature sounds different based on its inherited voice genes (Tone.js).
- ✅ **User accounts** — automatic anonymous sessions, upgradable to email/password without losing progress (Supabase Auth).
- ✅ **In-world economy** — diamonds, a shop (food, gifts, artifacts, equippable cosmetics); prices and rewards are decided server-side only.
- ✅ **22 sanctuary missions** with diamond rewards.
- ✅ **The Path** — a 20-step progression ladder with reward chests.
- ✅ **Daily wheel & daily streak** with milestone rewards.
- ✅ **Codex** — a permanent collection of creatures caught through an aim-based mini-game.
- ✅ **Live leaderboard** by longevity, offspring count, or sociability.
- ✅ **Downloadable birth certificate** (1080×1350 PNG) for social sharing.
- ✅ **Bilingual ES/EN** with automatic browser language detection.
- ✅ **Privacy by design** — audio and video never leave the browser; only normalized numbers are stored.

## Getting Started

Requirements: [Node.js 18+](https://nodejs.org)

```bash
npm install
npm start
```

Open **http://localhost:3000**.

Without any configuration, the shared world already works on your local network — open two tabs and you'll see the same population in both. You can also open `public/index.html` directly, or deploy only the `public/` folder as a static site: with no server present, **sanctuary mode** activates automatically.

## Environment Variables

**Server (`.env`, copy from `.env.example`):**

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | World persistence (creatures, genealogies, wallets, missions, streaks). Uses the `service_role` key — never expose it in the frontend. |
| `ANTHROPIC_API_KEY` | Enables the real AI Chronicler (Claude) via `POST /api/chronicle`. Without it, the local myth generator is used instead. |
| `PORT` | Server port (defaults to `3000`). |

**Frontend (`public/js/config.js`):**

| Key | Purpose |
|---|---|
| `SERVER_URL` | Socket.io server URL. Empty (`""`) in local dev (same origin); your Render URL in production. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Browser-side Supabase client (public `anon` key only) — fossil archive reads and user accounts. |
| `DEFAULT_CREATOR` | Default signature name for creatures if none is provided. |
| `MAX_POPULATION` | Maximum visible world population (defaults to 30). |

## Deployment

| Piece | Platform | Notes |
|---|---|---|
| **Frontend** | Vercel | Serves `public/` as a static site (auto-detects `vercel.json`). |
| **Server** (world + Socket.io) | Render (free Web Service) | Requires a persistent process — Vercel's serverless functions cannot keep sockets alive. |

## Current Status & Known Limitations

- ✔ The live site loads with a clean console. The full ritual — real microphone voice, gesture, stroke, DNA fusion, birth, sound, and Chronicle — was tested end-to-end and works correctly, including coherent epithet and mythology generation from real donated genomes.
- ⚠ Render's free tier puts the server to **sleep after ~15 minutes** of inactivity and can take longer than expected to wake up. If the connection isn't established in time, the frontend automatically falls back to **sanctuary mode** (a simulated local world, not connected to the real shared ecosystem) — this was observed happening on a real production test. Worth noting as a known limitation, and worth mitigating with a periodic keep-alive ping or a paid tier before a live demo.

## Privacy by Design

Voice and camera data **never leave the browser**. Only normalized numbers (pitch, energy, brightness, trajectories) are ever retained from the ritual. No audio or video is stored anywhere, at any point.

## Tech Credits & Attributions

[p5.js](https://p5js.org) (rendering) · [Tone.js](https://tonejs.github.io) (generative sound) · [Socket.io](https://socket.io) (real-time sync) · [Express](https://expressjs.com) · [Supabase](https://supabase.com) (persistence & accounts, optional) · [Anthropic API — Claude](https://www.anthropic.com) (AI Chronicler, optional) · Google Fonts (Unbounded, Sora, Cormorant Garamond).

Genetic algorithm, procedural anatomy, and the myth loom: **original code**.

## Hackathon Context

Submitted to **[Hack The Arts](https://hackthearts.devpost.com)** (Devpost) — theme: *"Create art that couldn't exist without technology."*

SIMBIONTE naturally competes across several award categories, driven by its shareable birth certificate (fueling the Audience Favorite vote) and by the originality of its core premise: **the audience doesn't just operate the art — the audience *is* the art.**

---

<div align="center">

*Made with code, noise, and the conviction that art should breathe.* ◉

</div>
