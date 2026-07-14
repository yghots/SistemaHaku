import { cn } from './cn';
import { el } from './dom';

export interface FieldChromeOptions {
  inputId: string;
  control: HTMLElement;
  /** Elemento que recibe las clases de borde error/normal, si es distinto de `control` (ej. Select envuelve el <select> en un div relative). Por defecto es `control`. */
  errorTarget?: HTMLElement;
  label?: string;
  error?: string;
  helpText?: string;
  className?: string;
}

export interface FieldChromeHandle {
  wrapper: HTMLDivElement;
  setError: (message: string | undefined) => void;
}

const CONTROL_ERROR_CLASS = 'border-danger-400';
const CONTROL_DEFAULT_CLASS = 'border-border-default';

/**
 * Envoltorio compartido (label + control + help text + mensaje de error)
 * usado por Input, Textarea y Select para no repetir el mismo markup y la
 * misma logica de `setError` tres veces (regla de no duplicar codigo).
 */
export function FieldChrome(opts: FieldChromeOptions): FieldChromeHandle {
  const wrapper = el('div', { className: cn('flex flex-col gap-1.5', opts.className) });

  if (opts.label) {
    wrapper.appendChild(
      el(
        'label',
        { htmlFor: opts.inputId, className: 'text-sm font-medium text-text-secondary' },
        opts.label,
      ),
    );
  }

  wrapper.appendChild(opts.control);

  const helpText = el(
    'p',
    { className: cn('text-sm text-text-muted', (!opts.helpText || opts.error) && 'hidden') },
    opts.helpText ?? '',
  );
  const errorText = el(
    'p',
    { className: cn('text-sm text-danger-600', !opts.error && 'hidden') },
    opts.error ?? '',
  );

  wrapper.appendChild(helpText);
  wrapper.appendChild(errorText);

  const errorTarget = opts.errorTarget ?? opts.control;

  const setError = (message: string | undefined): void => {
    errorText.textContent = message ?? '';
    errorText.classList.toggle('hidden', !message);
    helpText.classList.toggle('hidden', Boolean(message) || !opts.helpText);
    errorTarget.classList.toggle(CONTROL_ERROR_CLASS, Boolean(message));
    errorTarget.classList.toggle(CONTROL_DEFAULT_CLASS, !message);
  };

  return { wrapper, setError };
}
