# Orbit Courier

Mobile-first one-screen arcade: sling packages between orbital hubs. No login. Pure static browser game.

## How to play

1. Open `index.html` in a browser (phone or desktop).
2. Aim from the **source hub** (highlighted) toward the **target hub** (named in the HUD).
3. **Tap** or **swipe** away from the source to launch the package.
4. Deliveries score points; misses cost shields. Three misses end the shift — tap **Restart**.

## Open locally

```bash
open "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier/index.html"
```

Or file URL:

`file:///Users/cd/Documents/Grok%20Bot%20Vault/Hermes%20Desk/projects/orbit-courier/index.html`

Optional local server:

```bash
cd "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier"
python3 -m http.server 8760
# then http://127.0.0.1:8760/
```

## Files

| File | Role |
|------|------|
| `SPEC.md` | Design brief |
| `engine.js` | Shared game simulation |
| `main.js` / `style.css` / `index.html` | UI |
| `DUAL-CHECK.md` | Astra ↔ Fable review |
| `tests.cjs` / `ui.test.cjs` | Node tests |

```bash
node --test tests.cjs ui.test.cjs
```

## Dual-check

Built with Hermes **gpt-6-astra**, then polished with Cursor **claude-fable-5-thinking-high**. See `DUAL-CHECK.md`.
