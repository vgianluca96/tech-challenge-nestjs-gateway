import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
  Get,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { ServiceRegistryService } from './service-registry.service';
import { GatewayAuthGuard } from './gateway-auth.guard';

@Controller()
export class GatewayController {
  constructor(
    private proxyService: ProxyService,
    private serviceRegistry: ServiceRegistryService,
  ) {}

  // Health check endpoint for the gateway itself
  @Get('health')
  async healthCheck() {
    const servicesHealth = await this.proxyService.getServicesHealth();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      gateway: 'healthy',
      services: servicesHealth,
    };
  }

  // Gateway info endpoint
  @Get('gateway/info')
  getGatewayInfo() {
    return {
      name: 'API Gateway',
      version: '1.0.0',
      services: this.serviceRegistry.getAllServices(),
    };
  }

  // Main proxy endpoint - handles all requests with wildcard
  @All('*')
  @UseGuards(GatewayAuthGuard)
  async proxyRequest(@Req() request: Request, @Res() response: Response) {
    try {
      const { method, url, body, headers, query } = request;
      
      // Extract the path from URL
      const path = url.split('?')[0];
      
      // Determine which service should handle this request
      const serviceName = this.serviceRegistry.getServiceByRoute(path);
      
      if (!serviceName) {
        throw new HttpException(
          {
            message: 'Route not found',
            statusCode: 404,
            path: path,
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Prepare headers to forward (exclude host and forwarded headers to avoid loops)
      const forwardHeaders: Record<string, string> = {};
      Object.keys(headers).forEach(key => {
        if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
          forwardHeaders[key] = headers[key] as string;
        }
      });

      // Add gateway identification
      forwardHeaders['x-forwarded-by'] = 'api-gateway';
      forwardHeaders['x-forwarded-for'] = request.ip || request.connection.remoteAddress || 'unknown';

      console.log('Proxying request:', {
        method,
        path,
        serviceName,
        query: Object.keys(query).length > 0 ? query : undefined,
      });

      // Forward the request to the appropriate microservice
      const result = await this.proxyService.forwardRequest(
        serviceName,
        path,
        method,
        body,
        forwardHeaders,
        query,
      );

      // Return the response from the microservice
      response.json(result);
      
    } catch (error) {
      console.error('Gateway error:', error);
      
      // Handle different types of errors
      if (error instanceof HttpException) {
        response.status(error.getStatus()).json(error.getResponse());
      } else if (error.statusCode) {
        // Error from microservice
        response.status(error.statusCode).json(error);
      } else {
        // Unexpected error
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Gateway internal error',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        });
      }
    }
  }
}
