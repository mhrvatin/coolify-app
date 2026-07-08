import { describe, expect, test } from 'bun:test';
import { buildEnvBulkPayload } from './env-payload.js';

describe('buildEnvBulkPayload', () => {
	test('maps a record into Coolify bulk-env entries', () => {
		expect(buildEnvBulkPayload({ DATABASE_URL: 'postgres://x', NODE_ENV: 'production' })).toEqual({
			data: [
				{ key: 'DATABASE_URL', value: 'postgres://x', is_literal: true },
				{ key: 'NODE_ENV', value: 'production', is_literal: true }
			]
		});
	});
});
