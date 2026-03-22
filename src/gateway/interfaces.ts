export interface MicroserviceConfig {
  name: string;
  baseUrl: string;
  healthCheck?: string;
  timeout?: number;
}

export interface ServiceRegistry {
  [serviceName: string]: MicroserviceConfig;
}
