# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PokéTrunfo — Super Trunfo (card battler) game vs CPU, using the 151 Gen 1 Pokémon. Pure vanilla HTML/CSS/JS, no build step, no dependencies, no framework, no package.json.

## Running it

No build/install/test commands exist. Open [index.html](index.html) directly in a browser, or serve the directory statically (needed for ES module imports to work over `file://` in some browsers):

```
python -m http.server 8000
```

## Architecture

Six ES modules loaded via `<script type="module">` from [index.html](index.html), single entry point `initUI()` in [js/ui.js](js/ui.js):

- **[js/state.js](js/state.js)** — single mutable `state` object (deck arrays, HP, turn, game phase) plus `DIFFICULTY_CONFIG` and `resetGameState()`. All modules import and mutate this shared object directly — no event bus, no framework reactivity.
- **[js/api.js](js/api.js)** — static `GEN1_POKEMON_BASE` catalog (all 151 Pokémon with attack/defense/speed/types stats, hardcoded for instant offline load), `TYPE_TRANSLATIONS` (type name/color lookup used by `types.js`), and `createCardFromBase(base, isEvolved, evolveBonus)` for building card instances. `fetchLivePokemonData()` calls the live PokéAPI with fallback to local data on failure, but is currently unused by the game flow (decks are built from local data via `drawRandomDeck`).
- **[js/types.js](js/types.js)** — full 18-type effectiveness chart (`TYPE_CHART`) plus `calculateTypeAdvantage(playerCard, cpuCard, activeTurn)`, which supports dual-type Pokémon (best-of-both-types lookup) and returns the ±20% attribute modifier applied in `playRound` before damage is computed.
- **[js/game.js](js/game.js)** — pure rules engine: `startNewGame`, `resolveCoinToss`, `playRound`, `chooseCpuAttribute`, `findEvolvablePokemon`, `performEvolution`, `checkGameOver`. Reads/writes `state` directly; no DOM access. Imports `calculateTypeAdvantage` from `types.js`.
- **[js/storage.js](js/storage.js)** — localStorage persistence (`poketrunfo_collection_v1`, `poketrunfo_lifetime_v1`) for the Pokédex "captured" set and cross-game lifetime stats. Does *not* persist an in-progress match — only progress between games. Fails silently (empty Set / defaults) if localStorage is unavailable.
- **[js/ui.js](js/ui.js)** — all DOM rendering, event listeners, screen transitions (menu → coin toss → battle), the Pokédex modal (searchable grid of all 151 Pokémon, pick any pair to preview `calculateTypeAdvantage` outside of an active match, tracks "captured" badges via `storage.js`), and the canvas confetti effect. Calls into `game.js` for logic then re-renders from `state`.
- **[js/audio.js](js/audio.js)** — `SoundEngine` class, synthesizes all SFX procedurally via Web Audio API oscillators/noise buffers (no audio files). Exported singleton `sound`.

Data flow is one-directional per interaction: UI event → game.js function mutates `state` and returns a result object → UI re-renders affected DOM from `state` + the result.

## Key game mechanics (relevant when touching game.js)

- Deck's top card (`deck[0]`) is always the active card in a round.
- Round winner takes both active cards plus anything in `disputePot`; ties push both cards into `disputePot` instead.
- `currentTurn` flips every round unconditionally (`playRound`'s last step), regardless of who won, lost, or tied — there's no "loser skips a turn" rule.
- Type advantage runs first: `calculateTypeAdvantage` compares each card's best offensive type against the other's types (dual-type aware) and returns a ±20% modifier on the chosen attribute, applied to whichever side has the advantage *and* is the current attacker (or a penalty to the defender if the attacker lacks it).
- Damage = `max(abs(modifiedStatDiff), 5)` — 5 is a floor to guarantee game progress.
- Evolution: 3 duplicate cards (by `id`) in the player's deck can be fused via `performEvolution` into one card with `+1` to all three stats and `isEvolved: true`. CPU never evolves.
- CPU attribute choice (`chooseCpuAttribute`) picks its highest stat 85% of the time, second-highest 15% of the time.

## The `.agents/` directory

A large multi-agent tooling scaffold (agent definitions, skills, hooks, manifest/schema validation scripts) unrelated to the game's runtime code. It's infrastructure for AI-agent workflows in this repo, not part of the app itself — the game only consists of the files under `js/`, `css/`, and [index.html](index.html).
