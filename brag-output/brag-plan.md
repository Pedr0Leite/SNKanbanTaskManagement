# Brag Plan: Kanban by noviqnow

## What is this app?
A scoped ServiceNow application (`x_nold_nvqbrd`) that replaces the Visual Task Board with a real drag-and-drop Kanban that can be pointed at any table — incident, case, sc_task, change_request — purely through configuration records, with no code changes.

## The angle
The Visual Task Board is the thing everyone in ServiceNow tolerates. This is the replacement, and the proof is that nothing in the source tree names a business table. One board record, one table name, one choice field — and the same code renders a board for incidents, cases, or anything else. The video's claim is configuration, not customization.

## Hook (first 2-3 seconds)
A single incident card being dragged across lanes — the motion happens before any text does. Then the line lands: **"Visual Task Board, replaced."** The drag IS the hook; the product does the talking.

## Key moments (the middle)
- An incident card (INC0010023 · "Email not sending" · P1 badge · assignee avatar) dragged from **In Progress** into **Resolved**, dropping with the lane's green accent and a WIP counter ticking.
- The board **retargets live**: the same lanes and the same code, table chip flipping `incident` → `sn_customerservice_case` → `change_request`, cards swapping underneath. One codebase, any table.
- The **New Board** dialog: pick a table, pick the lane field, and the lane dots preview themselves — the configuration story in one screen.

## Outro / punchline
The board settles, dims back, and the noviqnow wordmark resolves with **"Kanban for ServiceNow"** and **noviqnow.com**. Clean, corporate, confident — no joke to land, just a product that's finished.

