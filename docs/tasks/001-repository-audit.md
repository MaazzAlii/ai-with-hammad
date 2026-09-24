# 001 — Repository audit

## Objective

Inspect the existing repository, tooling and integrations before changing anything.

## Why This Matters

Prevents destroying existing work and surfaces constraints (blocked network, missing tools) early.

## Dependencies

None

## Files Expected To Change

- `docs/INITIAL_AUDIT.md`
- `docs/legacy/index.html`

## Implementation Requirements

- Inventory every tracked file, dependency, env file and deployment config
- Record available skills/MCP integrations and network limits
- Preserve the legacy page with history (git mv)
- List reusable assets and problems (e.g. fabricated stats)

## Acceptance Criteria

- [x] INITIAL_AUDIT.md covers state, technologies, files, dependencies, problems, reuse, replace, missing
- [x] Legacy page preserved

## Verification

- Manual review of docs/INITIAL_AUDIT.md
- `git log --follow docs/legacy/index.html` shows original commit

## Status

**COMPLETED**

Verified: docs/INITIAL_AUDIT.md; `git log --follow docs/legacy/index.html` shows the original commit.
