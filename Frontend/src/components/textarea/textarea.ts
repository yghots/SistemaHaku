import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { FieldChrome } from '../../utils/field-chrome';

export interface TextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  onInput?: (value: string, event: Event) => void;
}

export interface TextareaHandle {
  wrapper: HTMLDivElement;
  textarea: HTMLTextAreaElement;
  setError: (message: string | undefined) => void;
}

/** Campo de texto multilinea unico y configurable para todo el proyecto. */
export function Textarea(props: TextareaProps): TextareaHandle {
  const inputId = `textarea-${props.name}`;

  const textarea = el('textarea', {
    id: inputId,
    name: props.name,
    placeholder: props.placeholder ?? '',
    value: props.value ?? '',
    rows: props.rows ?? 4,
    required: Boolean(props.required),
    disabled: Boolean(props.disabled),
    className: cn(
      'block w-full resize-y rounded-lg border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
      'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted',
      props.error ? 'border-danger-400' : 'border-border-default',
    ),
  });

  if (props.onInput) {
    textarea.addEventListener('input', (event) => props.onInput?.(textarea.value, event));
  }

  const { wrapper, setError } = FieldChrome({
    inputId,
    control: textarea,
    label: props.label,
    error: props.error,
    helpText: props.helpText,
    className: props.className,
  });

  return { wrapper, textarea, setError };
}
