/**
 * Genera las 3 plantillas oficiales `.xlsx` del Centro de Importaciones
 * (Clientes, Tiendas, Motorizados) con el estándar unificado de la Fase 26:
 * hoja "Plantilla" vacía (solo encabezados, sin filas de ejemplo) + hoja
 * "Instrucciones" (reglas generales, tabla de campos, regla de duplicados),
 * mismo estilo visual (encabezado azul `#2563EB`, texto blanco negrita,
 * borde delgado, mismo algoritmo de ancho de columna) en las 3.
 *
 * Ejecutado una única vez (Fase 26) para reemplazar los `.xlsx` estáticos
 * en `src/modules/importaciones/plantillas/`. Se conserva en el repositorio
 * (Fase 30, corrección B7 de la auditoría) para que el proceso sea
 * reproducible si un futuro cambio de formato/diseño necesitara
 * regenerarlas — NO se ha vuelto a ejecutar desde entonces.
 *
 * Uso (desde `Backend/`):
 *   npx ts-node scripts/templates/build-plantillas-importacion.ts
 *
 * Sobrescribe directamente los 3 archivos en
 * `src/modules/importaciones/plantillas/*.xlsx` — revisar el resultado
 * (encabezados, hoja de Instrucciones, ausencia de filas de datos) antes de
 * confiar en el archivo generado, tal como se hizo en la Fase 26.
 */
import ExcelJS from 'exceljs';

const AZUL_HEADER = 'FF2563EB';
const GRIS_BORDE = 'FFD1D5DB';
const BLANCO = 'FFFFFFFF';

const REGLAS_GENERALES = [
  'No modifiques los encabezados (primera fila de la hoja "Plantilla").',
  'No elimines columnas.',
  'No cambies el orden de las columnas.',
  'Una fila representa un registro.',
  'Los registros duplicados seran omitidos automaticamente durante la importacion.',
  'Al finalizar la importacion podras descargar un reporte con los registros rechazados (fila, motivo y valor recibido).',
  'No dejes filas completamente vacias entre registros.',
];

interface CampoInstruccion {
  nombre: string;
  obligatorio: boolean;
  descripcion: string;
}

interface InstruccionesPlantilla {
  titulo: string;
  campos: CampoInstruccion[];
  reglaDuplicados: string;
  notaAdicional?: string;
}

function estiloEncabezado(cell: ExcelJS.Cell): void {
  cell.font = { bold: true, color: { argb: BLANCO } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: AZUL_HEADER },
  };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
  cell.border = {
    top: { style: 'thin', color: { argb: GRIS_BORDE } },
    bottom: { style: 'thin', color: { argb: GRIS_BORDE } },
    left: { style: 'thin', color: { argb: GRIS_BORDE } },
    right: { style: 'thin', color: { argb: GRIS_BORDE } },
  };
}

function anchoColumna(encabezado: string): number {
  return Math.max(encabezado.length + 6, 14);
}

function construirHojaPlantilla(
  workbook: ExcelJS.Workbook,
  encabezados: string[],
): void {
  const hoja = workbook.addWorksheet('Plantilla');
  hoja.columns = encabezados.map((encabezado) => ({
    header: encabezado,
    key: encabezado,
    width: anchoColumna(encabezado),
  }));
  const filaEncabezado = hoja.getRow(1);
  filaEncabezado.eachCell((cell) => estiloEncabezado(cell));
  filaEncabezado.height = 20;
  // Sin filas de datos: plantilla vacia a proposito (Regla 1, Fase 26).
}

