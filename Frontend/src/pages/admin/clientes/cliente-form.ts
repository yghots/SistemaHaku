import { Input } from '../../../components/input/input';
import type { Cliente } from '../../../types/cliente';
import { el } from '../../../utils/dom';

export interface ClienteFormMode {
  mode: 'create' | 'edit';
  initial?: Cliente;
}

export interface ClienteFormValues {
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  documentoIdentidad?: string;
}

export interface ClienteFormHandle {
  element: HTMLElement;
  validate: () => ClienteFormValues | null;
}

/** Formulario compartido por Crear y Editar cliente (mismo patron de la Fase 4). */
export function buildClienteForm({ initial }: ClienteFormMode): ClienteFormHandle {
  const nombreField = Input({
    name: 'nombreCompleto',
    label: 'Nombre completo',
    required: true,
    value: initial?.nombreCompleto,
  });

  const telefonoField = Input({
    name: 'telefono',
    label: 'Telefono',
    required: true,
    value: initial?.telefono,
  });

  const direccionField = Input({
    name: 'direccion',
    label: 'Direccion',
    required: true,
    value: initial?.direccion,
  });

  const documentoField = Input({
    name: 'documentoIdentidad',
    label: 'Documento de identidad',
    helpText: 'Opcional',
    value: initial?.documentoIdentidad ?? undefined,
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    nombreField.wrapper,
    telefonoField.wrapper,
    direccionField.wrapper,
    documentoField.wrapper,
  );

  function validate(): ClienteFormValues | null {
    nombreField.setError(undefined);
    telefonoField.setError(undefined);
    direccionField.setError(undefined);
    documentoField.setError(undefined);

    const nombreCompleto = nombreField.input.value.trim();
    const telefono = telefonoField.input.value.trim();
    const direccion = direccionField.input.value.trim();
    const documentoIdentidad = documentoField.input.value.trim();

    let valid = true;

    if (!nombreCompleto) {
      nombreField.setError('Este campo es obligatorio');
      valid = false;
    } else if (nombreCompleto.length > 150) {
      nombreField.setError('Maximo 150 caracteres');
      valid = false;
    }

    if (!telefono) {
      telefonoField.setError('Este campo es obligatorio');
      valid = false;
    } else if (telefono.length > 20) {
      telefonoField.setError('Maximo 20 caracteres');
      valid = false;
    }

    if (!direccion) {
      direccionField.setError('Este campo es obligatorio');
      valid = false;
    } else if (direccion.length > 255) {
      direccionField.setError('Maximo 255 caracteres');
      valid = false;
    }

    if (documentoIdentidad && documentoIdentidad.length > 20) {
      documentoField.setError('Maximo 20 caracteres');
      valid = false;
    }

    if (!valid) return null;

    return {
      nombreCompleto,
      telefono,
      direccion,
      documentoIdentidad: documentoIdentidad || undefined,
    };
  }

  return { element, validate };
}
