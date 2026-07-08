// infra/coolify/client.test.ts
import { describe, expect, mock, test } from 'bun:test';
import { coolifyRequest } from './client.js';

const config = { apiUrl: 'https://coolify.example.com/api/v1', apiToken: 'test-token' };

describe('coolifyRequest', () => {
	test('sends bearer auth and parses a JSON body', async () => {
		const fetchMock = mock(
			async () => new Response(JSON.stringify({ uuid: 'abc' }), { status: 200 })
		);
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const result = await coolifyRequest<{ uuid: string }>(config, '/applications');

		expect(result).toEqual({ uuid: 'abc' });
		const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://coolify.example.com/api/v1/applications');
		expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
	});

	test('returns undefined for an empty successful response body', async () => {
		globalThis.fetch = mock(
			async () => new Response('', { status: 200 })
		) as unknown as typeof fetch;

		const result = await coolifyRequest(config, '/deploy?uuid=abc');

		expect(result).toBeUndefined();
	});

	test('throws with status on a non-ok response, without leaking the response body', async () => {
		globalThis.fetch = mock(
			async () => new Response('{"key":"DATABASE_URL","value":"secret-password"}', { status: 400 })
		) as unknown as typeof fetch;

		let error: unknown;
		try {
			await coolifyRequest(config, '/applications', { method: 'POST' });
		} catch (caught) {
			error = caught;
		}

		expect(String(error)).toContain('Coolify API POST /applications failed: 400');
		expect(String(error)).not.toContain('secret-password');
	});
});
