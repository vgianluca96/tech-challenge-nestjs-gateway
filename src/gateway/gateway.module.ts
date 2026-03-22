import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayController } from './gateway.controller';
import { ProxyService } from './proxy.service';
import { ServiceRegistryService } from './service-registry.service';
import { GatewayAuthGuard } from './gateway-auth.guard';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '8h',
        },
      }),
    }),
  ],
  controllers: [GatewayController],
  providers: [ProxyService, ServiceRegistryService, GatewayAuthGuard],
  exports: [ProxyService, ServiceRegistryService],
})
export class GatewayModule { }
