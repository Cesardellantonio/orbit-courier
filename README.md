# Orbit Courier v2

Mobile-first, one-screen space arcade: send packages between orbital hubs. No login. Pure static HTML/CSS/JS, playable offline by opening `index.html`.

## New in v2 — more interactive

- Directional drag/swipe with a live aim line, charge ring, power bar and percentage. Longer drags launch faster.
- Visible combo/streak meter: consecutive deliveries climb from ×1 to ×4 (100–400 points).
- Levels advance every three deliveries, increasing orbital speed up to level 8.
- Earn a touch-activated slow-mo pulse every third delivery: five seconds of slower hubs, with a visible countdown.
- Larger delivery bursts, floating score bonuses, hit/miss flashes, lightweight shake and clearer messages. Reduced-motion support included.
- Responsive portrait and two-column compact landscape layouts; no hover-only controls.

## How to play

1. Open `index.html` on phone or desktop. Cyan is your source; gold is your destination.
2. **Tap/click toward the gold hub** for a short fling.
3. Or **press and drag/swipe toward your intended heading**, then release. You can start anywhere in the playfield; the packet always leaves the cyan source. This is a forward swipe, not a pull-back slingshot. Aim ahead of the moving target.
4. Longer drags mean more power, up to 100%. The dashed preview shows heading, not a guaranteed delivery trajectory.
5. Keep a streak: deliveries 1–2 earn 100 each, 3–4 earn 200, 5–6 earn 300, and 7+ earn 400. A miss resets the combo and costs a shield.
6. Every three total deliveries increases the level and earns a pulse charge if your bank is empty. Tap **ACTIVATE SLOW-MO** when useful: hub speed drops to 30% for five seconds, while packets keep full speed. One charge can be saved; no stacking or reactivation during an active pulse.
7. Three depleted shields end the shift. **Restart shift** resets score, combo, level and pulse.

## Open locally

```bash
open "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier/index.html"
```

Direct URL:

`file:///Users/cd/Documents/Grok%20Bot%20Vault/Hermes%20Desk/projects/orbit-courier/index.html`

Optional server:

```bash
cd "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier"
python3 -m http.server 8760
# Open http://127.0.0.1:8760/
```

## GitHub Pages

Publish this directory as the Pages root (or publish this repository's branch root through Settings → Pages). Keep `index.html`, `style.css`, `engine.js` and `main.js` together. All asset URLs are relative, so repository subpaths work. No build, dependencies, credentials or server APIs are needed. This upgrade does not itself publish or commit changes.

## Files and tests

- `SPEC.md`: v2 rules, controls, scoring and engine APIs.
- `engine.js`: browser/Node simulation.
- `main.js`, `style.css`, `index.html`: canvas renderer, pointer controls and responsive HUD.
- `tests.cjs`, `ui.test.cjs`: engine tests and DOM/canvas integration harness.
- `DUAL-CHECK.md`, `SHIP.md`: historical v1 review/shipping notes; not v2 verification.

```bash
node --test tests.cjs ui.test.cjs
node --check engine.js
node --check main.js
```

Browser smoke checklist: tap delivery; long/short swipe preview and launch; cancel without firing; reach three deliveries and see level 2 / ×2 / pulse ready; touch the pulse button and observe its countdown; miss and verify combo/shield feedback; lose all shields and restart. Check small portrait and landscape sizes and reduced motion. No changes to Hermes configuration are needed.
