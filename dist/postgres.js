import * as pulumi from '@pulumi/pulumi';
const DEFAULT_STACK_REFERENCE = 'pulumi-com-hrvatin-se/infra-hetzner/hrvatin.se';
/**
 * Reads a per-app connection string out of infra-hetzner's shared Postgres StackReference
 * (see infra-hetzner's `databaseUrls` output — one role+database per app, provisioned there).
 */
export function getPostgresDatabaseUrl(appName, options) {
    const infra = new pulumi.StackReference(options.stackReference ?? DEFAULT_STACK_REFERENCE);
    const key = options.databaseKey ?? appName;
    return pulumi
        .all([infra.getOutput('databaseUrls'), key])
        .apply(([urls, resolvedKey]) => urls[resolvedKey]);
}
//# sourceMappingURL=postgres.js.map