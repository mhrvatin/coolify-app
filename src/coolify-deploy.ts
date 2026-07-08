// Run via `bun run coolify-deploy.js` as the create/update command of a @pulumi/command
// local.Command resource (see coolify-app.ts). All inputs arrive through environment variables,
// never argv, so secrets (apiToken, envVars) never show up in a process listing.
import {
	type ApplicationCreateInput,
	buildCreatePayload,
	buildDesiredConfigPayload
} from './application-payload';
import { type CoolifyClientConfig, coolifyRequest } from './client';
import { buildEnvBulkPayload } from './env-payload';

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

interface CoolifyApplicationSummary {
	uuid: string;
	name: string;
	project_uuid?: string;
}

function clientConfig(config: DeployConfig): CoolifyClientConfig {
	return { apiUrl: config.apiUrl, apiToken: config.apiToken };
}

// Coolify's dynamic-resource provider (application-provider.ts, now removed) stored the app's
// uuid as the Pulumi resource's own id, so update() always knew exactly which app to PATCH.
// local.Command has no equivalent slot for that — it doesn't track arbitrary provider-chosen IDs,
// only whatever the command prints. Re-deriving the uuid by listing /applications and matching on
// name (+ project_uuid, when Coolify's list response includes it) costs one extra GET per run and
// a small TOCTOU race if two deploys for the same app name run concurrently. At this project's
// scale (personal projects, single deployer, low deploy frequency) that trade-off is fine — see
// CLAUDE.md's "Idempotency" section for the fuller rationale.
export async function findExistingAppUuid(config: DeployConfig): Promise<string | undefined> {
	const apps = await coolifyRequest<CoolifyApplicationSummary[]>(
		clientConfig(config),
		'/applications'
	);
	const match = apps.find(
		(app) =>
			app.name === config.name &&
			(app.project_uuid === undefined || app.project_uuid === config.projectUuid)
	);
	return match?.uuid;
}

async function findOrCreateAppUuid(config: DeployConfig): Promise<string> {
	const existing = await findExistingAppUuid(config);
	if (existing) return existing;

	const created = await coolifyRequest<{ uuid: string }>(
		clientConfig(config),
		'/applications/private-deploy-key',
		{ method: 'POST', body: JSON.stringify(buildCreatePayload(config)) }
	);
	return created.uuid;
}

// NOTE: this only PATCHes the fields in buildDesiredConfigPayload (name, gitBranch, domain,
// healthCheckPath, port) plus envVars. projectUuid/serverUuid/privateKeyUuid/gitRepository/
// environmentName/buildPack are create-only identifiers — if one of those changes on an existing
// app, this function re-runs (local.Command sees a changed `environment`) but never sends the new
// value to Coolify, so Pulumi state and Coolify reality silently drift. A changed projectUuid can
// also make findExistingAppUuid stop matching the existing app and create a duplicate. These
// identifiers are set once at bootstrap time and not expected to change; if that assumption
// breaks, this needs a real update-vs-replace mechanism instead of blind PATCHing.
export async function deploy(config: DeployConfig): Promise<DeployResult> {
	const uuid = await findOrCreateAppUuid(config);

	await coolifyRequest(clientConfig(config), `/applications/${uuid}`, {
		method: 'PATCH',
		body: JSON.stringify(buildDesiredConfigPayload(config))
	});
	await coolifyRequest(clientConfig(config), `/applications/${uuid}/envs/bulk`, {
		method: 'PATCH',
		body: JSON.stringify(buildEnvBulkPayload(config.envVars))
	});
	await coolifyRequest(clientConfig(config), `/deploy?uuid=${uuid}`);

	return { uuid, name: config.name, domain: config.domain };
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`Missing required environment variable: ${name}`);
	return value;
}

export function readConfigFromEnv(): DeployConfig {
	return {
		apiUrl: requireEnv('COOLIFY_API_URL'),
		apiToken: requireEnv('COOLIFY_API_TOKEN'),
		name: requireEnv('COOLIFY_NAME'),
		gitBranch: requireEnv('COOLIFY_GIT_BRANCH'),
		domain: requireEnv('COOLIFY_DOMAIN'),
		healthCheckPath: requireEnv('COOLIFY_HEALTH_CHECK_PATH'),
		projectUuid: requireEnv('COOLIFY_PROJECT_UUID'),
		serverUuid: requireEnv('COOLIFY_SERVER_UUID'),
		environmentName: requireEnv('COOLIFY_ENVIRONMENT_NAME'),
		privateKeyUuid: requireEnv('COOLIFY_PRIVATE_KEY_UUID'),
		gitRepository: requireEnv('COOLIFY_GIT_REPOSITORY'),
		port: requireEnv('COOLIFY_PORT'),
		buildPack: requireEnv('COOLIFY_BUILD_PACK'),
		envVars: JSON.parse(requireEnv('COOLIFY_ENV_VARS_JSON'))
	};
}

if (import.meta.main) {
	const result = await deploy(readConfigFromEnv());
	console.log(JSON.stringify(result));
}
