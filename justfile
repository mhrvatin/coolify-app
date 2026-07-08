# coolify-app task runner

# List available recipes
default:
    @just --list

# Lint and format check. Pass files as args, or omit to check everything.
lint *files:
    #!/usr/bin/env bash
    files="{{files}}"
    if [ -z "$files" ]; then
        bun run biome check .
    else
        bun run biome check --no-errors-on-unmatched $files
    fi

# Lint and format fix. Pass files as args, or omit to fix everything.
lint-fix *files:
    #!/usr/bin/env bash
    files="{{files}}"
    if [ -z "$files" ]; then
        bun run biome check --write .
    else
        bun run biome check --write --no-errors-on-unmatched $files
    fi

# Typecheck without emitting
typecheck:
    bun run typecheck

# Run tests
test:
    bun test

# Rebuild dist/ from src/ (committed — see README)
build:
    bun run build

# Lint + typecheck + test, in that order
check: lint typecheck test
