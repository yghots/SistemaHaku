import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ExportArchivo,
  ExportColumna,
} from '../../common/exports/export.types';
import { ExportService } from '../../common/exports/export.service';
import { ImportReaderService } from '../../common/imports/import-reader.service';
import type { FormatoImportacion } from '../../common/imports/import.types';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { assertFound } from '../../common/utils/assert-found.util';
import { esArchivoZip } from '../../common/utils/firma-archivo.util';
import { UsuariosService } from '../usuarios/usuarios.service';
import { ImportacionHistorialDetalleDto } from './dto/importacion-historial-detalle.dto';
import { ImportacionHistorialItemDto } from './dto/importacion-historial-item.dto';
import { ListarHistorialQueryDto } from './dto/listar-historial-query.dto';
import { ResultadoFilaDto } from './dto/resultado-fila.dto';
import { ResultadoImportacionDto } from './dto/resultado-importacion.dto';
import { ClientesImportador } from './importadores/clientes.importador';
import { MotorizadosImportador } from './importadores/motorizados.importador';
import type {
  IEntidadImportador,
  ResultadoFilaImportador,
} from './importadores/resultado-fila.types';
import { TiendasImportador } from './importadores/tiendas.importador';
import {
  EntidadImportacion,
  MIME_POR_FORMATO,
  NOMBRE_PLANTILLA_POR_ENTIDAD,
  esEntidadImportacion,
} from './importaciones.constants';
import { ImportacionesMapper } from './importaciones.mapper';
import { IMPORTACIONES_REPOSITORY } from './interfaces/importaciones-repository.interface';
import type { IImportacionesRepository } from './interfaces/importaciones-repository.interface';

const PLANTILLAS_DIR = join(__dirname, 'plantillas');

const COLUMNAS_REPORTE_ERRORES: ExportColumna[] = [
  { clave: 'fila', encabezado: 'Fila' },
  { clave: 'estado', encabezado: 'Estado' },
  { clave: 'motivo', encabezado: 'Motivo' },
  { clave: 'campo', encabezado: 'Campo' },
  { clave: 'valor', encabezado: 'Valor' },
];

const TITULO_POR_ENTIDAD: Record<EntidadImportacion, string> = {
  cliente: 'Reporte de Errores — Importacion de Clientes',
  tienda: 'Reporte de Errores — Importacion de Tiendas',
  motorizado: 'Reporte de Errores — Importacion de Motorizados',
};

/**
 * Orquesta el pipeline completo de importacion (Fase 19): Lector (agnostico
 * de entidad, `common/imports`) -> Importador de la entidad (valida +
 * detecta duplicados + opcionalmente crea) -> Historial (solo se persiste
 * al confirmar). Nunca genera un archivo de reporte el mismo: delega en
 * `ExportService` (Fase 18), igual que `ReportesService`.
 */
@Injectable()
export class ImportacionesService {
  constructor(
    private readonly importReaderService: ImportReaderService,
    private readonly clientesImportador: ClientesImportador,
    private readonly tiendasImportador: TiendasImportador,
    private readonly motorizadosImportador: MotorizadosImportador,
    private readonly exportService: ExportService,
    private readonly usuariosService: UsuariosService,
    @Inject(IMPORTACIONES_REPOSITORY)
    private readonly importacionesRepository: IImportacionesRepository,
  ) {}

  async analizar(
    entidad: string,
    formato: FormatoImportacion,
    buffer: Buffer,
  ): Promise<ResultadoImportacionDto> {
    const entidadValida = this.validarEntidad(entidad);
    const { resultado } = await this.procesarArchivo(
      entidadValida,
      formato,
      buffer,
      true,
    );
    return resultado;
  }

