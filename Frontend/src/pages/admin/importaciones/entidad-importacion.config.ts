import type { EntidadImportacion } from '../../../types/importacion';

export interface EntidadImportacionConfig {
  entidad: EntidadImportacion;
  nombre: string;
  descripcion: string;
  camposObligatorios: string[];
  camposOpcionales: string[];
  /** Explica en una frase que campo(s) determina un duplicado — mismas reglas ya implementadas en el CRUD de la entidad, ninguna nueva. */
  reglaDuplicados: string;
  /** Aclaracion adicional, solo cuando la entidad lo requiere (ej. Motorizados). */
  notaAdicional?: string;
}

export const ENTIDADES_IMPORTACION_CONFIG: EntidadImportacionConfig[] = [
  {
    entidad: 'cliente',
    nombre: 'Clientes',
    descripcion:
      'Importa clientes en lote: nombres, apellidos, telefono, direccion y documento de identidad.',
    camposObligatorios: ['nombres', 'apellidos', 'telefono', 'direccion'],
    camposOpcionales: ['documentoIdentidad'],
    reglaDuplicados:
      'El documento de identidad, cuando se proporciona (dos clientes sin documento no se consideran duplicados entre si).',
  },
  {
    entidad: 'tienda',
    nombre: 'Tiendas',
    descripcion: 'Importa tiendas en lote: nombre comercial y RUC.',
    camposObligatorios: ['nombre'],
    camposOpcionales: ['ruc'],
    reglaDuplicados: 'El nombre de la tienda, o el RUC cuando se proporciona.',
  },
  {
    entidad: 'motorizado',
    nombre: 'Motorizados',
    descripcion:
      'Vincula un perfil de motorizado (placa) a una cuenta de usuario que ya exista en el sistema.',
    camposObligatorios: ['usuario', 'placa'],
    camposOpcionales: [],
    reglaDuplicados:
      'El usuario, si ya tiene un perfil de motorizado asociado; o la placa, si ya esta en uso por otro perfil.',
    notaAdicional:
      'La cuenta de usuario (columna "usuario") debe existir previamente, con rol motorizado y activa — se crea desde el modulo Usuarios, nunca desde esta importacion.',
  },
];

export function obtenerConfigEntidad(entidad: EntidadImportacion): EntidadImportacionConfig {
  const config = ENTIDADES_IMPORTACION_CONFIG.find((item) => item.entidad === entidad);
  if (!config) throw new Error(`Entidad de importacion desconocida: ${entidad}`);
  return config;
}
