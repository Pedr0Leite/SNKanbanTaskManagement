# Hyperframes Composition Brief: Kanban by noviqnow

## Objective
Create a short launch-style brag video for **Kanban by noviqnow** — a scoped ServiceNow application that replaces the Visual Task Board with a real drag-and-drop Kanban that can be pointed at any table through configuration alone.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/mnt/c/Users/pedro/Documents/Programacao/Github/ServiceNowApps/SNKanbanTaskManagement`
- Primary files read: `src/client/theme.css`, `src/client/app.tsx`, `src/client/components/Card.tsx`, `src/client/index.html`, `src/fluent/tables/kanban-config.now.ts`, `src/fluent/seed/demo-board.now.ts`, `src/server/KanbanBoardService.js`, `package.json`
- Product name: **Kanban** (by **noviqnow**, https://noviqnow.com/)
- Tagline / strongest claim: *Point it at any table. Configuration, not code.*
- Key UI to recreate: the app's dark Kanban board — sidebar board picker, toolbar with search + table chip, five lanes with coloured dots and counts, and an incident card mid-drag under the drag shadow.

- Copy that must appear verbatim:
  - `Visual Task Board, replaced.`
  - `Real drag-and-drop. Real records.`
  - `Point it at any table.`
  - `Configuration, not code.`
  - `A new board in two steps.`
  - `Kanban`
  - `for ServiceNow`
  - `noviqnow`
  - `noviqnow.com`

- Real product strings to use in the recreated UI (all sourced from the app's seed config and card renderer):
  - Board picker entries: `Incidents`, `Cases`, `Changes`
  - Table chips: `incident`, `sn_customerservice_case`, `change_request`
  - Lane labels and accents (from `demo-board.now.ts`): `New` `#49C4E5`, `In Progress` `#8471F2`, `On Hold` `#F2C94C`, `Resolved` `#67E2AE`, `Closed` `#828FA3`
  - Card shape (from `Card.tsx`): title = number, subtitle = short description, then a priority **badge** and an **avatar** chip with initials
  - Incident cards: `INC0010023` / "Email not sending" / `1 - Critical` / `SM`; `INC0010044` / "VPN drops on reconnect" / `2 - High` / `AR`; `INC0010061` / "Printer offline — 3rd floor" / `3 - Moderate` / `TK`
  - Case cards: `CS0041280` / "Licence renewal query" / `2 - High` / `MJ`; `CS0041305` / "Onboarding access request" / `3 - Moderate` / `DL`
  - Change cards: `CHG0032118` / "Upgrade payment gateway" / `2 - High` / `PL`; `CHG0032140` / "Patch mail relay" / `3 - Moderate` / `RN`
  - Toolbar affordances: search input, `Assigned to me` toggle, table chip
  - New Board dialog fields (from `NewBoardDialog.tsx`): Table, Lane field, Filter — with a lane-dot preview row

## Creative Direction
- Tone preset: `app-store`
- Creative direction: quiet premium enterprise product film — a real ServiceNow ISV app, not a parody
- Interpretation: Clean slides and wipes, no flashes, no shake, no zoom-punch. Motion is short and purposeful (0.35–0.5s), holds are long enough to read comfortably. The energy comes from the board itself moving, never from the edit. Type is title/sentence case, generous spacing, no ALL CAPS shouting.
- Angle: The Visual Task Board is the thing everyone in ServiceNow tolerates. This is the replacement, and the proof is that nothing in the source tree names a business table — one board record, one table name, one choice field, and the same code renders a board for incidents, cases, or changes. The video's claim is configuration, not customization.
- Hook: a real incident card drags across lanes and drops into Resolved *before* any text appears; then `Visual Task Board, replaced.` lands.
- Outro / punchline: `Kanban` / `for ServiceNow`, then the `noviqnow` wordmark and `noviqnow.com`. No joke to land — a product that's finished.
- Avoid:
  - Generic SaaS language ("streamline your workflow", "boost productivity")
  - Abstract filler visuals, particle fields, gradient washes
  - Unrelated visual redesign — the board must look like this app's real CSS
  - ServiceNow corporate branding or logos (this is a noviqnow product, not a ServiceNow one)

