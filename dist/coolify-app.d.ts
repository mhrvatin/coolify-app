import * as pulumi from '@pulumi/pulumi';
import { CoolifyApplication, type CoolifyApplicationArgs } from './application';
import { type PostgresOptions } from './postgres';
export interface CoolifyAppOptions {
    name: pulumi.Input<string>;
    gitBranch?: pulumi.Input<string>;
    domain: pulumi.Input<string>;
    healthCheckPath?: pulumi.Input<string>;
    projectUuid: pulumi.Input<string>;
    serverUuid: pulumi.Input<string>;
    environmentName?: pulumi.Input<string>;
    privateKeyUuid: pulumi.Input<string>;
    gitRepository: pulumi.Input<string>;
    apiUrl: pulumi.Input<string>;
    apiToken: pulumi.Input<string>;
    envVars?: pulumi.Input<Record<string, string>>;
}
/**
 * Builder around the generic Coolify dynamic-resource provider. Chain `.withPostgres()` before
 * `.build()` to pull DATABASE_URL out of infra-hetzner's shared Postgres StackReference — apps
 * that don't need a database (e.g. marquee) just skip that call.
 */
export declare class CoolifyApp {
    private readonly options;
    private postgresOptions;
    constructor(options: CoolifyAppOptions);
    withPostgres(options?: PostgresOptions): this;
    /** Pure args resolution (defaults + env-var merge), split out from `build()` so it's testable
     * without touching Pulumi's resource-registration machinery. */
    buildArgs(): CoolifyApplicationArgs;
    build(resourceName: string, opts?: pulumi.CustomResourceOptions): CoolifyApplication;
}
