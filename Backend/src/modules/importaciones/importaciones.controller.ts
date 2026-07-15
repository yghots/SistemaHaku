import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ConfirmarImportacionQueryDto } from './dto/confirmar-importacion-query.dto';
import { FormatoImportacionQueryDto } from './dto/formato-importacion-query.dto';
import { ImportacionHistorialDetalleDto } from './dto/importacion-historial-detalle.dto';
import { ImportacionHistorialItemDto } from './dto/importacion-historial-item.dto';
import { ListarHistorialQueryDto } from './dto/listar-historial-query.dto';
import { ResultadoImportacionDto } from './dto/resultado-importacion.dto';
import { ImportacionesService } from './importaciones.service';

const LIMITE_ARCHIVO_BYTES = 10 * 1024 * 1024;

// Centro de Importaciones (Fase 19): unico punto de entrada para
// importacion masiva de Clientes, Tiendas y Motorizados. Infraestructura
// preparada para futuras entidades (agregar un importador nuevo, no un
// controller nuevo).
@ApiTags('Importaciones')
@Controller('importaciones')
export class ImportacionesController {
  constructor(private readonly importacionesService: ImportacionesService) {}

  @Get(':entidad/plantilla')
  @ApiOperation({
    summary:
      'Descarga la plantilla oficial de una entidad en el formato pedido',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'application/xml',
  )
  @ApiResponse({ status: 200, description: 'Plantilla oficial' })
  @ApiResponse({
    status: 404,
    description: 'Plantilla no disponible para el formato pedido',
  })
  async descargarPlantilla(
    @Param('entidad') entidad: string,
    @Query() query: FormatoImportacionQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const archivo = await this.importacionesService.obtenerPlantilla(
      entidad,
      query.formato,
    );
    return this.enviarArchivo(
      res,
      archivo.buffer,
      archivo.mimeType,
      archivo.nombreArchivo,
    );
  }

  @Post(':entidad/analizar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Analiza un archivo de importacion sin escribir nada (vista previa): valida y detecta duplicados',
  })
  @ApiResponse({ status: 200, type: ResultadoImportacionDto })
  @ApiResponse({ status: 400, description: 'Archivo o parametros invalidos' })
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: LIMITE_ARCHIVO_BYTES } }),
  )
  async analizar(
    @Param('entidad') entidad: string,
    @Query() query: FormatoImportacionQueryDto,
    @UploadedFile() archivo: Express.Multer.File,
  ): Promise<ResultadoImportacionDto> {
    this.exigirArchivo(archivo);
    return this.importacionesService.analizar(
      entidad,
      query.formato,
      archivo.buffer,
    );
  }

  @Post(':entidad/confirmar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Confirma la importacion: crea los registros validos (transaccional por fila) y persiste el historial',
  })
  @ApiResponse({ status: 200, type: ResultadoImportacionDto })
  @ApiResponse({ status: 400, description: 'Archivo o parametros invalidos' })
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: LIMITE_ARCHIVO_BYTES } }),
  )
  async confirmar(
    @Param('entidad') entidad: string,
    @Query() query: ConfirmarImportacionQueryDto,
    @UploadedFile() archivo: Express.Multer.File,
  ): Promise<ResultadoImportacionDto> {
    this.exigirArchivo(archivo);
    return this.importacionesService.confirmar(
      entidad,
      query.formato,
      archivo.buffer,
      archivo.originalname,
      BigInt(query.usuarioId),
    );
  }

  @Get('historial')
  @ApiOperation({
    summary: 'Historial de importaciones (paginado, filtrable por entidad)',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado del historial' })
  async listarHistorial(
    @Query() query: ListarHistorialQueryDto,
  ): Promise<PaginatedResponseDto<ImportacionHistorialItemDto>> {
    return this.importacionesService.listarHistorial(query);
  }

  @Get('historial/:id')
  @ApiOperation({
    summary:
      'Detalle de una importacion, incluidas sus filas duplicadas/invalidas',
  })
  @ApiResponse({ status: 200, type: ImportacionHistorialDetalleDto })
  @ApiResponse({ status: 404, description: 'Historial no encontrado' })
  async obtenerDetalle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ImportacionHistorialDetalleDto> {
    return this.importacionesService.obtenerHistorialDetalle(BigInt(id));
  }

  @Get('historial/:id/reporte-errores')
  @ApiOperation({
    summary:
      'Descarga (o vuelve a descargar) el reporte de errores en xlsx de una importacion',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiResponse({ status: 200, description: 'Reporte de errores en xlsx' })
  @ApiResponse({ status: 404, description: 'Historial no encontrado' })
  async descargarReporteErrores(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const archivo = await this.importacionesService.obtenerReporteErrores(
      BigInt(id),
    );
    return this.enviarArchivo(
      res,
      archivo.buffer,
      archivo.mimeType,
      archivo.nombreArchivo,
    );
  }

  private exigirArchivo(archivo: Express.Multer.File): void {
    if (!archivo) {
      throw new BadRequestException('Debe adjuntar un archivo');
    }
  }

  /** Unico punto que fija los headers de descarga — reutilizado por plantilla y reporte de errores. */
  private enviarArchivo(
    res: Response,
    buffer: Buffer,
    mimeType: string,
    nombreArchivo: string,
  ): StreamableFile {
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    });
    return new StreamableFile(buffer);
  }
}
