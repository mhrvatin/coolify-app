import { buildCreatePayload, buildDesiredConfigPayload } from './application-payload';
import { coolifyRequest } from './client';
import { buildEnvBulkPayload } from './env-payload';
function clientConfig(inputs) {
    return { apiUrl: inputs.apiUrl, apiToken: inputs.apiToken };
}
async function syncEnvAndDeploy(inputs, uuid) {
    await coolifyRequest(clientConfig(inputs), `/applications/${uuid}/envs/bulk`, {
        method: 'PATCH',
        body: JSON.stringify(buildEnvBulkPayload(inputs.envVars))
    });
    await coolifyRequest(clientConfig(inputs), `/deploy?uuid=${uuid}`);
}
function outputsOf(uuid, inputs) {
    return { ...inputs, uuid };
}
export const applicationProvider = {
    async create(inputs) {
        const created = await coolifyRequest(clientConfig(inputs), '/applications/private-deploy-key', { method: 'POST', body: JSON.stringify(buildCreatePayload(inputs)) });
        try {
            await syncEnvAndDeploy(inputs, created.uuid);
        }
        catch (error) {
            // The app now exists in Coolify, but this throw means Pulumi never records its uuid in
            // state — the next `pulumi up` will re-run create() and orphan a duplicate app. Logging
            // the uuid here is what makes that orphan recoverable by hand.
            console.error(`Coolify app ${created.uuid} was created but env sync/deploy failed; it is orphaned from Pulumi state.`);
            throw error;
        }
        return { id: created.uuid, outs: outputsOf(created.uuid, inputs) };
    },
    async update(id, _olds, news) {
        await coolifyRequest(clientConfig(news), `/applications/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(buildDesiredConfigPayload(news))
        });
        await syncEnvAndDeploy(news, id);
        return { outs: outputsOf(id, news) };
    },
    async delete(id, props) {
        await coolifyRequest(clientConfig(props), `/applications/${id}`, { method: 'DELETE' });
    },
    // NOTE: diff() treats all fields (except apiToken) as if they were mutable via update().
    // In reality, update() only PATCHes the fields in buildDesiredConfigPayload (name, gitBranch,
    // domain, healthCheckPath) — projectUuid/serverUuid/privateKeyUuid/gitRepository/environmentName
    // are create-only identifiers. If one of those changes, Pulumi will call update(), which will
    // silently record the new value in Pulumi state without ever sending it to Coolify (state/reality
    // drift). These identifiers are set once at bootstrap time and not expected to change; if that
    // assumption breaks, diff() should mark them via DiffResult.replaces instead.
    async diff(_id, olds, news) {
        const keys = Object.keys(news);
        const changes = keys.some((key) => {
            if (key === 'apiToken')
                return false;
            return JSON.stringify(olds[key]) !== JSON.stringify(news[key]);
        });
        return { changes };
    }
};
//# sourceMappingURL=application-provider.js.map