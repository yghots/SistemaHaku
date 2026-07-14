import { Button } from '../button/button';
import { Modal, type ModalSize } from './modal';

export interface FormModalOptions {
  title: string;
  content: HTMLElement;
  submitLabel?: string;
  cancelLabel?: string;
  size?: ModalSize;
  /** Devuelve true si la operacion tuvo exito (cierra el modal) o false si debe permanecer abierto (ej. error de validacion ya mostrado por el propio formulario). */
  onSubmit: () => Promise<boolean>;
}

export interface FormModalHandle {
  open: () => void;
  close: () => void;
  destroy: () => void;
}

/**
 * Modal de formulario generico (título + contenido + Cancelar/Guardar con
 * estado de carga), compuesto sobre el Modal existente. Usado por
 * crear/editar en cualquier modulo administrativo - no crear un modal
 * especifico por modulo.
 */
export function FormModal(options: FormModalOptions): FormModalHandle {
  let submitting = false;

  const cancelButton = Button({
    label: options.cancelLabel ?? 'Cancelar',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  let submitButton = buildSubmitButton(false);

  function buildSubmitButton(loading: boolean): HTMLButtonElement {
    const button = Button({
      label: options.submitLabel ?? 'Guardar',
      type: 'submit',
      loading,
      disabled: loading,
    });
    button.addEventListener('click', handleSubmitClick);
    return button;
  }

  function setSubmitting(loading: boolean): void {
    submitting = loading;
    cancelButton.disabled = loading;
    const newButton = buildSubmitButton(loading);
    submitButton.replaceWith(newButton);
    submitButton = newButton;
  }

  async function handleSubmitClick(event: MouseEvent): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const success = await options.onSubmit();
      if (success) modal.close();
    } finally {
      setSubmitting(false);
    }
  }

  const footer = document.createElement('div');
  footer.className = 'flex gap-3';
  footer.append(cancelButton, submitButton);

  const modal = Modal({
    title: options.title,
    content: options.content,
    footer,
    size: options.size,
    closeOnBackdropClick: false,
    // Cada FormModal es de un solo uso (una instancia nueva por cada
    // apertura); se autodestruye al cerrarse para no dejar overlays
    // acumulados en document.body.
    onClose: () => modal.destroy(),
  });

  return { open: modal.open, close: modal.close, destroy: modal.destroy };
}
