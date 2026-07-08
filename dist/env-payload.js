export function buildEnvBulkPayload(envVars) {
    return {
        data: Object.entries(envVars).map(([key, value]) => ({ key, value, is_literal: true }))
    };
}
//# sourceMappingURL=env-payload.js.map