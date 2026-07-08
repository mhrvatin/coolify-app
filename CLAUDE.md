# coolify-app

Shared library, not an app. Owns the generic "create/update/deploy an app on Coolify" logic, plus
a `CoolifyApp` builder with an opt-in `.withPostgres()` for apps that use infra-hetzner's shared
Postgres.

## Scope

- Generic Coolify REST plumbing (`client.ts`, `application-payload.ts`, `env-payload.ts`,
  `coolify-deploy.ts`) — no app-specific values here.
- `coolify-app.ts` — the `CoolifyApp` builder consuming apps actually import. Wraps
  `coolify-deploy.ts` in a `@pulumi/command` `local.Command` resource.
- `postgres.ts` — StackReference lookup into infra-hetzner's `databaseUrls` output.

Does **not** own: per-app env vars/secrets, domains, or Pulumi stack config — those stay in each
app's own `infra/` directory (see reda's `infra/index.ts` for the pattern).

## Deploy mechanism: `@pulumi/command` local.Command, not a dynamic provider

Coolify has no first-party Pulumi provider. The original implementation (since removed) used
`pulumi.dynamic.Resource`, Pulumi's mechanism for hand-rolled providers — but registering a
dynamic resource serializes the provider's JS functions into a closure, which fails outright under
Bun (`Error: Function serialization is not supported when using bun as a runtime`), not just in
tests but for real `pulumi up` runs. Since this whole toolchain standardizes on Bun deliberately,
`CoolifyApp.build()` now wraps `coolify-deploy.ts` — a plain script that finds/creates the app,
PATCHes its config and env vars, and triggers a deploy — in `@pulumi/command`'s `local.Command`
(the same officially-maintained package infra-hetzner already uses as `command.remote.Command`).
The script prints `{"uuid","name","domain"}` as a single JSON line on stdout, which `build()`
parses via `.apply(JSON.parse)` into `pulumi.Output`s.

### Idempotency trade-off

The old dynamic-resource provider stored the Coolify app's UUID as the Pulumi resource's own
`id`, so `update()` always knew exactly which app to PATCH — no searching. `local.Command` has no
equivalent slot for a provider-chosen ID; all it tracks is the command's own inputs/outputs.
`coolify-deploy.ts` therefore **finds-or-creates by name + `project_uuid` on every run** (one extra
`GET /applications` per deploy, plus a small TOCTOU race if two deploys for the same app name run
concurrently). This reverts a trade-off the ID-tracking approach was chosen to avoid — but at this
project's scale (personal projects, a single deployer, low deploy frequency) it's an accepted
trade-off, and it's the only realistic option now that Bun can't run the dynamic-provider approach.
Don't build a way to thread the UUID through Pulumi's own state instead unless it turns out to be
genuinely trivial — simple and correct beats clever here.

### Secrets

`apiToken` and env vars (e.g. `DATABASE_URL`) are passed to the script only via `local.Command`'s
`environment` field, never interpolated into the `create`/`update` command string — the command
string ends up in argv/process listings and command-string diffs, `environment` doesn't. Pulumi's
engine automatically marks a resource's `environment` property as secret in state when its value
is built from a secret `Output` (which `apiToken` already is, via `apiUrl.requireSecret(...)` in
consuming apps) — this needed verifying against `@pulumi/command`'s source rather than assumed, and
holds. So no `additionalSecretOutputs` equivalent is needed for `environment`. `stdout` is not
marked secret, because `coolify-deploy.ts` only ever prints `{uuid, name, domain}` — never a
secret.

## Testing

`CoolifyApp.build()` is unit-testable under `pulumi.runtime.setMocks` (see `coolify-app.test.ts`):
unlike the old dynamic-resource approach, `local.Command` is a plain first-party resource, so
registering it never touches closure serialization — mocks intercept it like any other resource,
and no real `bun run` process is ever spawned in tests. `coolify-deploy.ts`'s own find/create/PATCH
logic is tested directly in `coolify-deploy.test.ts` (mocked `fetch`, same style as
`application-payload.test.ts`/`env-payload.test.ts`).

## Conventions

- TypeScript, `bun test`, no build tooling beyond `tsc`. `dist/` is **committed** — consumers
  install this as a `github:mhrvatin/coolify-app#<sha>` dependency, and Bun's lifecycle-script
  behavior for git dependencies isn't reliable enough to depend on for the build step. Pre-commit
  (lefthook) rebuilds and stages `dist/`; CI double-checks it isn't stale.
- Biome (`biome.json`, matches facit's config), lefthook (`.claude/hooks/*.sh` + `lefthook.yml`),
  and a `justfile` — same tooling conventions as facit/reda. CI (`.github/workflows/ci.yml`) uses
  `mhrvatin/common-ci@v1`'s shared actions.
- Match `infra-hetzner`'s conventions where relevant (that repo owns the platform this package
  deploys onto).
