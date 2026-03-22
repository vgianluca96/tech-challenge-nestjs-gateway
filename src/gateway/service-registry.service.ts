import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceRegistry, MicroserviceConfig } from './interfaces';

@Injectable()
export class ServiceRegistryService {
  private services: ServiceRegistry;

  constructor(private configService: ConfigService) {
    this.initializeServices();
  }

  private initializeServices() {
    this.services = {
      auth: {
        name: 'Auth Service',
        baseUrl: this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3000'),
        healthCheck: '/health',
        timeout: 5000,
      },
      // Add more microservices here as your app grows
      // users: {
      //   name: 'Users Service', 
      //   baseUrl: this.configService.get<string>('USERS_SERVICE_URL', 'http://localhost:3002'),
      //   healthCheck: '/health',
      //   timeout: 5000,
      // },
      // orders: {
      //   name: 'Orders Service',
      //   baseUrl: this.configService.get<string>('ORDERS_SERVICE_URL', 'http://localhost:3003'),
      //   healthCheck: '/health',
      //   timeout: 5000,
      // }
    };
  }

  getService(serviceName: string): MicroserviceConfig | null {
    return this.services[serviceName] || null;
  }

  getAllServices(): ServiceRegistry {
    return this.services;
  }

  isServiceRegistered(serviceName: string): boolean {
    return serviceName in this.services;
  }

  // Route mapping - determines which service handles which routes
  getServiceByRoute(path: string): string | null {
    if (path.startsWith('/auth')) {
      return 'auth';
    }

    // Add more route mappings here
    // if (path.startsWith('/users')) {
    //   return 'users';
    // }
    // if (path.startsWith('/orders')) {
    //   return 'orders';
    // }

    return null;
  }
}