  async confirmar(
    entidad: string,
    formato: FormatoImportacion,
    buffer: Buffer,
    archivoNombre: string,
    usuarioId: bigint,
  ): Promise<ResultadoImportacionDto> {
    const entidadValida = this.validarEntidad(entidad);
    // Se valida ANTES de procesar cualquier fila: `usuarioId` referencia el
    // historial (FK). Si no existiera, las filas ya se habrian creado sin
    // que quede ningun registro de auditoria — exactamente el "estado
    // inconsistente" que esta fase pide evitar.
    await this.usuariosService.buscarPorId(usuarioId);

    const { resultado, detalles, totalEncontrados } =
      await this.procesarArchivo(entidadValida, formato, buffer, false);

    const estado =
      resultado.importados === totalEncontrados ? 'completado' : 'parcial';

    const historial = await this.importacionesRepository.crearHistorial({
      entidad: entidadValida,
      archivoNombre,
      formato,
      usuarioId,
      totalEncontrados,
      importados: resultado.importados,
      duplicados: resultado.duplicados,
      errores: resultado.errores,
      tiempoProcesamientoMs: resultado.tiempoProcesamientoMs,
      estado,
      detalles,
    });

    return { ...resultado, historialId: historial.id.toString(), estado };
  }

  async listarHistorial(
    query: ListarHistorialQueryDto,
  ): Promise<PaginatedResponseDto<ImportacionHistorialItemDto>> {
    const { data, total } =
      await this.importacionesRepository.buscarMuchoHistorial({
        skip: query.skip,
        take: query.limit,
        entidad: query.entidad,
      });

    return new PaginatedResponseDto(
      ImportacionesMapper.toHistorialItemDtoList(data),
      total,
      query.page,
      query.limit,
    );
  }

  async obtenerHistorialDetalle(
    id: bigint,
  ): Promise<ImportacionHistorialDetalleDto> {
    const historial =
      await this.importacionesRepository.buscarHistorialPorId(id);
    return ImportacionesMapper.toHistorialDetalleDto(
      assertFound(historial, 'Historial de importacion no encontrado'),
    );
  }

  async obtenerReporteErrores(id: bigint): Promise<ExportArchivo> {
    const historial =
      await this.importacionesRepository.buscarHistorialPorId(id);
    const encontrado = assertFound(
      historial,
      'Historial de importacion no encontrado',
    );

    const filas = encontrado.detalles.map((detalle) => ({
      fila: detalle.fila,
      estado: detalle.estado,
      motivo: detalle.motivo,
      campo: detalle.campo ?? '',
      valor: detalle.valor ?? '',
    }));

    return this.exportService.exportar('xlsx', {
      titulo: TITULO_POR_ENTIDAD[encontrado.entidad],
      columnas: COLUMNAS_REPORTE_ERRORES,
      filas,
      filtros: {
        archivo: encontrado.archivoNombre,
        formato: encontrado.formato,
      },
      generadoPor:
        `${encontrado.usuario.nombres} ${encontrado.usuario.apellidos}`.trim(),
      generadoEn: new Date(),
    });
  }

  async obtenerPlantilla(
    entidad: string,
    formato: FormatoImportacion,
  ): Promise<{ buffer: Buffer; mimeType: string; nombreArchivo: string }> {
    const entidadValida = this.validarEntidad(entidad);
    const base = NOMBRE_PLANTILLA_POR_ENTIDAD[entidadValida];
    const nombreArchivo = `plantilla-${base}.${formato}`;
    const ruta = join(PLANTILLAS_DIR, `${base}.${formato}`);

    try {
      const buffer = await readFile(ruta);
      return { buffer, mimeType: MIME_POR_FORMATO[formato], nombreArchivo };
    } catch {
      throw new NotFoundException('Plantilla no disponible para este formato');
    }
  }

