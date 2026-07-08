export function buildDesiredConfigPayload(config) {
    return {
        name: config.name,
        git_branch: config.gitBranch,
        ports_exposes: config.port,
        domains: `https://${config.domain}`,
        health_check_enabled: true,
        health_check_path: config.healthCheckPath
    };
}
export function buildCreatePayload(input) {
    return {
        project_uuid: input.projectUuid,
        server_uuid: input.serverUuid,
        environment_name: input.environmentName,
        private_key_uuid: input.privateKeyUuid,
        git_repository: input.gitRepository,
        build_pack: input.buildPack,
        instant_deploy: false,
        ...buildDesiredConfigPayload(input)
    };
}
//# sourceMappingURL=application-payload.js.map