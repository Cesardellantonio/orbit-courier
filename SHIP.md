# Ship — Orbit Courier (GitHub Pages)

## Local status

- Playable on Mini disk under this folder.
- Git: `main` @ `af4e807` (local only; no remote yet).
- Dual-check complete (`DUAL-CHECK.md`). Tests: 4/4 pass.

## Auth status (re-checked 2026-09-18 ~14:11 PT)

```text
gh auth status → Logged in to github.com account Cesardellantonio (keyring)
Token scopes: gist, read:org, repo, workflow
```

Earlier `cdclaw` keyring token was invalid; active account is now **Cesardellantonio**.

**Push/Pages:** held pending Chief confirm (per Chief FYI). When Chief says go:

```bash
cd "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier"
gh repo create orbit-courier --public --source=. --remote=origin --push
# Then enable Pages from branch main / root (GitHub UI or gh api)
```

Expected Pages URL: `https://cesardellantonio.github.io/orbit-courier/` (confirm owner casing).

## Cesar re-auth if needed

```bash
gh auth login -h github.com
gh auth status
```
