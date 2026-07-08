export async function coolifyRequest(config, path, init) {
    const response = await fetch(`${config.apiUrl}${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'application/json',
            ...init?.headers
        }
    });
    if (!response.ok) {
        // Cap the body length: PATCH requests carry secrets (DATABASE_URL, SESSION_SECRET,
        // GEMINI_API_KEY) in their payload, and Coolify may echo the submitted body back on
        // a validation error — this error message ends up in `pulumi up` output and CI logs.
        const body = (await response.text()).slice(0, 200);
        throw new Error(`Coolify API ${init?.method ?? 'GET'} ${path} failed: ${response.status} ${body}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined);
}
//# sourceMappingURL=client.js.map