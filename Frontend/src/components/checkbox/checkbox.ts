import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface CheckboxProps {
  name: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

export interface CheckboxHandle {
  wrapper: HTMLDivElement;
  checkbox: HTMLInputElement;
  setError: (message: string | undefined) => void;
}

/** Checkbox unico y configurable para todo el proyecto. */
export function Checkbox(props: CheckboxProps): CheckboxHandle {
  const inputId = `checkbox-${props.name}`;

  const checkbox = el('input', {
    id: inputId,
    name: props.name,
    type: 'checkbox',
    checked: Boolean(props.checked),
    disabled: Boolean(props.disabled),
    className: cn(
      'h-4 w-4 rounded border-border-default text-brand-600',
      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1',
      'disabled:cursor-not-allowed disabled:opacity-50',
    ),
  });

  if (props.onChange) {
    checkbox.addEventListener('change', (event) => props.onChange?.(checkbox.checked, event));
  }

  const errorText = el(
    'p',
    { className: cn('text-sm text-danger-600', !props.error && 'hidden') },
    props.error ?? '',
  );

  const wrapper = el(
    'div',
    { className: cn('flex flex-col gap-1', props.className) },
    el(
      'label',
      {
        htmlFor: inputId,
        // `py-2` (en vez de agrandar el checkbox de 16px, que rompería la
        // escala visual del formulario) amplia solo el AREA de toque de
        // toda la fila etiqueta+checkbox, tal como pide Fase 13.
        className: 'flex cursor-pointer items-center gap-2 py-2 text-sm text-text-primary',
      },
      checkbox,
      props.label,
    ),
    errorText,
  );

  const setError = (message: string | undefined): void => {
    errorText.textContent = message ?? '';
    errorText.classList.toggle('hidden', !message);
  };

  return { wrapper, checkbox, setError };
}
