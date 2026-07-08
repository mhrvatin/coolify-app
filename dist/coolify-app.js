import * as command from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { getPostgresDatabaseUrl } from './postgres.js';
// bun's ESM loader resolves this relative to the *compiled* file (dist/coolify-app.js), so it
// keeps pointing at the sibling coolify-deploy.js that tsc emits alongside it — in src/ during
// tests, in dist/ for consumers.
const DEPLOY_SCRIPT_PATH = new URL('./coolify-deploy.js', import.meta.url).pathname;
/**
 * Builder around a Coolify app deploy, run via @pulumi/command's local.Command. Chain
 * `.withPostgres()` before `.build()` to pull DATABASE_URL out of infra-hetzner's shared Postgres
 * StackReference — apps that don't need a database (e.g. marquee) just skip that call.
 */
export class CoolifyApp {
    constructor(options) {
        this.options = options;
    }
    withPostgres(options = {}) {
        this.postgresOptions = options;
        return this;
    }
    /** Pure args resolution (defaults + env-var merge), split out from `build()` so it's testable
     * without touching Pulumi's resource-registration machinery. */
    buildArgs() {
        const envVars = this.postgresOptions
            ? mergeDatabaseUrl(this.options.envVars, getPostgresDatabaseUrl(this.options.name, this.postgresOptions))
            : (this.options.envVars ?? {});
        return {
            name: this.options.name,
            gitBranch: this.options.gitBranch ?? 'main',
            domain: this.options.domain,
            healthCheckPath: this.options.healthCheckPath ?? '/api/health',
            port: this.options.port ?? '3000',
            buildPack: this.options.buildPack ?? 'dockerfile',
            gitCommitSha: this.options.gitCommitSha,
            projectUuid: this.options.projectUuid,
            serverUuid: this.options.serverUuid,
            environmentName: this.options.environmentName ?? 'production',
            privateKeyUuid: this.options.privateKeyUuid,
            gitRepository: this.options.gitRepository,
            apiUrl: this.options.apiUrl,
            apiToken: this.options.apiToken,
            envVars
        };
    }
    build(resourceName, opts) {
        const args = this.buildArgs();
        const runScript = `bun run ${DEPLOY_SCRIPT_PATH}`;
        const cmd = new command.local.Command(resourceName, {
            create: runScript,
            update: runScript,
            // Forces a redeploy whenever the app's source changes, even if no other input here
            // did — see CoolifyAppOptions.gitCommitSha for why this is needed.
            triggers: [args.gitCommitSha],
            environment: {
                COOLIFY_API_URL: args.apiUrl,
                // Secrets (apiToken, envVars) are passed only via `environment`, never
                // interpolated into `create`/`update` — those show up in argv/process
                // listings, `environment` doesn't. Pulumi's engine automatically marks this
                // whole `environment` property as secret in state because its value is built
                // from secret Outputs (apiToken, and envVars whenever the caller passed a
                // secret) — no `additionalSecretOutputs` needed for it. `stdout` isn't marked
                // secret because coolify-deploy.ts only ever prints {uuid,name,domain}.
                COOLIFY_API_TOKEN: args.apiToken,
                COOLIFY_NAME: args.name,
                COOLIFY_GIT_BRANCH: args.gitBranch,
                COOLIFY_DOMAIN: args.domain,
                COOLIFY_HEALTH_CHECK_PATH: args.healthCheckPath,
                COOLIFY_PORT: args.port,
                COOLIFY_BUILD_PACK: args.buildPack,
                COOLIFY_PROJECT_UUID: args.projectUuid,
                COOLIFY_SERVER_UUID: args.serverUuid,
                COOLIFY_ENVIRONMENT_NAME: args.environmentName,
                COOLIFY_PRIVATE_KEY_UUID: args.privateKeyUuid,
                COOLIFY_GIT_REPOSITORY: args.gitRepository,
                COOLIFY_ENV_VARS_JSON: pulumi
                    .output(args.envVars)
                    .apply((envVars) => JSON.stringify(envVars))
            }
        }, opts);
        const parsed = cmd.stdout.apply((stdout) => JSON.parse(stdout.trim()));
        return {
            uuid: parsed.apply((result) => result.uuid),
            name: parsed.apply((result) => result.name),
            domain: parsed.apply((result) => result.domain),
            command: cmd
        };
    }
}
function mergeDatabaseUrl(envVars, databaseUrl) {
    return pulumi
        .all([envVars ?? {}, databaseUrl])
        .apply(([vars, url]) => ({ ...vars, DATABASE_URL: url }));
}
//# sourceMappingURL=coolify-app.js.map