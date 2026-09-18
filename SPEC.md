# Orbit Courier v2 — more interactive

Static, mobile-first orbital delivery arcade. No login, backend, build step, imports, external fonts, or network requests. Open `index.html` directly or serve the repository on GitHub Pages.

## Goal and controls

Deliver between five orbiting hubs: NOVA, KEPLER, LYRA, ATLAS, SOL. Cyan is the source; gold is the destination. Avoid other hubs and lead the moving destination. Only one packet flies at a time.

- Tap/click an aim point for the original short fling (215 logical units/second).
- Press anywhere on the playfield and drag/swipe **toward** the intended heading, then release. The gesture direction is applied from the cyan source; this is a forward swipe, not a backward slingshot.
- Movement under 8 logical units is a tap. Otherwise power is drag distance / 160, clamped to 100%; speed is 215 + 185 × power (maximum 400).
- While holding, a dashed aim line, endpoint ring, source charge ring, percentage and power bar preview heading/power. The line is directional, not a collision or moving-target prediction.
- Pointer capture keeps a drag usable beyond the canvas edge. Additional fingers cannot overwrite or release the primary gesture. Cancellation, lost capture, visibility changes and restart clear the gesture without launching.
- A large touch button activates a banked slow-mo pulse; no hover interaction is required.

## Combo and scoring

The first and second consecutive deliveries each score 100. Deliveries 3–4 score 200, 5–6 score 300, and 7 onward score 400. Multiplier = min(1 + floor(max(streak − 1, 0) / 2), 4), applied after incrementing the streak. The HUD shows multiplier, streak count and a meter toward the seven-delivery maximum combo.

Each delivery makes the destination the new source and selects the next destination. Missing costs one of three shields and resets the combo, but not score, delivery count or level. Hitting a wrong hub, leaving the playfield or exceeding the 3.2-second flight timeout is a miss. Zero shields ends the shift; Restart resets everything.

## Escalation

Level starts at 1 and rises every 3 total deliveries, capped at 8. Orbit speed is 0.045 + (level − 1) × 0.018 radians/second. HUD shows level and deliveries until the next level; level 8 shows MAX ORBIT. Misses do not undo progression. All levels retain the same hit radii and flight timeout.

## Power-up: slow-mo pulse

Every third delivery grants a charge if the bank is empty. One charge can be banked; charges do not stack. A charge remains until used or the shift is restarted. The charging button becomes an enabled purple activation button when earned.

Activating consumes the charge and slows hub motion to 30% speed for 5 simulation seconds; packets retain full speed. The button and playfield show the active effect/countdown. Activation is allowed while ready or flying, not while already active or after game over. A new charge may be earned while the effect is active but cannot be used until the effect ends. Timer advances while aiming or flying, pauses when animation frames are suspended in the background, and resets on restart.

## Presentation

Dark space canvas, mobile safe-area insets, DPR-aware rendering, 360 × 480 logical field scaled to the viewport. Portrait uses a vertical dashboard; short landscape uses a two-column layout to keep the playfield usable. HUD includes score, shields, destination, combo, level, power and pulse status.

Deliveries have expanding rings, floating bonus text, combo-scaled particles and a small shake; misses have red particles, a light flash, shield-loss text and stronger but brief shake. Status messages announce bonuses, new levels, pulse availability, misses and restart. Reduced-motion preference removes shake, reduces particle count/flash intensity and disables combo-bar transitions.

## Engine API and verification

`engine.js` remains shared browser/Node code:
- `createGame()` returns a fresh shift.
- `aim(game, start, end)` returns `{x, y, power, speed, isDrag}` from logical-coordinate points.
- `launch(game, x, y, power = 0)` returns success; existing three-argument callers retain short-fling behavior. Nonfinite inputs are rejected; finite power is clamped.
- `combo(game)` returns the current multiplier.
- `activatePulse(game)` returns whether activation succeeded.
- `step(game, dt)` advances the simulation, clamps time steps to 0–0.04 seconds and ignores nonfinite dt. Delivery events include points, multiplier, streak, level, levelUp and pulseEarned.

Run `node --test tests.cjs ui.test.cjs`. Engine tests cover aiming, powered launches, scoring, levels, pulse lifecycle, misses and initial state; UI tests cover pointer cancellation, bonus/power HUD, rendering feedback, activation and restart.
