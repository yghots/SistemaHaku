import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePedidoDto } from './create-pedido.dto';

// sucursalId, clienteId y creadoPorId no son editables tras la creacion
// (identidad del pedido). estado, motorizadoActualId y codigoPedido
// tampoco: quedan fuera del alcance de esta fase (ver
// DEVELOPMENT_PROGRESS.md, Fase 7).
export class UpdatePedidoDto extends PartialType(
  OmitType(CreatePedidoDto, [
    'sucursalId',
    'clienteId',
    'creadoPorId',
  ] as const),
) {}
