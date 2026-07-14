import { Search, X } from 'lucide';
import { Icon } from '../icon/icon';
import { debounce } from '../../hooks/debounce';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  /** ms de espera antes de invocar onSearch tras dejar de escribir. Default 300. */
  debounceMs?: number;
  className?: string;
  onSearch?: (value: string) => void;
}

export interface SearchBarHandle {
  wrapper: HTMLDivElement;
  input: HTMLInputElement;
  clear: () => void;
}

/** Buscador generico y reutilizable (input + icono + boton de limpiar). No incluye logica de busqueda: solo emite `onSearch`. */
export function SearchBar(props: SearchBarProps): SearchBarHandle {
  const input = el('input', {
    type: 'search',
    placeholder: props.placeholder ?? 'Buscar...',
    value: props.value ?? '',
    className: cn(
      'w-full rounded-lg border border-border-default bg-surface py-2 pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted',
      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
      '[&::-webkit-search-cancel-button]:appearance-none',
    ),
  });

  const clearButton = el(
    'button',
    {
      type: 'button',
      className: cn(
        'absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-primary',
        'hidden',
      ),
      'aria-label': 'Limpiar busqueda',
    },
    Icon({ icon: X, size: 14 }),
  );

  const emitSearch = props.onSearch
    ? debounce((value: string) => props.onSearch?.(value), props.debounceMs ?? 300)
    : undefined;

  function syncClearButton(): void {
    clearButton.classList.toggle('hidden', input.value.length === 0);
  }

  input.addEventListener('input', () => {
    syncClearButton();
    emitSearch?.(input.value);
  });

  clearButton.addEventListener('click', () => clear());

  syncClearButton();

  const wrapper = el(
    'div',
    { className: cn('relative', props.className) },
    el(
      'div',
      { className: 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted' },
      Icon({ icon: Search, size: 16 }),
    ),
    input,
    clearButton,
  );

  function clear(): void {
    input.value = '';
    syncClearButton();
    input.focus();
    props.onSearch?.('');
  }

  return { wrapper, input, clear };
}
