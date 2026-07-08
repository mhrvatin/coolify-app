import { beforeAll, describe, expect, test } from 'bun:test';
import * as pulumi from '@pulumi/pulumi';
import { CoolifyApp } from './coolify-app';

beforeAll(() => {
	pulumi.runtime.setMocks({
		newResource(args) {
			if (args.type === 'command:local:Command') {
				return {
					id: args.name,
					state: {
						...args.inputs,
						stdout: JSON.stringify({
							uuid: 'mock-uuid',
							name: args.inputs.environment.COOLIFY_NAME,
							domain: args.inputs.environment.COOLIFY_DOMAIN
						}),
						stderr: ''
					}
				};
			}
			return {
				id: args.name,
				state: { outputs: { databaseUrls: { marquee: 'postgres://fake-db-url' } } }
			};
		},
		call(args) {
			return args.inputs;
		}
	});
});

const baseOptions = {
	name: 'marquee',
	domain: 'marquee.hrvatin.se',
	gitCommitSha: 'abc123',
	projectUuid: 'project-uuid',
	serverUuid: 'server-uuid',
	privateKeyUuid: 'key-uuid',
	gitRepository: 'mhrvatin/marquee',
	apiUrl: 'https://coolify.example.com/api/v1',
	apiToken: 'token'
};

describe('CoolifyApp.buildArgs', () => {
	test('applies defaults for gitBranch, environmentName, healthCheckPath', () => {
		const args = new CoolifyApp(baseOptions).buildArgs();

		expect(args.gitBranch).toBe('main');
		expect(args.environmentName).toBe('production');
		expect(args.healthCheckPath).toBe('/api/health');
		expect(args.envVars).toEqual({});
	});

	test('explicit options override defaults', () => {
		const args = new CoolifyApp({
			...baseOptions,
			gitBranch: 'staging',
			environmentName: 'staging',
			healthCheckPath: '/healthz',
			envVars: { NODE_ENV: 'production' }
		}).buildArgs();

		expect(args.gitBranch).toBe('staging');
		expect(args.environmentName).toBe('staging');
		expect(args.healthCheckPath).toBe('/healthz');
		expect(args.envVars).toEqual({ NODE_ENV: 'production' });
	});

	test('without withPostgres, envVars is left untouched', () => {
		const args = new CoolifyApp({
			...baseOptions,
			envVars: { NODE_ENV: 'production' }
		}).buildArgs();

		expect(args.envVars).toEqual({ NODE_ENV: 'production' });
	});

	test('withPostgres merges DATABASE_URL from the infra-hetzner StackReference output', async () => {
		const args = new CoolifyApp({ ...baseOptions, envVars: { NODE_ENV: 'production' } })
			.withPostgres()
			.buildArgs();

		const envVars = await resolveOutput(args.envVars);
		expect(envVars).toEqual({ NODE_ENV: 'production', DATABASE_URL: expect.any(String) });
	});
});

// Unlike the old pulumi.dynamic.Resource (whose registration serialized the provider as a
// closure — unsupported under Bun), local.Command is a plain first-party resource. Registration
// never touches closure serialization, so pulumi.runtime.setMocks intercepts it like any other
// resource and build() is fully exercisable here — no real `bun run` process is spawned.
describe('CoolifyApp.build', () => {
	test('parses uuid/name/domain from the command JSON stdout', async () => {
		const app = new CoolifyApp(baseOptions).build('marquee-app');

		expect(await resolveOutput<string>(app.uuid)).toBe('mock-uuid');
		expect(await resolveOutput<string>(app.name)).toBe('marquee');
		expect(await resolveOutput<string>(app.domain)).toBe('marquee.hrvatin.se');
	});

	test('passes secrets via environment, not the create/update command string', async () => {
		const app = new CoolifyApp({ ...baseOptions, apiToken: 'super-secret' }).build('marquee-app');

		const create = await resolveOutput<string>(app.command.create);
		expect(create).not.toContain('super-secret');

		const environment = await resolveOutput<Record<string, string>>(app.command.environment);
		expect(environment.COOLIFY_API_TOKEN).toBe('super-secret');
	});

	test('sets triggers from gitCommitSha so a code-only change forces a redeploy', async () => {
		const app = new CoolifyApp({ ...baseOptions, gitCommitSha: 'def456' }).build('marquee-app');

		const triggers = await resolveOutput<string[]>(app.command.triggers);
		expect(triggers).toEqual(['def456']);
	});
});

function resolveOutput<T>(input: unknown): Promise<T> {
	return (input as { promise(): Promise<T> }).promise();
}
