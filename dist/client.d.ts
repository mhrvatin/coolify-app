export interface CoolifyClientConfig {
    apiUrl: string;
    apiToken: string;
}
export declare function coolifyRequest<T = undefined>(config: CoolifyClientConfig, path: string, init?: RequestInit): Promise<T>;
