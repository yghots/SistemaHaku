import { ApiProperty } from '@nestjs/swagger';
import { TipoFoto } from '@prisma/client';

/**
 * Metadata de una foto (Fase 22) — nunca incluye el binario (`imagen`,
 * LONGBLOB): traerlo en el listado paginado seria enormemente ineficiente.
 * El binario se sirve por separado via `GET /pedidos/:id/fotos/:fotoId/imagen`.
 */
export class FotoEntregaResponseDto {
  @ApiProperty({ description: 'Identificador unico de la foto' })
  id: string;

  @ApiProperty({ description: 'Id del pedido asociado' })
  pedidoId: string;

  @ApiProperty({ description: 'Id del motorizado que tomo la foto' })
  motorizadoId: string;

  @ApiProperty({ description: 'Tipo de foto', enum: TipoFoto })
  tipo: TipoFoto;

  @ApiProperty({
    description:
      'Tipo MIME de la imagen almacenada (Fase 22, siempre image/webp)',
  })
  mimeType: string;

  @ApiProperty({ description: 'Marca la foto principal de ese tipo' })
  esPrincipal: boolean;

  constructor(partial: FotoEntregaResponseDto) {
    Object.assign(this, partial);
  }
}
