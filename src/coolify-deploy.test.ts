import { describe, expect, mock, test } from 'bun:test';
import { type DeployConfig, deploy, findExistingAppUuid } from './coolify-deploy';

const baseConfig: DeployConfig = {
	name: 'reda',
	gitBranch: 'main',
	domain: 'reda.hrvatin.se',
	healthCheckPath: '/api/health',
	port: '3000',
	buildPack: 'dockerfile',
	projectUuid: 'proj-1',
	serverUuid: 'server-1',
	environmentName: 'production',
	privateKeyUuid: 'key-1',
	gitRepository: 'git@github.com:mhrvatin/reda.git',
	apiUrl: 'https://coolify.example.com/api/v1',
	apiToken: 'test-token',
	envVars: { DATABASE_URL: 'postgres://x' }
};

function jsonResponse(body: unknown) {
	return new Response(JSON.stringify(body), { status: 200 });
}

describe('findExistingAppUuid', () => {
	test('matches an existing app by name and project_uuid', async () => {
		globalThis.fetch = mock(async () =>
			jsonResponse([
				{ uuid: 'other-uuid', name: 'reda', project_uuid: 'proj-2' },
				{ uuid: 'app-uuid', name: 'reda', project_uuid: 'proj-1' }
			])
		) as unknown as typeof fetch;

		expect(await findExistingAppUuid(baseConfig)).toBe('app-uuid');
	});

	test('returns undefined when no app matches', async () => {
		globalThis.fetch = mock(async () => jsonResponse([])) as unknown as typeof fetch;

		expect(await findExistingAppUuid(baseConfig)).toBeUndefined();
	});
});

describe('deploy', () => {
	test('creates the app when none exists, syncs config/envs, triggers a deploy', async () => {
		const calls: Array<{ url: string; method: string }> = [];
		globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
			calls.push({ url, method: init?.method ?? 'GET' });
			if (url.endsWith('/applications')) return jsonResponse([]);
			if (url.endsWith('/applications/private-deploy-key'))
				return jsonResponse({ uuid: 'app-uuid' });
			if (url.includes('/envs/bulk')) return new Response('', { status: 200 });
			if (url.endsWith('/applications/app-uuid')) return new Response('', { status: 200 });
			if (url.includes('/deploy')) return new Response('', { status: 200 });
			throw new Error(`unexpected call: ${url}`);
		}) as unknown as typeof fetch;

		const result = await deploy(baseConfig);

		expect(result).toEqual({ uuid: 'app-uuid', name: 'reda', domain: 'reda.hrvatin.se' });
		expect(calls.map((c) => `${c.method} ${c.url.split('/api/v1')[1]}`)).toEqual([
			'GET /applications',
			'POST /applications/private-deploy-key',
			'PATCH /applications/app-uuid',
			'PATCH /applications/app-uuid/envs/bulk',
			'GET /deploy?uuid=app-uuid'
		]);
	});

	test('reuses an existing app found by name, skipping create', async () => {
		const calls: Array<{ url: string; method: string }> = [];
		globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
			calls.push({ url, method: init?.method ?? 'GET' });
			if (url.endsWith('/applications'))
				return jsonResponse([{ uuid: 'app-uuid', name: 'reda', project_uuid: 'proj-1' }]);
			return new Response('', { status: 200 });
		}) as unknown as typeof fetch;

		const result = await deploy(baseConfig);

		expect(result.uuid).toBe('app-uuid');
		expect(calls.some((c) => c.url.endsWith('/applications/private-deploy-key'))).toBe(false);
	});
});
