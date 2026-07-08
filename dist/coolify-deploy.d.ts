import { type ApplicationCreateInput } from './application-payload.js';
export interface DeployConfig extends ApplicationCreateInput {
    apiUrl: string;
    apiToken: string;
    envVars: Record<string, string>;
}
export interface DeployResult {
    uuid: string;
    name: string;
    domain: string;
}
export declare function findExistingAppUuid(config: DeployConfig): Promise<string | undefined>;
export declare function deploy(config: DeployConfig): Promise<DeployResult>;
export declare function readConfigFromEnv(): DeployConfig;
