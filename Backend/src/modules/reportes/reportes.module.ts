import { Module } from '@nestjs/common';
import { REPORTES_REPOSITORY } from './interfaces/reportes-repository.interface';
import { ReportesController } from './reportes.controller';
import { ReportesRepository } from './reportes.repository';
import { ReportesService } from './reportes.service';

@Module({
  controllers: [ReportesController],
  providers: [
    ReportesService,
    { provide: REPORTES_REPOSITORY, useClass: ReportesRepository },
  ],
})
export class ReportesModule {}
