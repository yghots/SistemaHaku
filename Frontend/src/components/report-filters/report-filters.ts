import { Search, X } from 'lucide';
import { Button } from '../button/button';
import { Input, type InputHandle } from '../input/input';
import { Select, type SelectHandle, type SelectOption } from '../select/select';
import { el } from '../../utils/dom';

export interface ReportDateRangeField {
  type: 'dateRange';
  nameDesde: string;
  nameHasta: string;
  labelDesde?: string;
  labelHasta?: string;
}

export interface ReportSelectField {
  type: 'select';
  name: string;
  label?: string;
  placeholder: string;
  options: SelectOption[];
}

export interface ReportSearchField {
  type: 'search';
  name: string;
  label?: string;
  placeholder: string;
}

/**
 * Union discriminada de campos soportados por la barra de filtros de
 * reportes. Agregar un nuevo tipo de filtro (ej. un futuro filtro de
 * cliente) es agregar un miembro a esta union — nunca requiere que un
 * reporte existente cambie su propia logica.
 */
export type ReportFilterField = ReportDateRangeField | ReportSelectField | ReportSearchField;

export interface ReportFiltersProps {
  fields: ReportFilterField[];
  /** Se invoca con el objeto de parametros completo (solo los campos con valor) al presionar "Aplicar filtros" o "Limpiar". */
  onApply: (params: Record<string, string>) => void;
}

export interface ReportFiltersHandle {
  element: HTMLElement;
}

/**
 * Infraestructura reutilizable de filtros para el modulo Reportes
 * (Fase 9): un unico componente configurable por `fields` que arma los
 * controles (rango de fechas, select, busqueda de texto) y emite un solo
 * objeto tipado (`Record<string, string>`) con los valores actuales al
 * aplicar. No conoce endpoints, servicios, tablas ni logica de negocio —
 * cada pagina de reporte decide que hacer con el objeto emitido (armar
 * los parametros de su propio servicio y recargar su tabla/KPIs).
 */
export function ReportFilters({ fields, onApply }: ReportFiltersProps): ReportFiltersHandle {
  const inputsByName = new Map<string, InputHandle>();
  const selectsByName = new Map<string, SelectHandle>();

  function renderField(field: ReportFilterField): HTMLElement {
    if (field.type === 'dateRange') {
      const desde = Input({
        name: field.nameDesde,
        label: field.labelDesde ?? 'Desde',
        type: 'date',
      });
      const hasta = Input({
        name: field.nameHasta,
        label: field.labelHasta ?? 'Hasta',
        type: 'date',
      });
      inputsByName.set(field.nameDesde, desde);
      inputsByName.set(field.nameHasta, hasta);
      // `flex-wrap`: en ~320-360px de ancho dos campos de 9rem con gap no
      // entran en una sola fila sin desbordar horizontalmente (el
      // contenedor externo ya envuelve, pero como par no lo hacia) — al
      // envolver aca tambien, "Hasta" pasa a la siguiente linea en vez de
      // forzar scroll horizontal.
      return el(
        'div',
        { className: 'flex flex-wrap gap-3' },
        el('div', { className: 'w-36 sm:w-40' }, desde.wrapper),
        el('div', { className: 'w-36 sm:w-40' }, hasta.wrapper),
      );
    }

    if (field.type === 'select') {
      const select = Select({
        name: field.name,
        label: field.label,
        placeholder: field.placeholder,
        options: field.options,
      });
      selectsByName.set(field.name, select);
      return el('div', { className: 'w-full max-w-56 sm:w-52' }, select.wrapper);
    }

    const search = Input({
      name: field.name,
      label: field.label,
      placeholder: field.placeholder,
    });
    inputsByName.set(field.name, search);
    return el('div', { className: 'w-full max-w-56 sm:w-56' }, search.wrapper);
  }

  function collectValues(): Record<string, string> {
    const values: Record<string, string> = {};
    for (const [name, input] of inputsByName) {
      const value = input.input.value.trim();
      if (value) values[name] = value;
    }
    for (const [name, select] of selectsByName) {
      const value = select.select.value;
      if (value) values[name] = value;
    }
    return values;
  }

  function clearValues(): void {
    for (const input of inputsByName.values()) {
      input.input.value = '';
    }
    for (const select of selectsByName.values()) {
      select.select.value = '';
    }
  }

  const applyButton = Button({
    label: 'Aplicar filtros',
    icon: Search,
    onClick: () => onApply(collectValues()),
  });

  const clearButton = Button({
    label: 'Limpiar',
    icon: X,
    variant: 'ghost',
    onClick: () => {
      clearValues();
      onApply({});
    },
  });

  const element = el(
    'div',
    { className: 'flex flex-wrap items-end gap-3' },
    ...fields.map(renderField),
    el('div', { className: 'flex gap-2' }, applyButton, clearButton),
  );

  return { element };
}
