# Agent Instructions

## Project Overview

A pnpm monorepo containing `text-game-engine`, a declarative engine for text adventure games. Games are defined as data (GameDefinition) rather than code.

## Structure

```
packages/
  engine/     # Core engine + Zod schemas
  example/    # Minimal example game
  snow-day/   # Full-featured example game
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
3. **Test thoroughly** - Every game package has comprehensive tests
4. **Keep it simple** - Minimal dependencies, no over-engineering

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
