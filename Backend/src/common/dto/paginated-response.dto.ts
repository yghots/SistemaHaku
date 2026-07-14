import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Resultados de la pagina actual',
    isArray: true,
  })
  data: T[];

  @ApiProperty({ description: 'Total de registros disponibles (sin paginar)' })
  total: number;

  @ApiProperty({ description: 'Pagina actual' })
  page: number;

  @ApiProperty({ description: 'Cantidad de resultados por pagina' })
  limit: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}