  private async procesarArchivo(
    entidad: EntidadImportacion,
    formato: FormatoImportacion,
    buffer: Buffer,
    dryRun: boolean,
  ): Promise<{
    resultado: Omit<ResultadoImportacionDto, 'historialId' | 'estado'>;
    detalles: {
      fila: number;
      estado: 'duplicado' | 'invalido';
      motivo: string;
      campo?: string;
      valor?: string;
    }[];
    totalEncontrados: number;
  }> {
    this.validarFirmaArchivo(formato, buffer);

    const inicio = Date.now();
    const filasCrudas = await this.importReaderService.leer(formato, buffer);
    const importador = this.obtenerImportador(entidad);

    let importados = 0;
    const filas: ResultadoFilaDto[] = [];

    for (let indice = 0; indice < filasCrudas.length; indice += 1) {
      const numeroFila = indice + 1;
      const filaCruda = filasCrudas[indice];
      // Secuencial a proposito: cada fila se procesa de forma independiente
      // y transaccional, nunca en paralelo (ver Fase 19, seccion "IMPORTACIÓN").
      // Red de seguridad: una excepcion inesperada de UNA fila (ej. una
      // condicion de carrera, o un caso limite que el importador no
      // clasifico explicitamente) nunca debe cancelar el archivo completo
      // — se reporta como esa fila invalida y se continua con las demas.
      const resultadoFila = await this.procesarFilaSinFallar(
        importador,
        filaCruda,
        dryRun,
      );

      if (resultadoFila.estado === 'importado') {
        importados += 1;
        continue;
      }

      filas.push({
        fila: numeroFila,
        estado: resultadoFila.estado,
        motivo: resultadoFila.motivo ?? 'Registro no importado',
        campo: resultadoFila.campo,
        valor: resultadoFila.valor,
      });
    }

    const duplicados = filas.filter(
      (fila) => fila.estado === 'duplicado',
    ).length;
    const errores = filas.filter((fila) => fila.estado === 'invalido').length;
    const tiempoProcesamientoMs = Date.now() - inicio;

    return {
      resultado: {
        totalEncontrados: filasCrudas.length,
        importados,
        duplicados,
        errores,
        tiempoProcesamientoMs,
        filas,
      },
      detalles: filas.map((fila) => ({
        fila: fila.fila,
        estado: fila.estado,
        motivo: fila.motivo,
        campo: fila.campo,
        valor: fila.valor,
      })),
      totalEncontrados: filasCrudas.length,
    };
  }

  /**
   * Envuelve `importador.procesarFila` para que ninguna excepcion
   * inesperada (ej. una condicion de carrera entre el chequeo de duplicado
   * y la escritura real) escape del procesamiento de una fila individual —
   * requisito explicito de esta fase: "si una fila falla, no cancelar la
   * importacion completa".
   */
  private async procesarFilaSinFallar(
    importador: IEntidadImportador,
    fila: Record<string, string>,
    dryRun: boolean,
  ): Promise<ResultadoFilaImportador> {
    try {
      return await importador.procesarFila(fila, dryRun);
    } catch (error) {
      return {
        estado: 'invalido',
        motivo:
          error instanceof HttpException
            ? error.message
            : 'No se pudo procesar la fila',
      };
    }
  }

  private obtenerImportador(entidad: EntidadImportacion): IEntidadImportador {
    switch (entidad) {
      case 'cliente':
        return this.clientesImportador;
      case 'tienda':
        return this.tiendasImportador;
      case 'motorizado':
        return this.motorizadosImportador;
    }
  }

  private validarEntidad(entidad: string): EntidadImportacion {
    if (!esEntidadImportacion(entidad)) {
      throw new BadRequestException(
        'La entidad debe ser una de: cliente, tienda, motorizado',
      );
    }
    return entidad;
  }

  /**
   * Fase 29 (correccion A8 de la auditoria): el `formato` recibido por query
   * param es, hasta este punto, solo una declaracion del cliente — nunca se
   * habia verificado que el archivo realmente sea de ese tipo. Un `.xlsx`
   * real es siempre un contenedor ZIP (firma binaria `PK`); `json`/`xml` son
   * texto plano sin firma binaria propia, y el lector correspondiente ya
   * rechaza contenido malformado al intentar parsearlo (`JsonImportReader`/
   * `XmlImportReader`), asi que no necesitan esta verificacion adicional.
   */
  private validarFirmaArchivo(
    formato: FormatoImportacion,
    buffer: Buffer,
  ): void {
    if (formato === 'xlsx' && !esArchivoZip(buffer)) {
      throw new BadRequestException(
        "El archivo no es un .xlsx valido (firma binaria incorrecta) — verifica que el formato declarado ('xlsx') coincida con el archivo adjunto.",
      );
    }
  }
}
