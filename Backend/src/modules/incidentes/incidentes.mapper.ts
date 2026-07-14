import { Incidente } from '@prisma/client';
import { IncidenteResponseDto } from './dto/incidente-response.dto';

export class IncidentesMapper {
  static toResponseDto(incidente: Incidente): IncidenteResponseDto {
    return new IncidenteResponseDto({
      id: incidente.id.toString(),
      pedidoId: incidente.pedidoId?.toString() ?? null,
      motorizadoId: incidente.motorizadoId.toString(),
      tipo: incidente.tipo,
      resuelto: incidente.resuelto,
    });
  }

  static toResponseDtoList(incidentes: Incidente[]): IncidenteResponseDto[] {
    return incidentes.map((incidente) =>
      IncidentesMapper.toResponseDto(incidente),
    );
  }
}