## User flow worth showing
entry → key action → result:
1. **Entry** — the board loads: sidebar with board picker ("Incidents"), toolbar with search and the `incident` table chip, five lanes with coloured dots (New #49C4E5, In Progress #8471F2, On Hold #F2C94C, Resolved #67E2AE, Closed #828FA3).
2. **Key action** — a card is dragged from In Progress into Resolved. It lifts with the drag shadow, tilts slightly, drops home.
3. **Result** — the card settles in the new lane, lane counts update, and the record persists (the real app does an optimistic move against `sys_updated_on` with rollback — the video shows the confident version: it just sticks).

## Tone
- Preset: `app-store`
- Creative direction: quiet premium enterprise product film — a real ServiceNow ISV app, not a parody
- Interpretation: Clean slides and wipes, no flashes, no shake. Type is Plus Jakarta Sans at medium/bold weight, title case, generous space. Motion is purposeful and short (0.35–0.5s), holds are long enough to read. The energy comes from the board itself moving, not from the edit.

## Format: landscape — 1920x1080
## Duration: 20s

## Visual identity (from the project)
- Background: `#20212c` (dark `--surface-sunken`), lanes/cards on `#2b2c37` (`--surface`)
- Accent: `#635fc7` light / `#7b77e0` dark (`--purple`) — the brand purple the app ships with
- Text: `#ffffff` primary, `#9aa6b8` muted (`--text-muted`)
- Lane accents: `#49C4E5`, `#8471F2`, `#F2C94C`, `#67E2AE`, `#828FA3`
- Display font: Plus Jakarta Sans (800)
- Body font: Plus Jakarta Sans (500 / 700)
- Card treatment: 8px radius, left border in the lane accent, `0 4px 6px rgba(0,0,0,.25)` resting, `0 12px 24px rgba(0,0,0,.6)` while dragging
- Strongest visual element: the dark board with five accent-dotted lanes and a card mid-drag under the drag shadow

## Share copy (draft)
We rebuilt the ServiceNow Visual Task Board. Real drag-and-drop Kanban, pointed at any table — incident, case, change — by configuration, not code. Kanban by noviqnow.

## Audio direction
- Role: warm professional bed with sparse motion-matched accents
- Music: clean corporate/tech bed, mid-tempo, no vocal, restrained build into the final logo beat
- Music treatment: fade in over ~0.6s under the hook, hold at a low bed under the board scenes so UI accents stay audible, small lift entering the retarget scene, gentle fade-out across the last 1.5s of the outro
- Music cue guidance: bundled preset read at composition time if available, otherwise detect cues with `npx hyperframes beats`. Target strong cues at the card **drop** (~3.5s), the first **table swap** (~9s), and the **wordmark resolve** (~17s). Beat-grid window for the sequential lane/field reveals in the New Board scene (~12–15s) — snap to every other beat so each label holds long enough to read.
- Audio-reactive treatment: subtle — the accent glow behind the board may breathe with the bed. No waveform bars, no pumping.
- SFX posture: sparse, motion-matched, professional restraint. Roughly 5–7 cues across 20s, nothing cartoonish.
- Audio-coupled moments: card lift, card drop into lane, lane-count tick, table chip swaps (soft click each), New Board field selections appearing one by one, final wordmark resolve.
- Restraint rule: no whooshes on every transition, no risers, no impact stingers. This is an enterprise product film — if a sound isn't matched to something moving on screen, it doesn't exist.

## Storyboard

### Scene 1 — Drag hook — 3.5s
Dark board, partially framed (cards large enough to read). An incident card — `INC0010023` / "Email not sending" / red `1 - Critical` badge / `SM` avatar — lifts under the cursor and travels from In Progress to Resolved, dropping with the green `#67E2AE` lane accent. As it settles, the line types/slams in over the lower third: **"Visual Task Board, replaced."**
Sequential/interaction: yes — simulated pointer drag: card lifts (scale 1.03, drag shadow), travels ~1.0s, drops and settles into the lane.
Audio intent: confident and quiet — establish that this is a real product, not a demo reel.
Audio-coupled idea: soft lift on pickup, a single dry drop/click on settle, music bed fades in under it.
Music: clean corporate bed, low.
Transition mood: clean → Scene 2

### Scene 2 — The board — 4.5s
Pull back to the full board: sidebar with brand title and board picker ("Incidents" active), toolbar with search field, `incident` table chip and the assigned-to-me toggle, five lanes with accent dots and counts. Cards populate the lanes quickly, then hold. Supporting line, small, top-right or lower third: **"Real drag-and-drop. Real records."**
Sequential/interaction: yes — lanes reveal left to right (~0.25s apart), cards fade/rise into each lane just behind them; the whole set holds ~2s once complete.
Audio intent: the product opening up — spacious, no urgency.
Audio-coupled idea: light tick per lane arrival, beat-aligned but at half the beat rate so nothing feels rushed.
Music: bed continues, unchanged.
Transition mood: smooth wipe → Scene 3

### Scene 3 — Any table — 5s
Same board, same lanes. The table chip flips `incident` → `sn_customerservice_case` → `change_request`, and the cards beneath swap with it (INC numbers → CS numbers → CHG numbers), lanes relabeling where the states differ. Headline holds throughout: **"Point it at any table."** Sub-line settles under it: **"Configuration, not code."**
Sequential/interaction: yes — three table swaps, ~1.2s apart, each a chip change plus a card-content crossfade. Headline lands on the first swap and holds for the whole scene.
Audio intent: the moment the claim gets proven — a small lift, still restrained.
Audio-coupled idea: one soft click per table swap; music lifts slightly entering the scene.
Music: bed with a small build.
Transition mood: smooth wipe → Scene 4

### Scene 4 — New Board — 4s
The New Board dialog over the dimmed board. Table selector fills with `incident`, lane field resolves to `state`, filter shows `active=true`, and the lane preview dots appear in the app's accent order. Line, small and calm: **"A new board in two steps."**
Sequential/interaction: yes — three field values land one by one (~0.7s apart, each holding ~0.8s settled), then the lane dot row pops in as a set and holds.
Audio intent: precise and light — this is the "it's genuinely this easy" beat.
Audio-coupled idea: one soft select tick per field value; dot row gets a single quiet arrival, not six.
Music: bed settles back down toward the outro.
Transition mood: clean slide → Scene 5

### Scene 5 — noviqnow — 3s
Board dims and recedes behind a soft purple (`#7b77e0`) glow. **Kanban** resolves large in Plus Jakarta Sans 800, with **"for ServiceNow"** beneath it, then the **noviqnow** wordmark and **noviqnow.com** settle below. Long, still hold on the final frame.
Sequential/interaction: yes — title, then wordmark, then URL, each ~0.5s apart, full set holding ~1.2s.
Audio intent: resolve, don't punctuate. The film ends because it's finished.
Audio-coupled idea: one restrained resolve on the wordmark; music fades out across the final 1.5s.
Music: gentle fade to silence.
Transition mood: hold to end.

**Music mood for this video:** clean corporate/tech — mid-tempo, no vocal, restrained build
**Audio summary:** A low warm bed fades in under the opening drag, stays quiet enough for sparse motion-matched UI accents to carry the board scenes, lifts slightly as the board retargets across tables, then settles and fades out under the noviqnow wordmark.
