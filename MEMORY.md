# MEMORY.md - Project Memory & Domain Knowledge Base

## Executive Summary

**Path of Ascension** is a menu-driven cultivation RPG backend API. It bridges tabletop Game Master (GM) narrative systems with structured digital game state mechanics, real-time WebSocket state updates, automated daily ticks, breakthrough systems, complex investigation trees, and faction relationship networks.

---

## Core Systems & Domain Architecture

### 1. Cultivation Progression Engine

- **Realms & Breakthroughs:**
  - Realms: `Qi Condensation` -> `Foundation` -> `Core Formation` -> `Nascent Soul`
  - Qi Capacity: Characters accumulate Qi via base gain (+5/day default), location bonuses, artifact bonuses, and active effects.
  - Breakthrough System: Triggered at 100/100 Qi. Base success chance is 60%, modified by venue (+10% perfect location), auxiliary materials (+5% each), supporting disciples (+5%), timing (+10% New Moon, +5% Full Moon, +20% Eclipse), or hostile environment (-15%).

- **Character Attributes & Collections:**
  - **Sect & Standing:** Ratings from 0 to 5 stars (e.g. Outer Disciple ★★☆☆☆, Inner Disciple, Elder).
  - **Reputation:** Levels (Local, Regional, National).
  - **Skills:** Types (`Combat`, `Technical`, `Spiritual`, `Social`). Tracks `experience`, `proficiency` (0-100%), `masteryLevel` (1-10), and prerequisite cultivation/qi constraints.
  - **Artifacts:** Rarities (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`). Has durability, level requirements, passive bonuses, and active effects.
  - **Effects:** Active status modifiers for Qi generation, investigation proficiency, social interactions, technical analysis, or cultivation speed. Supports stackable instances and max stack limits.

---

### 2. GameState & Time Progression

- **Game Instances:**
  - Holds `createdBy`, `currentTime`, `timeMultiplier`, `characters` map, `activeInvestigations` map, `globalEvents`, and `settings`.
- **Time Advancement:**
  - `POST /api/game-states/games/:id/advance-time` advances in-game time by specified hours.
  - Automatically processes active character Qi regeneration, effect durations/expirations, investigation lead countdowns, and triggers random global events based on configured `eventFrequency`.
- **Game Settings & Defaults:**
  - Standard time multiplier: 1.0.
  - Difficulty options: `Beginner`, `Intermediate`, `Advanced`, `Expert`.
  - Permadeath toggle and max characters cap (default: 3).

---

### 3. Investigation & Relations Framework

- **Investigation Mechanics:**
  - **Objectives:** Main objective (0-100% completion) and sub-objectives with progress thresholds.
  - **Evidence & Clues:** Evidence types comprise Physical, Testimonial, Spiritual, and Documentary. Clues unlock or lead to specific investigation leads.
  - **Leads Management:** Statuses include `Active`, `Unexamined`, `Exhausted`, `Locked`. Investigating leads requires time, Qi, skills, or sect standing, and provides clue discovery chances and rewards.
  - **Progress Tracking:**
    ```
    Investigation Progress = (Sub-Objectives Completed / Total Sub-Objectives) * 100
    ```

- **NPC & Faction Relationship System (`RelationshipService`):**
  - **NPC Cards:** Tracks attitude meters (0-100), key traits, interaction options, and attitude milestone unlocks.
  - **Faction Standing:** Tracks 5-tier standings (`Hostile`, `Cautious`, `Neutral`, `Friendly`, `Respected / Revered`).

---

### 4. Modules & Adventure Integrations

The repository contains modular tabletop adventure guides and GM toolkits that mirror the backend mechanics:

1. **`The_Spirit_Spring_Crisis_Adventure.md`**:
   - Investigation scenario focusing on Qi corruption and array disruption at the Spirit Spring.
   - Leverages technical scanning, disciple questioning, historical record comparison, and detection array deployment.

2. **`The_Cracked_Foundation_Array_Adventure.md`**:
   - High-stakes investigation into sabotaged sect foundation arrays.
   - Integrates technical repair actions, suspect interrogation, and containment procedures.

3. **`Path_of_Ascension_GM_Toolkit.md`**:
   - Master reference for GM decision trees, event generation tables, random encounter formulas (Minor 15%, Notable 10%, Major 5%), and consequences preview formatting.

---

## Technical Architecture & Database Schemas

### Database Collections (MongoDB / Mongoose)

- **`GameState` (`GameStateModel`):**
  - Maps `characters` and `activeInvestigations` as key-value structures.
  - Persists global event history and game metrics (`totalBreakthroughs`, `completedInvestigations`, `discoveredArtifacts`).

- **`Character` (`CharacterModel`):**
  - Schema with embedded arrays for `skills`, `artifacts`, and `activeEffects`.
  - Schema pre-save hooks to automatically track `lastUpdated` timestamps.
  - Instance methods: `addEffect()`, `removeEffect()`, `updateQi()`.

- **`Investigation` (`InvestigationModel`):**
  - Schema containing `mainObjective`, `subObjectives`, `activeLeads`, `timeRemaining`, `assignedCharacters`, and `rewards`.

---

## Real-Time Communication Protocol (WebSockets)

- **Connection URL:** `/ws?gameStateId=<game-id>`
- **Server Broadcast Events (`GameEventType`):**
  - `STATE_UPDATED`: Full or partial GameState refresh.
  - `TIME_ADVANCED`: Broadcast when in-game time advances, detailing time delta and passive results.
  - `CHARACTER_UPDATED`: Sent when a character's stats, Qi, skills, or effects are updated.
  - `INVESTIGATION_UPDATED`: Sent on clue discovery, lead state changes, or objective completion.
  - `NPC_RELATIONSHIP_UPDATED`: Sent when NPC attitudes change or milestones are unlocked.
  - `FACTION_STANDING_UPDATED`: Sent when sect/faction standing level changes.

---

## 🚀 Autonomous Gameplay Expansion Roadmap

Below are concrete, self-contained features that can be autonomously developed in coming coding sessions:

1. **Turn-Based Cultivation Combat System (`src/services/CombatService.ts`):**
   - Duel/battle resolution rules engine incorporating Qi expenditure, skill mastery, artifact bonuses, and martial techniques.
   - Turn actions: Martial Strike, Spiritual Defense, Artifact Activation, Flee.

2. **Interactive Breakthrough Mini-Game Engine (`src/services/BreakthroughService.ts`):**
   - Tribulation simulation for Realm breakthroughs (`Qi Condensation` -> `Foundation` -> `Core Formation` -> `Nascent Soul`).
   - Dynamic stage modifiers: Mind-demon suppression rolls, pill/material consumption, venue alignment, and disciple support bonuses.

3. **Artifact Crafting & Pill Refinement Engine (`src/services/CraftingService.ts`):**
   - Recipe registry matching spirit materials, furnace heat control, skill requirements, and chance of high-rarity artifacts or pills (`Common`, `Uncommon`, `Rare`, `Epic`, `Legendary`).

4. **Automated GM Event & Quest Generator (`src/services/GMEventGeneratorService.ts`):**
   - Dynamic daily event generator using random tables from `Path_of_Ascension_GM_Toolkit.md` (Spirit beast intrusions, rare celestial alignments, disciple rivalries, hidden realm openings).

---

## Key Maintenance Notes for AI Agents

1. **Timestamp Consistency:**
   - Always use current ISO strings via `new Date().toISOString()`.

2. **Database Queries:**
   - `GameStateService`, `InvestigationService`, and `RelationshipService` interact directly with Mongoose models or in-memory dynamic state maps.
   - Map properties must be converted to standard objects when formatting HTTP JSON responses.

3. **Testing Coverage:**
   - Service unit tests live in `src/tests/services/`.
   - Controller integration tests live in `src/tests/integration/`.
