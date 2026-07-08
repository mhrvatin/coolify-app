export interface DesiredApplicationConfig {
    name: string;
    gitBranch: string;
    domain: string;
    healthCheckPath: string;
}
export declare function buildDesiredConfigPayload(config: DesiredApplicationConfig): {
    name: string;
    git_branch: string;
    ports_exposes: string;
    domains: string;
    health_check_enabled: boolean;
    health_check_path: string;
};
export interface ApplicationCreateInput extends DesiredApplicationConfig {
    projectUuid: string;
    serverUuid: string;
    environmentName: string;
    privateKeyUuid: string;
    gitRepository: string;
}
export declare function buildCreatePayload(input: ApplicationCreateInput): {
    name: string;
    git_branch: string;
    ports_exposes: string;
    domains: string;
    health_check_enabled: boolean;
    health_check_path: string;
    project_uuid: string;
    server_uuid: string;
    environment_name: string;
    private_key_uuid: string;
    git_repository: string;
    build_pack: string;
    instant_deploy: boolean;
};
