export interface DesiredApplicationConfig {
	name: string;
	gitBranch: string;
	domain: string;
	healthCheckPath: string;
	port: string;
}

export function buildDesiredConfigPayload(config: DesiredApplicationConfig) {
	return {
		name: config.name,
		git_branch: config.gitBranch,
		ports_exposes: config.port,
		domains: `https://${config.domain}`,
		health_check_enabled: true,
		health_check_path: config.healthCheckPath
	};
}

export interface ApplicationCreateInput extends DesiredApplicationConfig {
	projectUuid: string;
	serverUuid: string;
	environmentName: string;
	privateKeyUuid: string;
	gitRepository: string;
	buildPack: string;
}

export function buildCreatePayload(input: ApplicationCreateInput) {
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
