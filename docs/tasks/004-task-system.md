# 004 — Engineering task system

## Objective

Create one task file per real unit of work with objective, dependencies, acceptance criteria and status.

## Why This Matters

Makes progress verifiable and lets any agent resume work.

## Dependencies

[003-architecture-definition](003-architecture-definition.md)

## Files Expected To Change

- `docs/tasks/*.md`

## Implementation Requirements

- Every task has the 9 required sections
- Statuses: PLANNED / IN_PROGRESS / BLOCKED / COMPLETED
- No empty placeholder tasks

## Acceptance Criteria

- [x] All task files render and contain the sections

## Verification

- `grep -L '## Acceptance Criteria' docs/tasks/*.md` returns nothing

## Status

**COMPLETED**
