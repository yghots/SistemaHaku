import { Input } from '../../../components/input/input';
import type { Tienda } from '../../../types/tienda';
import { el } from '../../../utils/dom';

export interface TiendaFormMode {
  mode: 'create' | 'edit';
  initial?: Tienda;
}

export interface TiendaFormValues {
  nombre: string;
  ruc?: string;
}

export interface TiendaFormHandle {
  element: HTMLElement;
  validate: () => TiendaFormValues | null;
}

/** Formulario compartido por Crear y Editar tienda (misma infraestructura del patron de la Fase 4). */
export function buildTiendaForm({ initial }: TiendaFormMode): TiendaFormHandle {
  const nombreField = Input({
    name: 'nombre',
    label: 'Nombre',
    required: true,
    value: initial?.nombre,
  });

  const rucField = Input({
    name: 'ruc',
    label: 'RUC',
    helpText: 'Opcional',
    value: initial?.ruc ?? undefined,
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    nombreField.wrapper,
    rucField.wrapper,
  );

  function validate(): TiendaFormValues | null {
    nombreField.setError(undefined);
    rucField.setError(undefined);

    const nombre = nombreField.input.value.trim();
    const ruc = rucField.input.value.trim();

    let valid = true;
    if (!nombre) {
      nombreField.setError('Este campo es obligatorio');
      valid = false;
    } else if (nombre.length > 150) {
      nombreField.setError('Maximo 150 caracteres');
      valid = false;
    }

    if (ruc && ruc.length > 20) {
      rucField.setError('Maximo 20 caracteres');
      valid = false;
    }

    if (!valid) return null;
    return { nombre, ruc: ruc || undefined };
  }

  return { element, validate };
}
