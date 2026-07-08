import { describe, expect, test } from 'bun:test';
import { buildCreatePayload, buildDesiredConfigPayload } from './application-payload';

const desired = {
	name: 'reda',
	gitBranch: 'main',
	domain: 'reda.hrvatin.se',
	healthCheckPath: '/api/health',
	port: '3000'
};

describe('buildDesiredConfigPayload', () => {
	test('builds the mutable-fields PATCH payload', () => {
		expect(buildDesiredConfigPayload(desired)).toEqual({
			name: 'reda',
			git_branch: 'main',
			ports_exposes: '3000',
			domains: 'https://reda.hrvatin.se',
			health_check_enabled: true,
			health_check_path: '/api/health'
		});
	});
});

describe('buildCreatePayload', () => {
	test('extends the desired-config payload with create-only identifying fields', () => {
		const input = {
			...desired,
			projectUuid: 'proj-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			privateKeyUuid: 'key-1',
			gitRepository: 'git@github.com:mhrvatin/reda.git',
			buildPack: 'dockerfile'
		};

		expect(buildCreatePayload(input)).toEqual({
			project_uuid: 'proj-1',
			server_uuid: 'server-1',
			environment_name: 'production',
			private_key_uuid: 'key-1',
			git_repository: 'git@github.com:mhrvatin/reda.git',
			build_pack: 'dockerfile',
			instant_deploy: false,
			...buildDesiredConfigPayload(desired)
		});
	});
});
