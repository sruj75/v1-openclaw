export type RelayConfig = {
  environment: string;
  serviceName: string;
};

export function loadConfig(env: Record<string, string | undefined> = {}): RelayConfig {
  return {
    environment: env.NODE_ENV ?? "development",
    serviceName: env.SERVICE_NAME ?? "intentive-relay"
  };
}
