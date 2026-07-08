import * as pulumi from '@pulumi/pulumi';
import { CoolifyApplication } from './application';
import { getPostgresDatabaseUrl } from './postgres';
/**
 * Builder around the generic Coolify dynamic-resource provider. Chain `.withPostgres()` before
 * `.build()` to pull DATABASE_URL out of infra-hetzner's shared Postgres StackReference — apps
 * that don't need a database (e.g. marquee) just skip that call.
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
        return new CoolifyApplication(resourceName, this.buildArgs(), opts);
    }
}
function mergeDatabaseUrl(envVars, databaseUrl) {
    return pulumi
        .all([envVars ?? {}, databaseUrl])
        .apply(([vars, url]) => ({ ...vars, DATABASE_URL: url }));
}
//# sourceMappingURL=coolify-app.js.map