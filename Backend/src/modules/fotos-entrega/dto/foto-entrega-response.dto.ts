import { ApiProperty } from '@nestjs/swagger';
import { TipoFoto } from '@prisma/client';

export class FotoEntregaResponseDto {
  @ApiProperty({ description: 'Identificador unico de la foto' })
  id: string;

  @ApiProperty({ description: 'Id del pedido asociado' })
  pedidoId: string;

  @ApiProperty({ description: 'Id del motorizado que tomo la foto' })
  motorizadoId: string;

  @ApiProperty({ description: 'Tipo de foto', enum: TipoFoto })
  tipo: TipoFoto;

  @ApiProperty({ description: 'URL de la imagen almacenada' })
  urlImagen: string;

  @ApiProperty({ description: 'Marca la foto principal de ese tipo' })
  esPrincipal: boolean;

  constructor(partial: FotoEntregaResponseDto) {
    Object.assign(this, partial);
  }
}
