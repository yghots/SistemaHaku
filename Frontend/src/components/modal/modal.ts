import { X } from 'lucide';
import { Icon } from '../icon/icon';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  title?: string;
  content: Node;
  footer?: Node;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  onClose?: () => void;
}

export interface ModalHandle {
  /** Elemento raiz (overlay + panel), ya insertado en document.body. */
  element: HTMLDivElement;
  open: () => void;
  close: () => void;
  /** Quita el modal del DOM y libera sus listeners. Llamar al descartar el modal definitivamente. */
  destroy: () => void;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const CLOSE_ANIMATION_MS = 150;

/** Shell de modal unico y configurable. No incluye logica de negocio: solo estructura, apertura/cierre y foco. */
export function Modal(props: ModalProps): ModalHandle {
  const size = props.size ?? 'md';
  const closeOnBackdropClick = props.closeOnBackdropClick ?? true;

  const closeButton = el(
    'button',
    {
      type: 'button',
      className:
        'rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary',
      'aria-label': 'Cerrar',
    },
    Icon({ icon: X, size: 18 }),
  );

  const panel = el('div', {
    className: cn(
      'flex max-h-[85vh] w-full origin-center flex-col rounded-xl bg-surface-elevated shadow-lg',
      'scale-95 opacity-0 transition-all duration-150 ease-out',
      SIZE_CLASSES[size],
    ),
    role: 'dialog',
    'aria-modal': 'true',
  });

  if (props.title) {
    panel.appendChild(
      el(
        'div',
        {
          className:
            'flex shrink-0 items-center justify-between border-b border-border-default px-5 py-4',
        },
        el('h2', { className: 'text-base font-semibold text-text-primary' }, props.title),
        closeButton,
      ),
    );
  } else {
    panel.appendChild(el('div', { className: 'flex shrink-0 justify-end px-5 pt-4' }, closeButton));
  }

  panel.appendChild(
    el(
      'div',
      { className: 'min-h-0 flex-1 overflow-y-auto px-5 py-4 text-text-primary' },
      props.content,
    ),
  );

  if (props.footer) {
    panel.appendChild(
      el(
        'div',
        {
          className: 'flex shrink-0 justify-end gap-3 border-t border-border-default px-5 py-4',
        },
        props.footer,
      ),
    );
  }

  const overlay = el(
    'div',
    {
      className: cn(
        'fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/50 p-4',
        'pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
        'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
        'opacity-0 transition-opacity duration-150 ease-out',
      ),
    },
    panel,
  );

  let closeTimeout: number | undefined;

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  function open(): void {
    window.clearTimeout(closeTimeout);
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    // Doble rAF: fuerza un reflow con el estado inicial (opacity-0/scale-95)
    // antes de quitarlo, para que la transicion realmente se dispare.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        panel.classList.remove('opacity-0', 'scale-95');
      });
    });
    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', handleKeydown);
  }

  function close(): void {
    overlay.classList.add('opacity-0');
    panel.classList.add('opacity-0', 'scale-95');
    closeTimeout = window.setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
    }, CLOSE_ANIMATION_MS);
    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', handleKeydown);
    props.onClose?.();
  }

  function destroy(): void {
    window.clearTimeout(closeTimeout);
    document.removeEventListener('keydown', handleKeydown);
    overlay.remove();
  }

  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (closeOnBackdropClick && event.target === overlay) close();
  });

  document.body.appendChild(overlay);

  return { element: overlay, open, close, destroy };
}