function construirHojaInstrucciones(
  workbook: ExcelJS.Workbook,
  { titulo, campos, reglaDuplicados, notaAdicional }: InstruccionesPlantilla,
): void {
  const hoja = workbook.addWorksheet('Instrucciones');
  hoja.columns = [{ width: 4 }, { width: 90 }];

  let fila = 1;
  function escribirTitulo(texto: string): void {
    const cell = hoja.getCell(fila, 2);
    cell.value = texto;
    cell.font = { bold: true, size: 13 };
    fila += 2;
  }
  function escribirSubtitulo(texto: string): void {
    const cell = hoja.getCell(fila, 2);
    cell.value = texto;
    cell.font = { bold: true, size: 11 };
    fila += 1;
  }
  function escribirTexto(texto: string): void {
    hoja.getCell(fila, 2).value = texto;
    fila += 1;
  }
  function escribirEspacio(): void {
    fila += 1;
  }

  escribirTitulo(titulo);

  escribirSubtitulo('Reglas generales');
  for (const regla of REGLAS_GENERALES) {
    escribirTexto(`•  ${regla}`);
  }
  escribirEspacio();

  escribirSubtitulo('Campos');
  const tablaInicioFila = fila;
  hoja.getCell(fila, 2).value = 'Campo';
  hoja.getColumn(3).width = 16;
  hoja.getColumn(4).width = 60;
  hoja.getCell(fila, 3).value = 'Obligatorio';
  hoja.getCell(fila, 4).value = 'Descripcion';
  for (const col of [2, 3, 4]) {
    estiloEncabezado(hoja.getCell(tablaInicioFila, col));
  }
  fila += 1;
  for (const campo of campos) {
    hoja.getCell(fila, 2).value = campo.nombre;
    hoja.getCell(fila, 3).value = campo.obligatorio ? 'Si' : 'No';
    hoja.getCell(fila, 4).value = campo.descripcion;
    fila += 1;
  }
  escribirEspacio();

  escribirSubtitulo('Duplicados');
  escribirTexto(reglaDuplicados);

  if (notaAdicional) {
    escribirEspacio();
    escribirSubtitulo('Nota');
    escribirTexto(notaAdicional);
  }
}

async function construirPlantilla(
  nombreArchivo: string,
  {
    encabezados,
    instrucciones,
  }: { encabezados: string[]; instrucciones: InstruccionesPlantilla },
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  construirHojaPlantilla(workbook, encabezados);
  construirHojaInstrucciones(workbook, instrucciones);
  await workbook.xlsx.writeFile(
    `src/modules/importaciones/plantillas/${nombreArchivo}.xlsx`,
  );
  console.log(`Generado: ${nombreArchivo}.xlsx`);
}

async function main(): Promise<void> {
  await construirPlantilla('clientes', {
    encabezados: [
      'nombres',
      'apellidos',
      'telefono',
      'direccion',
      'documentoIdentidad',
    ],
    instrucciones: {
      titulo: 'Instrucciones — Plantilla de Clientes',
      campos: [
        {
          nombre: 'nombres',
          obligatorio: true,
          descripcion: 'Nombres del cliente.',
        },
        {
          nombre: 'apellidos',
          obligatorio: true,
          descripcion: 'Apellidos del cliente.',
        },
        {
          nombre: 'telefono',
          obligatorio: true,
          descripcion: 'Telefono de contacto.',
        },
        {
          nombre: 'direccion',
          obligatorio: true,
          descripcion: 'Direccion de entrega.',
        },
        {
          nombre: 'documentoIdentidad',
          obligatorio: false,
          descripcion:
            'Documento de identidad (DNI/CE). Si se omite, no se usa para detectar duplicados.',
        },
      ],
      reglaDuplicados:
        'Se considera duplicado el documento de identidad, cuando se proporciona (dos clientes sin documento no se consideran duplicados entre si).',
    },
  });

  await construirPlantilla('tiendas', {
    encabezados: ['nombre', 'ruc'],
    instrucciones: {
      titulo: 'Instrucciones — Plantilla de Tiendas',
      campos: [
        {
          nombre: 'nombre',
          obligatorio: true,
          descripcion: 'Razon comercial de la tienda.',
        },
        {
          nombre: 'ruc',
          obligatorio: false,
          descripcion: 'Documento tributario (RUC).',
        },
      ],
      reglaDuplicados:
        'Se considera duplicado el nombre de la tienda, o el RUC cuando se proporciona.',
    },
  });

  await construirPlantilla('motorizados', {
    encabezados: ['usuario', 'placa'],
    instrucciones: {
      titulo: 'Instrucciones — Plantilla de Motorizados',
      campos: [
        {
          nombre: 'usuario',
          obligatorio: true,
          descripcion:
            'Nombre de usuario (login) de una cuenta ya existente, con rol motorizado y activa.',
        },
        {
          nombre: 'placa',
          obligatorio: true,
          descripcion: 'Placa del vehiculo.',
        },
      ],
      reglaDuplicados:
        'Se considera duplicado el usuario, si ya tiene un perfil de motorizado asociado; o la placa, si ya esta en uso por otro perfil.',
      notaAdicional:
        'La cuenta de usuario (columna "usuario") debe existir previamente, con rol motorizado y activa — esta importacion nunca crea cuentas de usuario, solo vincula un perfil a una cuenta ya registrada.',
    },
  });
}

void main();
