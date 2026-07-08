import * as pulumi from '@pulumi/pulumi';

const DEFAULT_STACK_REFERENCE = 'pulumi-com-hrvatin-se/infra-hetzner/hrvatin.se';

export interface PostgresOptions {
	/** Defaults to infra-hetzner's production stack. */
	stackReference?: string;
	/** Key to look up in that stack's `databaseUrls` output; defaults to the app name. */
	databaseKey?: pulumi.Input<string>;
}

/**
 * Reads a per-app connection string out of infra-hetzner's shared Postgres StackReference
 * (see infra-hetzner's `databaseUrls` output — one role+database per app, provisioned there).
 */
export function getPostgresDatabaseUrl(
	appName: pulumi.Input<string>,
	options: PostgresOptions
): pulumi.Output<string> {
	const infra = new pulumi.StackReference(options.stackReference ?? DEFAULT_STACK_REFERENCE);
	const key = options.databaseKey ?? appName;

	const resolved = pulumi
		.all([infra.getOutput('databaseUrls'), key])
		.apply(([urls, resolvedKey]) => {
			const url = (urls as Record<string, string> | undefined)?.[resolvedKey as string];
			if (!url) {
				throw new Error(
					`No databaseUrls entry for key "${resolvedKey}" in stack reference "${options.stackReference ?? DEFAULT_STACK_REFERENCE}"`
				);
			}
			return url;
		});

	// Force-mark as secret in our own state regardless of whether infra-hetzner exported
	// `databaseUrls` as secret — `StackReference` has no getSecretOutput, so this is the only way
	// to guarantee DATABASE_URL (a connection string with a password) never lands in plain state.
	return pulumi.secret(resolved);
}