## Visual Identity
- Background: `#20212c` (`--surface-sunken`, dark theme)
- Surfaces (cards, sidebar, toolbar): `#2b2c37` (`--surface`), lines `#3e3f4e`
- Text: `#ffffff` primary, `#9aa6b8` muted (`--text-muted`)
- Accent: `#7b77e0` (`--purple`, dark theme); soft fill `rgba(123,119,224,0.18)`
- Lane accents: `#49C4E5`, `#8471F2`, `#F2C94C`, `#67E2AE`, `#828FA3`
- Display font: Plus Jakarta Sans 800 (Google Fonts — the app loads it in `index.html`)
- Body font: Plus Jakarta Sans 500 / 700
- Visual references from the project:
  - Card: 8px radius, left border in the lane accent, `0 4px 6px rgba(0,0,0,.25)` resting, `0 12px 24px rgba(0,0,0,.6)` while dragging
  - Lane header: coloured dot + uppercase letter-spaced label + count
  - Badge and avatar chips exactly as `Card.tsx` renders them (badge pill; avatar = initials circle + name)
  - Lane width 288px, 24px gutter

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. **Drag hook** — 3.5s — INC0010023 card drags from In Progress into Resolved and settles; `Visual Task Board, replaced.` lands.
2. **The board** — 4.5s — full board revealed: sidebar, toolbar with `incident` chip, five accent-dotted lanes with counts, cards populating; `Real drag-and-drop. Real records.`
3. **Any table** — 5s — table chip flips `incident` → `sn_customerservice_case` → `change_request` with cards swapping underneath; `Point it at any table.` / `Configuration, not code.`
4. **New Board** — 4s — New Board dialog: Table, Lane field, Filter fill in one by one, lane dot preview row appears; `A new board in two steps.`
5. **noviqnow** — 3s — board recedes behind a soft purple glow; `Kanban` / `for ServiceNow`, then `noviqnow` and `noviqnow.com`.

## Audio
- Audio role: warm professional bed with sparse motion-matched accents
- Audio arc: low bed fades in under the opening drag → stays quiet under the board scenes so UI accents carry → small lift entering the table-retarget scene → settles and fades out under the wordmark
- Music: `assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean; the polished/cinematic pick)
- Music treatment: `data-volume` ~0.32, fade in over ~0.6s, gentle fade-out across the final ~1.5s. No ducking needed (no voiceover).
- Music cue guidance: bundled preset at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json` (109.96 BPM). Suggested locks:
  - Card **drop** in Scene 1 → beat `3.27s`
  - First **table swap** in Scene 3 → strong cue `8.74s` (intensity 0.99) — a good major lock
  - **Wordmark resolve** in Scene 5 → strong cue `17.47s` (intensity 0.99) — the second major lock
  - Beat grid for sequential reveals: lanes in Scene 2 near `4.39 / 4.91 / 5.34 / 6.00 / 6.56`; table swaps near `8.74 / 10.37 / 12.02`; New Board fields near `13.64 / 14.73 / 15.84` (every-other-beat so each label holds ~0.8s settled)
  - Use 2 strong locks, not more. Ignore any cue that rushes a readable line.
- Audio-reactive treatment: subtle — the purple accent glow behind the board (and behind the outro wordmark) may breathe with music RMS. No waveform, no equalizer bars, no pulsing text.
- Audio-coupled moments:
  - Scene 1 card pickup — simulated pointer drag (soft lift)
  - Scene 1 card drop into Resolved — card placement, beat-locked
  - Scene 2 lane reveals — sequential, half-rate beat grid, light ticks
  - Scene 3 table chip swaps — simulated selection, one soft click each
  - Scene 4 New Board field values — sequential selection ticks
  - Scene 5 wordmark resolve — one restrained payoff cue
- SFX selection guidance: `app-store` energy — a consistent light layer at 0.55–0.75 volume, roughly 5–7 cues total across 20s. Copied and available locally:
  - `assets/sfx/ui/rollover1.ogg`, `assets/sfx/ui/mouseclick1.ogg`
  - `assets/sfx/casino/card-slide-1.ogg`, `assets/sfx/casino/card-place-1.ogg`
  - `assets/sfx/interface/drop_001.ogg`, `drop_002.ogg`, `click_001.ogg`, `select_008.ogg`, `bong_001.ogg`
  - `assets/sfx/impact/impactSoft_medium_000.ogg`, `impactSoft_medium_001.ogg`, `impactBell_heavy_000.ogg`
- SFX analysis guidance: `/home/pedro/.claude/plugins/cache/brag/brag/0.2.2/skills/brag/assets/sfx/sfx-analysis.md` — prefer low high-frequency-risk files for repeated moments.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation. Nothing cartoonish; no whoosh per transition, no risers, no stingers.
- Audio files: already copied into `brag-output/composition/assets/` (music, cues JSON, and the SFX shortlist above).
- Audio-reactive: **not implemented.** Per-frame audio extraction was skipped; the accent glow breathes on a deterministic `sine.inOut` yoyo instead, and lifts on the outro. Cue/beat sync (the two strong locks plus the beat grids) is implemented as planned.

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). `/brag` is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI element from the source project — here the board itself is the centrepiece and must match the app's real CSS tokens and card structure.
- Keep all text readable: short label ~0.8s settled, a sentence ~0.3s/word (min ~1.2s).
- Keep the video within 15–25 seconds (target 20s).
- Include the planned music + SFX layer.
- Treat `/brag` audio notes as guidance; choose SFX after the visual animation exists.
- Treat cue metadata as optional timing hints; 2 strong locks (`8.74s`, `17.47s`), marked `// beat-locked`. Sequential reveals snap to the listed beat grid (±0.10s), marked `// beat-grid`.
- Wire at least one visual element (the purple accent glow) to extracted per-frame audio data, using the audio-reactive workflow owned by `hyperframes-creative`. If extraction is unavailable, document it and continue.
- Use local assets only; never absolute paths.
- Run `hyperframes check` before render — it is brag's single gate.
