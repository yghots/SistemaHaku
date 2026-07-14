import { ApiProperty } from '@nestjs/swagger';
import { EstadoMotorizado } from '@prisma/client';

export class ReporteMotorizadoItemDto {
  @ApiProperty({ description: 'Id del perfil de motorizado' })
  motorizadoId: string;

  @ApiProperty({ description: 'Nombres del usuario asociado (Fase 17)' })
  nombres: string;

  @ApiProperty({ description: 'Apellidos del usuario asociado (Fase 17)' })
  apellidos: string;

  @ApiProperty({ description: 'Placa del vehiculo' })
  placa: string;

  @ApiProperty({
    description: 'Estado operativo actual del motorizado',
    enum: EstadoMotorizado,
  })
  estado: EstadoMotorizado;

  @ApiProperty({
    description:
      'Cantidad de pedidos donde este motorizado es el motorizado asignado actualmente',
  })
  pedidosAtendidos: number;

  @ApiProperty({ description: 'Cantidad de pedidos entregados' })
  entregas: number;

  @ApiProperty({ description: 'Cantidad de incidentes reportados' })
  incidentes: number;

  @ApiProperty({
    description:
      'Tasa de entregas exitosas: (entregas / pedidosAtendidos) * 100. 0 si no tiene pedidos atendidos',
  })
  productividad: number;

  constructor(partial: ReporteMotorizadoItemDto) {
    Object.assign(this, partial);
  }
}
