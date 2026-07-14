import { ChevronDown } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { FieldChrome } from '../../utils/field-chrome';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  name: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  /** Se muestra como primera opcion deshabilitada, sin agregarla a `options`. */
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  onChange?: (value: string, event: Event) => void;
}

export interface SelectHandle {
  wrapper: HTMLDivElement;
  select: HTMLSelectElement;
  setError: (message: string | undefined) => void;
  /**
   * Reemplaza las opciones del selector en caliente, preservando el valor
   * actual si sigue existiendo en la nueva lista (si no, vuelve al
   * placeholder). Pensado para selects dependientes de otro campo (ej.
   * Sucursal segun la Tienda elegida en el formulario de Pedidos) — no
   * crear un componente aparte para ese caso, extender este metodo.
   */
  setOptions: (options: SelectOption[]) => void;
  /** Habilita/deshabilita el control despues de construido (ej. mientras no haya un valor de padre elegido). */
  setDisabled: (disabled: boolean) => void;
}

/** Select nativo unico y configurable para todo el proyecto. */
export function Select(props: SelectProps): SelectHandle {
  const inputId = `select-${props.name}`;

  function buildOptionElements(options: SelectOption[], currentValue: string): HTMLOptionElement[] {
    return [
      ...(props.placeholder
        ? [el('option', { value: '', disabled: true, selected: !currentValue }, props.placeholder)]
        : []),
      ...options.map((option) =>
        el(
          'option',
          {
            value: option.value,
            disabled: Boolean(option.disabled),
            selected: option.value === currentValue,
          },
          option.label,
        ),
      ),
    ];
  }

  const select = el(
    'select',
    {
      id: inputId,
      name: props.name,
      required: Boolean(props.required),
      disabled: Boolean(props.disabled),
      className: cn(
        'block w-full appearance-none rounded-lg border bg-surface px-3 py-2 pr-9 text-sm text-text-primary',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
        'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
        props.error ? 'border-danger-400' : 'border-border-default',
      ),
    },
    ...buildOptionElements(props.options, props.value ?? ''),
  );

  if (props.onChange) {
    select.addEventListener('change', (event) => props.onChange?.(select.value, event));
  }

  function setOptions(options: SelectOption[]): void {
    const currentValue = select.value;
    select.replaceChildren(...buildOptionElements(options, currentValue));
    if (!options.some((option) => option.value === currentValue)) {
      select.value = '';
    }
  }

  function setDisabled(disabled: boolean): void {
    select.disabled = disabled;
  }

  const control = el(
    'div',
    { className: 'relative' },
    select,
    el(
      'div',
      {
        className: 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted',
      },
      Icon({ icon: ChevronDown, size: 16 }),
    ),
  );

  const { wrapper, setError } = FieldChrome({
    inputId,
    control,
    errorTarget: select,
    label: props.label,
    error: props.error,
    helpText: props.helpText,
    className: props.className,
  });

  return { wrapper, select, setError, setOptions, setDisabled };
}
