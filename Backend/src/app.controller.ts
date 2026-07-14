import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Endpoint raiz de verificacion (health check)' })
  @ApiResponse({ status: 200, description: 'La API esta en linea' })
  getHello(): string {
    return this.appService.getHello();
  }
}
