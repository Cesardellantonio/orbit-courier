# DUAL-CHECK — Fable review of Astra's Orbit Courier v1

Reviewer: Fable. Baseline: all 4 tests green before review; all 4 green after changes
(`node --test tests.cjs ui.test.cjs`).

## Agree (Astra got these right — kept as-is)

- Engine design (`engine.js`): clean shared browser/Node module, fixed 360×480 logical
  playfield, dt clamped to 0.04s, deterministic next-target rule, event objects for
  UI decoupling. No bugs found; `Orbit.createGame/launch/step` API untouched.
- Pointer handling (`main.js`): unified Pointer Events for mouse + touch, `isPrimary`
  guard against multi-touch, pointer capture with `pointercancel`/`lostpointercapture`
  cleanup, `visibilitychange` resets `lastTime` so backgrounding never produces a dt
  spike. Tap-to-launch and drag-to-aim share one gesture path, per SPEC.
- Mobile foundation (`index.html`, `style.css`): proper viewport meta with
  `viewport-fit=cover`, `100dvh` with `100vh` fallback, safe-area-inset padding,
  `touch-action: none` on the canvas, DPR-aware canvas scaling capped at 3, 48px
  min-height restart button, `@media (max-height: 550px)` landscape compaction.
  No hover-only interactions anywhere.
- Accessibility (`index.html`, `main.js`): `role="status"` + `aria-live="polite"`
  message line, labelled canvas with `aria-describedby`, dialog semantics on the
  game-over overlay, focus moved to Restart on loss, `:focus-visible` outline.
- Tests (`tests.cjs`, `ui.test.cjs`): the VM-sandboxed UI test is a genuinely good
  idea — it caught nothing here but constrains regressions well.

## Disagree (issues found in Astra's build)

1. Stale canvas scale on layout reflow (`main.js`): `resize()` was wired only to
   `window resize`. When the arena box changes without a window resize — footer
   message wrapping to two lines, split-view/drag on iPad, some orientation-change
   sequences — the canvas kept the old scale and touch mapping drifted.
2. Silent failed launch (`main.js`): releasing within 8 logical px of the source hub
   makes `Orbit.launch` return false, and the UI gave zero feedback — on a phone this
   reads as "the game ignored my tap".
3. No urgency signal on last shield (`main.js` / `style.css`): "1 / 3" rendered in the
   same calm cyan as full shields.
4. Mobile browser chrome interference (`style.css`): no `overscroll-behavior`, so
   pull-to-refresh/scroll-chaining could fire mid-swipe from the top edge; default
   tap-highlight flashed on canvas and button on iOS/Android WebKit.
5. HUD overflow risk on narrow screens (`style.css`): grid children had no
   `min-width: 0`, so a long value could blow out the 3-column HUD at ~320px.

## Changes (mine, all polish-in-place; engine untouched)

- `main.js`: added guarded `ResizeObserver` on the arena plus an `orientationchange`
  listener (both no-ops in the test sandbox); added a failed-launch hint message
  ("Aim a little farther from the source hub…") only when status is `ready`; shields
  readout turns `#ff7b8d` at exactly 1 life, cleared by `updateHUD` on restart.
- `style.css`: `overscroll-behavior: none` on body; `-webkit-tap-highlight-color:
  transparent` on canvas and button; `touch-action: manipulation` on the button
  (kills double-tap zoom delay); `.hud > div { min-width: 0 }` and block/ellipsis on
  `.hud strong` so HUD values truncate instead of overflowing.
- `index.html`, `engine.js`, `tests.cjs`, `ui.test.cjs`, `SPEC.md`: no changes.

## Noted but deliberately not changed

- No keyboard aiming: SPEC scopes controls to pointer; Restart is keyboard-reachable.
  Adding keyboard aim would be a redesign, not polish.
- Deterministic `(source + 2) % 5` target rotation is predictable, but it is engine
  behavior covered by tests — changing it would violate the keep-engine-API rule.

Verification: `node --test tests.cjs ui.test.cjs` → 4/4 pass after all changes.
