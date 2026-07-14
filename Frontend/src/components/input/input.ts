import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { FieldChrome } from '../../utils/field-chrome';

export interface InputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  /** Accion al final del campo (ej. boton de mostrar/ocultar contraseña). Reservada, no crear un componente nuevo para esto. */
  trailingAction?: HTMLElement;
  onInput?: (value: string, event: Event) => void;
}

export interface InputHandle {
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  setError: (message: string | undefined) => void;
}

/** Campo de texto unico y configurable para todo el proyecto. Devuelve el wrapper + un handle para leer/actualizar el estado. */
export function Input(props: InputProps): InputHandle {
  const inputId = `input-${props.name}`;

  const input = el('input', {
    id: inputId,
    name: props.name,
    type: props.type ?? 'text',
    placeholder: props.placeholder ?? '',
    value: props.value ?? '',
    required: Boolean(props.required),
    disabled: Boolean(props.disabled),
    className: cn(
      'block w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
      props.trailingAction && 'pr-10',
      props.error ? 'border-danger-400' : 'border-border-default',
    ),
  });

  if (props.onInput) {
    input.addEventListener('input', (event) => props.onInput?.(input.value, event));
  }

  const control = props.trailingAction
    ? el(
        'div',
        { className: 'relative' },
        input,
        el(
          'div',
          { className: 'absolute right-1.5 top-1/2 -translate-y-1/2' },
          props.trailingAction,
        ),
      )
    : input;

  const { wrapper, setError } = FieldChrome({
    inputId,
    control,
    errorTarget: input,
    label: props.label,
    error: props.error,
    helpText: props.helpText,
    className: props.className,
  });

  return { wrapper, input, setError };
}
