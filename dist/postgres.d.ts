import * as pulumi from '@pulumi/pulumi';
export interface PostgresOptions {
    /** Defaults to infra-hetzner's production stack. */
    stackReference?: string;
    /** Key to look up in that stack's `databaseUrls` output; defaults to the app name. */
    databaseKey?: pulumi.Input<string>;
}
/**
 * Reads a per-app connection string out of infra-hetzner's shared Postgres StackReference
 * (see infra-hetzner's `databaseUrls` output — one role+database per app, provisioned there).
 */
export declare function getPostgresDatabaseUrl(appName: pulumi.Input<string>, options: PostgresOptions): pulumi.Output<string>;
