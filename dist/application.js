// infra/coolify/application.ts
import * as pulumi from '@pulumi/pulumi';
import { applicationProvider } from './application-provider';
export class CoolifyApplication extends pulumi.dynamic.Resource {
    constructor(name, args, opts) {
        super(applicationProvider, name, { ...args, uuid: undefined }, { ...opts, additionalSecretOutputs: ['apiToken', 'envVars'] });
    }
}
//# sourceMappingURL=application.js.map