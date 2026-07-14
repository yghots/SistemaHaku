import { Cliente } from '@prisma/client';
import { ClienteResponseDto } from './dto/cliente-response.dto';

export class ClientesMapper {
  static toResponseDto(cliente: Cliente): ClienteResponseDto {
    return new ClienteResponseDto({
      id: cliente.id.toString(),
      nombreCompleto: cliente.nombreCompleto,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      documentoIdentidad: cliente.documentoIdentidad,
    });
  }

  static toResponseDtoList(clientes: Cliente[]): ClienteResponseDto[] {
    return clientes.map((cliente) => ClientesMapper.toResponseDto(cliente));
  }
}
