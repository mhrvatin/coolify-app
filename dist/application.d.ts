import * as pulumi from '@pulumi/pulumi';
export interface CoolifyApplicationArgs {
    name: pulumi.Input<string>;
    gitBranch: pulumi.Input<string>;
    domain: pulumi.Input<string>;
    healthCheckPath: pulumi.Input<string>;
    projectUuid: pulumi.Input<string>;
    serverUuid: pulumi.Input<string>;
    environmentName: pulumi.Input<string>;
    privateKeyUuid: pulumi.Input<string>;
    gitRepository: pulumi.Input<string>;
    apiUrl: pulumi.Input<string>;
    apiToken: pulumi.Input<string>;
    envVars: pulumi.Input<Record<string, string>>;
}
export declare class CoolifyApplication extends pulumi.dynamic.Resource {
    readonly uuid: pulumi.Output<string>;
    readonly name: pulumi.Output<string>;
    readonly domain: pulumi.Output<string>;
    constructor(name: string, args: CoolifyApplicationArgs, opts?: pulumi.CustomResourceOptions);
}
