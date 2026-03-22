import { Injectable, BadGatewayException, RequestTimeoutException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { catchError, timeout, map } from 'rxjs/operators';
import { throwError, Observable } from 'rxjs';
import { ServiceRegistryService } from './service-registry.service';

@Injectable()
export class ProxyService {
  constructor(
    private httpService: HttpService,
    private serviceRegistry: ServiceRegistryService,
  ) {}

  async forwardRequest(
    serviceName: string,
    path: string,
    method: string,
    data?: any,
    headers?: Record<string, string>,
    query?: Record<string, any>
  ): Promise<any> {
    const service = this.serviceRegistry.getService(serviceName);
    
    if (!service) {
      throw new BadGatewayException('Service not found: ' + serviceName);
    }

    try {
      const config: AxiosRequestConfig = {
        url: service.baseUrl + path,
        method: method.toLowerCase() as any,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: service.timeout || 5000,
      };

      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }

      if (query && Object.keys(query).length > 0) {
        config.params = query;
      }

      const response = await this.httpService.request(config).pipe(
        timeout(service.timeout || 5000),
        map((response: AxiosResponse) => response.data),
        catchError((error) => {
          console.error('Proxy error:', error.message);
          
          if (error.code === 'ECONNREFUSED') {
            return throwError(new BadGatewayException('Service unavailable: ' + serviceName));
          }
          
          if (error.name === 'TimeoutError') {
            return throwError(new RequestTimeoutException('Service timeout: ' + serviceName));
          }

          // Forward the error response from the microservice
          if (error.response) {
            return throwError({
              ...error.response.data,
              statusCode: error.response.status,
            });
          }

          return throwError(new BadGatewayException('Service communication error'));
        })
      ).toPromise();

      return response;

    } catch (error) {
      console.error('Service communication error:', error);
      throw error;
    }
  }

  // Health check for services
  async checkServiceHealth(serviceName: string): Promise<boolean> {
    try {
      const service = this.serviceRegistry.getService(serviceName);
      if (!service || !service.healthCheck) {
        return false;
      }

      const response = await this.httpService.get(
        service.baseUrl + service.healthCheck, 
        { timeout: 3000 }
      ).toPromise();

      return response?.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get health status of all services
  async getServicesHealth(): Promise<Record<string, boolean>> {
    const services = this.serviceRegistry.getAllServices();
    const healthChecks = await Promise.allSettled(
      Object.keys(services).map(async (serviceName) => ({
        name: serviceName,
        healthy: await this.checkServiceHealth(serviceName)
      }))
    );

    const health: Record<string, boolean> = {};
    healthChecks.forEach((check) => {
      if (check.status === 'fulfilled') {
        health[check.value.name] = check.value.healthy;
      }
    });

    return health;
  }
}
