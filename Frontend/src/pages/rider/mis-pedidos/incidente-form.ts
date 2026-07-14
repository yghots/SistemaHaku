import { Select, type SelectOption } from '../../../components/select/select';
import type { TipoIncidente } from '../../../types/incidente';
import { el } from '../../../utils/dom';

const TIPO_OPTIONS: SelectOption[] = [
  { value: 'accidente', label: 'Accidente' },
  { value: 'averia', label: 'Averia' },
  { value: 'dano_producto', label: 'Dano al producto' },
  { value: 'otro', label: 'Otro' },
];

export interface IncidenteFormMode {
  /** Codigo del pedido asociado, solo para mostrar contexto (el pedidoId real se envia aparte, ya conocido por quien abre el formulario). */
  codigoPedido?: string;
}

export interface IncidenteFormValues {
  tipo: TipoIncidente;
}

export interface IncidenteFormHandle {
  element: HTMLElement;
  validate: () => IncidenteFormValues | null;
}

/** Formulario de "Registrar incidente" (CU13). `pedidoId` es opcional en el backend: un incidente puede no estar ligado a un pedido (ej. falla del vehiculo). */
export function buildIncidenteForm({ codigoPedido }: IncidenteFormMode): IncidenteFormHandle {
  const tipoField = Select({
    name: 'tipo',
    label: 'Tipo de incidente',
    required: true,
    options: TIPO_OPTIONS,
    placeholder: 'Selecciona un tipo',
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    codigoPedido
      ? el(
          'p',
          { className: 'text-sm text-text-muted' },
          `Este incidente se asociara al pedido ${codigoPedido}.`,
        )
      : el(
          'p',
          { className: 'text-sm text-text-muted' },
          'Este incidente no se asociara a ningun pedido especifico.',
        ),
    tipoField.wrapper,
  );

  function validate(): IncidenteFormValues | null {
    tipoField.setError(undefined);
    const tipoValue = tipoField.select.value as TipoIncidente | '';
    if (!tipoValue) {
      tipoField.setError('Selecciona un tipo de incidente');
      return null;
    }
    return { tipo: tipoValue };
  }

  return { element, validate };
}
