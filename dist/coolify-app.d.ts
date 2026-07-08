import * as command from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { type PostgresOptions } from './postgres';
export interface CoolifyApplicationArgs {
    name: pulumi.Input<string>;
    gitBranch: pulumi.Input<string>;
    domain: pulumi.Input<string>;
    healthCheckPath: pulumi.Input<string>;
    port: pulumi.Input<string>;
    buildPack: pulumi.Input<string>;
    gitCommitSha: pulumi.Input<string>;
    projectUuid: pulumi.Input<string>;
    serverUuid: pulumi.Input<string>;
    environmentName: pulumi.Input<string>;
    privateKeyUuid: pulumi.Input<string>;
    gitRepository: pulumi.Input<string>;
    apiUrl: pulumi.Input<string>;
    apiToken: pulumi.Input<string>;
    envVars: pulumi.Input<Record<string, string>>;
}
export interface CoolifyAppOptions {
    name: pulumi.Input<string>;
    gitBranch?: pulumi.Input<string>;
    domain: pulumi.Input<string>;
    healthCheckPath?: pulumi.Input<string>;
    /** Port the app listens on inside its container; passed to Coolify as `ports_exposes`. Defaults to '3000'. */
    port?: pulumi.Input<string>;
    /** Coolify build pack. Defaults to 'dockerfile'. */
    buildPack?: pulumi.Input<string>;
    /**
     * The app's current commit SHA (e.g. `git rev-parse HEAD`, or a CI-provided SHA env var).
     * `local.Command` only re-runs `create`/`update` when a tracked input changes — since none of
     * this resource's other inputs reflect the app's source code, a code-only change (no domain,
     * env var, etc. change) would otherwise never trigger a new Coolify deploy on `pulumi up`.
     * Passing the commit SHA here as a `triggers` value forces a redeploy whenever new code lands,
     * without redeploying on every unrelated `pulumi up`.
     */
    gitCommitSha: pulumi.Input<string>;
    projectUuid: pulumi.Input<string>;
    serverUuid: pulumi.Input<string>;
    environmentName?: pulumi.Input<string>;
    privateKeyUuid: pulumi.Input<string>;
    gitRepository: pulumi.Input<string>;
    apiUrl: pulumi.Input<string>;
    apiToken: pulumi.Input<string>;
    envVars?: pulumi.Input<Record<string, string>>;
}
/** The deployed app's identity, parsed from the JSON line coolify-deploy.ts prints to stdout. */
export interface CoolifyApplication {
    uuid: pulumi.Output<string>;
    name: pulumi.Output<string>;
    domain: pulumi.Output<string>;
    /** The underlying local.Command, exposed for dependsOn chaining by callers that need it. */
    command: command.local.Command;
}
/**
 * Builder around a Coolify app deploy, run via @pulumi/command's local.Command. Chain
 * `.withPostgres()` before `.build()` to pull DATABASE_URL out of infra-hetzner's shared Postgres
 * StackReference — apps that don't need a database (e.g. marquee) just skip that call.
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
