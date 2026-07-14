import Swal from 'sweetalert2';

const toastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toastEl) => {
    toastEl.addEventListener('mouseenter', Swal.stopTimer);
    toastEl.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

/**
 * Notificaciones no bloqueantes (esquina superior derecha). Unico mecanismo
 * de toast del proyecto, construido sobre SweetAlert2 (regla: usar
 * exclusivamente SweetAlert2 para alertas).
 */
export function showSuccessToast(message: string): void {
  void toastMixin.fire({ icon: 'success', title: message });
}

export function showErrorToast(message: string): void {
  void toastMixin.fire({ icon: 'error', title: message });
}

export function showInfoToast(message: string): void {
  void toastMixin.fire({ icon: 'info', title: message });
}

export function showWarningToast(message: string): void {
  void toastMixin.fire({ icon: 'warning', title: message });
}
