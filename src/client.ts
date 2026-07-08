export interface CoolifyClientConfig {
	apiUrl: string;
	apiToken: string;
}

export async function coolifyRequest<T = undefined>(
	config: CoolifyClientConfig,
	path: string,
	init?: RequestInit
): Promise<T> {
	if (!config.apiUrl.startsWith('https://')) {
		throw new Error(`Coolify apiUrl must use https://, got: ${config.apiUrl}`);
	}
	const response = await fetch(`${config.apiUrl}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${config.apiToken}`,
			'Content-Type': 'application/json',
			...init?.headers
		}
	});
	if (!response.ok) {
		// Never include the response body: PATCH requests carry secrets (DATABASE_URL,
		// SESSION_SECRET, GEMINI_API_KEY) in their payload, and Coolify may echo the submitted
		// body back on a validation error — this error message ends up in `pulumi up` output and
		// CI logs, and no truncation length is safe against leaking a secret value.
		throw new Error(
			`Coolify API ${init?.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText}`
		);
	}
	const text = await response.text();
	return (text ? JSON.parse(text) : undefined) as T;
}
