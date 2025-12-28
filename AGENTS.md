# Agent Instructions

## Project Overview

A pnpm monorepo containing `cogwork`, a declarative engine for puzzle adventure games. Games are defined as data (GameDefinition) rather than code.

## Structure

```
packages/
  cogwork/              # Core engine + Zod schemas
  examples/
    dungeon-escape/     # Minimal example game
    snow-day/           # Full-featured example game
```

## Commands

```bash
pnpm validate          # Run everything: lint, format check, build
pnpm test              # Run tests only
pnpm lint:fix          # Auto-fix lint issues
pnpm format            # Auto-format code
```

## Key Principles

1. **Declarative over imperative** - Game logic lives in GameDefinition objects, not code
2. **Validate early** - Zod schemas catch errors at startup, not runtime
3. **Keep it simple** - Minimal dependencies, no over-engineering

## Testing

- Add tests for new functionality where it makes sense
- Never remove tests just because they fail - fix the code or update the test if requirements changed
- Only remove tests when the functionality they test was explicitly removed
- Write meaningful tests that verify actual behavior, not implementation details
- Coverage percentage is a bad metric - don't chase it. A test that exercises real edge cases beats ten superficial tests

## Before Committing

Always run `pnpm validate` - it must pass with zero errors.

## Completing Tasks

Before marking a task complete, ensure both pass:
1. `pnpm validate` - zero errors
2. `pnpm test` - all tests passing

## File Conventions

- Double quotes for strings (enforced by oxfmt)
- ESM modules (`"type": "module"`)
- Strict TypeScript
- **No inline comments** - Code should be self-documenting. Remove any `//` comments you encounter.
