import { Input } from '../../../components/input/input';
import { Select, type SelectOption } from '../../../components/select/select';
import type { EstadoMotorizado, PerfilMotorizado } from '../../../types/perfil-motorizado';
import { el } from '../../../utils/dom';

const ESTADO_OPTIONS: SelectOption[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'inactivo', label: 'Inactivo' },
];

export interface MotorizadoFormMode {
  mode: 'create' | 'edit';
  initial?: PerfilMotorizado;
  /** Lista real de usuarios con rol motorizado (sin perfil ya creado o no), obtenida del backend. Solo se usa en modo 'create': usuarioId es inmutable tras la creacion. */
  usuarioOptions?: SelectOption[];
  /** Etiqueta ya resuelta del usuario del perfil (solo modo 'edit', usuarioId se muestra de solo lectura). */
  usuarioLabel?: string;
}

export interface MotorizadoFormValues {
  usuarioId?: number;
  placa: string;
  estado: EstadoMotorizado;
}

export interface MotorizadoFormHandle {
  element: HTMLElement;
  validate: () => MotorizadoFormValues | null;
}

/** Formulario compartido por Crear y Editar perfil de motorizado (mismo patron de la Fase 4). */
export function buildMotorizadoForm({
  mode,
  initial,
  usuarioOptions,
  usuarioLabel,
}: MotorizadoFormMode): MotorizadoFormHandle {
  const usuarioField =
    mode === 'create'
      ? Select({
          name: 'usuarioId',
          label: 'Usuario',
          required: true,
          options: usuarioOptions ?? [],
          placeholder: 'Selecciona un usuario con rol motorizado',
        })
      : Input({
          name: 'usuarioId',
          label: 'Usuario',
          value: usuarioLabel ?? initial?.usuarioId,
          disabled: true,
          helpText: 'El usuario asociado no se puede cambiar despues de crear el perfil.',
        });

  const placaField = Input({
    name: 'placa',
    label: 'Placa',
    required: true,
    value: initial?.placa,
  });

  const estadoField = Select({
    name: 'estado',
    label: 'Estado',
    required: true,
    value: initial?.estado,
    options: ESTADO_OPTIONS,
    placeholder: 'Selecciona un estado',
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    usuarioField.wrapper,
    placaField.wrapper,
    estadoField.wrapper,
  );

  function validate(): MotorizadoFormValues | null {
    usuarioField.setError(undefined);
    placaField.setError(undefined);
    estadoField.setError(undefined);

    const placa = placaField.input.value.trim();
    const estadoValue = estadoField.select.value as EstadoMotorizado | '';

    let valid = true;
    let usuarioId: number | undefined;

    if (mode === 'create' && 'select' in usuarioField) {
      const usuarioIdValue = usuarioField.select.value;
      if (!usuarioIdValue) {
        usuarioField.setError('Selecciona un usuario');
        valid = false;
      } else {
        usuarioId = Number(usuarioIdValue);
      }
    }

    if (!placa) {
      placaField.setError('Este campo es obligatorio');
      valid = false;
    } else if (placa.length > 15) {
      placaField.setError('Maximo 15 caracteres');
      valid = false;
    }

    if (!estadoValue) {
      estadoField.setError('Selecciona un estado');
      valid = false;
    }

    if (!valid) return null;

    return { usuarioId, placa, estado: estadoValue as EstadoMotorizado };
  }

  return { element, validate };
}
