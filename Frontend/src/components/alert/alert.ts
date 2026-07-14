import Swal, { type SweetAlertIcon } from 'sweetalert2';

export interface ConfirmDialogOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: SweetAlertIcon;
  /** true = boton de confirmar en rojo (acciones destructivas: eliminar, cancelar, etc.) */
  danger?: boolean;
}

/**
 * Dialogo de confirmacion. Unico reemplazo permitido de `window.confirm`
 * en todo el proyecto (regla: usar exclusivamente SweetAlert2).
 */
export async function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon ?? 'question',
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: options.cancelText ?? 'Cancelar',
    confirmButtonColor: options.danger ? '#dc2626' : '#2563eb',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export interface InfoAlertOptions {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
}

/** Alerta informativa simple. Unico reemplazo permitido de `window.alert`. */
export async function infoAlert(options: InfoAlertOptions): Promise<void> {
  await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon ?? 'info',
    confirmButtonColor: '#2563eb',
  });
}
