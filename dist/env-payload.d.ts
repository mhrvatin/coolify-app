export declare function buildEnvBulkPayload(envVars: Record<string, string>): {
    data: {
        key: string;
        value: string;
        is_literal: boolean;
    }[];
};
