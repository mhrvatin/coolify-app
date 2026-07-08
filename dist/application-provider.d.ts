import type * as pulumi from '@pulumi/pulumi';
import type { ApplicationCreateInput } from './application-payload';
export interface CoolifyApplicationInputs extends ApplicationCreateInput {
    apiUrl: string;
    apiToken: string;
    envVars: Record<string, string>;
}
export interface CoolifyApplicationOutputs extends CoolifyApplicationInputs {
    uuid: string;
}
export declare const applicationProvider: pulumi.dynamic.ResourceProvider<CoolifyApplicationInputs, CoolifyApplicationOutputs>;
