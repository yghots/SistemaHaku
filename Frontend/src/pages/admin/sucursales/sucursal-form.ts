import { Checkbox } from '../../../components/checkbox/checkbox';
import { Input } from '../../../components/input/input';
import { Select, type SelectOption } from '../../../components/select/select';
import type { Sucursal } from '../../../types/sucursal';
import { el } from '../../../utils/dom';

export interface SucursalFormMode {
  mode: 'create' | 'edit';
  initial?: Sucursal;
  /** Lista real de tiendas obtenida del backend (no simulada). */
  tiendaOptions: SelectOption[];
}

export interface SucursalFormValues {
  tiendaId: number;
  nombre: string;
  direccion: string;
  referencia?: string;
  telefono: string;
  esPrincipal: boolean;
}

export interface SucursalFormHandle {
  element: HTMLElement;
  validate: () => SucursalFormValues | null;
}

/** Formulario compartido por Crear y Editar sucursal (mismo patron de la Fase 4). */
export function buildSucursalForm({
  initial,
  tiendaOptions,
}: SucursalFormMode): SucursalFormHandle {
  const tiendaField = Select({
    name: 'tiendaId',
    label: 'Tienda',
    required: true,
    value: initial?.tiendaId,
    options: tiendaOptions,
    placeholder: 'Selecciona una tienda',
  });

  const nombreField = Input({
    name: 'nombre',
    label: 'Nombre',
    required: true,
    value: initial?.nombre,
  });

  const direccionField = Input({
    name: 'direccion',
    label: 'Direccion',
    required: true,
    value: initial?.direccion,
  });

  const telefonoField = Input({
    name: 'telefono',
    label: 'Telefono',
    required: true,
    value: initial?.telefono,
  });

  const referenciaField = Input({
    name: 'referencia',
    label: 'Referencia',
    helpText: 'Opcional',
    value: initial?.referencia ?? undefined,
  });

  const principalField = Checkbox({
    name: 'esPrincipal',
    label: 'Marcar como sucursal principal de la tienda',
    checked: initial?.esPrincipal ?? false,
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    tiendaField.wrapper,
    nombreField.wrapper,
    direccionField.wrapper,
    telefonoField.wrapper,
    referenciaField.wrapper,
    principalField.wrapper,
  );

  function validate(): SucursalFormValues | null {
    tiendaField.setError(undefined);
    nombreField.setError(undefined);
    direccionField.setError(undefined);
    telefonoField.setError(undefined);
    referenciaField.setError(undefined);

    const tiendaIdValue = tiendaField.select.value;
    const nombre = nombreField.input.value.trim();
    const direccion = direccionField.input.value.trim();
    const telefono = telefonoField.input.value.trim();
    const referencia = referenciaField.input.value.trim();

    let valid = true;

    if (!tiendaIdValue) {
      tiendaField.setError('Selecciona una tienda');
      valid = false;
    }

    if (!nombre) {
      nombreField.setError('Este campo es obligatorio');
      valid = false;
    } else if (nombre.length > 150) {
      nombreField.setError('Maximo 150 caracteres');
      valid = false;
    }

    if (!direccion) {
      direccionField.setError('Este campo es obligatorio');
      valid = false;
    } else if (direccion.length > 255) {
      direccionField.setError('Maximo 255 caracteres');
      valid = false;
    }

    if (!telefono) {
      telefonoField.setError('Este campo es obligatorio');
      valid = false;
    } else if (telefono.length > 20) {
      telefonoField.setError('Maximo 20 caracteres');
      valid = false;
    }

    if (referencia && referencia.length > 255) {
      referenciaField.setError('Maximo 255 caracteres');
      valid = false;
    }

    if (!valid) return null;

    return {
      tiendaId: Number(tiendaIdValue),
      nombre,
      direccion,
      telefono,
      referencia: referencia || undefined,
      esPrincipal: principalField.checkbox.checked,
    };
  }

  return { element, validate };
}
