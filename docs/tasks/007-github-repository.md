# 007 — GitHub repository preparation

## Objective

Prepare the Git repository, branch strategy and conventions.

## Why This Matters

Clean history and conventions make review and deployment predictable.

## Dependencies

[001-repository-audit](001-repository-audit.md)

## Files Expected To Change

- `docs/GITHUB.md`
- `.gitignore`

## Implementation Requirements

- Document repository name decision and rename path
- Branch strategy, commit conventions, PR expectations, deployment branch
- Never commit secrets (.gitignore covers .env*)

## Acceptance Criteria

- [x] GITHUB.md complete; work pushed to the designated branch

## Verification

- `git push` succeeds; `git ls-files | grep .env` shows only .env.example

## Status

**COMPLETED**

Repository prepared and pushed (branch `claude/ai-hamad-agency-platform-j478py`, PR MaazzAlii/ai-with-hammad#1). Not renamed to `ai-with-hamad-agency` — owner action; steps in docs/GITHUB.md.
