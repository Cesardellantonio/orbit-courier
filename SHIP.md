# Ship — Orbit Courier (GitHub Pages)

## Local status

- Playable on Mini disk under this folder.
- Git: initialize locally (see below). **Do not push until `gh auth` works.**

## Blocker (2026-09-18)

```text
gh auth status → Failed to log in to github.com account cdclaw (keyring)
The token in keyring is invalid.
```

### Cesar fix

```bash
gh auth login -h github.com
# or: gh auth logout -h github.com -u cdclaw && gh auth login -h github.com
gh auth status
```

## After auth works

```bash
cd "/Users/cd/Documents/Grok Bot Vault/Hermes Desk/projects/orbit-courier"
git status
# create public repo (example name orbit-courier under Cesar's GitHub):
gh repo create orbit-courier --public --source=. --remote=origin --push
# Enable Pages: Settings → Pages → Deploy from branch `main` / root
# or:
gh api -X POST repos/{owner}/orbit-courier/pages -f build_type=legacy -f source='{"branch":"main","path":"/"}'
```

Expected Pages URL (after owner/repo known): `https://<owner>.github.io/orbit-courier/`

## Do not

- Push with invalid token
- Flip Hermes default off gpt-6-astra
