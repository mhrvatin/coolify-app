# @mhrvatin/coolify-app

Shared Pulumi building block for deploying an app to [Coolify](https://coolify.io/) on the
[infra-hetzner](https://github.com/mhrvatin/infra-hetzner) platform. Extracted from reda's
`infra/coolify/*` (PR #21) so facit, marquee, and future apps don't each reimplement the same
Coolify deploy plumbing.

## Usage

```ts
import { CoolifyApp } from '@mhrvatin/coolify-app';

const app = new CoolifyApp({
	name: 'marquee',
	domain: 'marquee.hrvatin.se',
	gitRepository: 'mhrvatin/marquee',
	projectUuid: coolifyConfig.require('projectUuid'),
	serverUuid: coolifyConfig.require('serverUuid'),
	privateKeyUuid: coolifyConfig.require('privateKeyUuid'),
	apiUrl: coolifyConfig.require('apiUrl'),
	apiToken: coolifyConfig.requireSecret('apiToken'),
	envVars: { NODE_ENV: 'production' }
})
	.withPostgres() // opt in only if the app needs a database
	.build('marquee-app');

export const appUuid = app.uuid;
```

`.build()` runs the deploy via `@pulumi/command`'s `local.Command` (not a custom Pulumi resource
type) and returns `{ uuid, name, domain, command }` — `uuid`/`name`/`domain` are
`pulumi.Output<string>`s parsed from the deploy script's JSON stdout, and `command` is the
underlying `local.Command` resource, exposed for `dependsOn` chaining if a caller needs it.

`withPostgres()` reads a per-app connection string out of infra-hetzner's shared Postgres
StackReference (`databaseUrls[<app name>]`) and merges it into `envVars` as `DATABASE_URL`. Skip
it for apps with no database (e.g. marquee).

Each consuming app repo still owns its own Pulumi stack/state and app-specific glue (secrets,
extra env vars, domain) — this package only owns the generic "talk to Coolify's API" plumbing.

See `CLAUDE.md` for the idempotency trade-off this makes (find-or-create by name on every deploy,
since `local.Command` doesn't track a provider-chosen ID the way the old dynamic resource did) and
how secrets flow into the deploy command.

## Installing

Consumed as a git dependency, same convention as `@mhrvatin/grove`:

```json
"dependencies": {
	"@mhrvatin/coolify-app": "github:mhrvatin/coolify-app#<commit-sha>"
}
```

`dist/` is committed (built from `src/` via `bun run build`) so consumers get plain JS + `.d.ts`
straight off `bun install`, without depending on Bun's git-dependency lifecycle-script behavior
(`prepare` reruns the build too, as a safety net, but isn't load-bearing).

## Development

- `bun install`
- `just check` — lint + typecheck + test
- `just build` — rebuild `dist/` after changing `src/` (pre-commit also does this and stages it)
