const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Elementos realmente enfocables (visibles, no deshabilitados) dentro de
 * `container`, en el orden del DOM. Base de `focusFirstElement`/`trapTabKey`.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

/**
 * Mueve el foco al primer elemento enfocable de `container` (o al propio
 * `container` — que debe tener `tabindex="-1"` — si no contiene ninguno).
 * Llamar una vez al abrir cualquier panel/dialogo flotante (Modal,
 * Dropdown, o cualquier componente similar futuro).
 */
export function focusFirstElement(container: HTMLElement): void {
  const [first] = getFocusableElements(container);
  (first ?? container).focus();
}

/**
 * Si `event` es `Tab`/`Shift+Tab` y el foco esta por salir de `container`
 * (o ya esta fuera de el), lo redirige al ultimo/primer elemento
 * enfocable — implementa un "focus trap" reutilizable. Se invoca desde
 * el `keydown` que cada componente flotante ya mantiene mientras esta
 * abierto (Fase 15): no agrega un listener nuevo, solo una linea mas de
 * manejo dentro del existente. Reutilizado por `Modal` y `Dropdown`; no
 * duplicar esta logica en un futuro componente flotante — importar esto.
 */
export function trapTabKey(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault();
      last?.focus();
    }
  } else if (active === last || !container.contains(active)) {
    event.preventDefault();
    first?.focus();
  }
}

/**
 * Devuelve el foco a `trigger` al cerrar un panel/dialogo flotante — pero
 * unicamente si el foco todavia esta dentro de `container` en ese momento.
 * Esta guarda evita "robarle" el foco a algo que se haya abierto como
 * consecuencia de la propia accion que cerro el panel (ej. un `Dropdown`
 * cuyo item ejecuta `onSelect` y abre un `Modal` antes de cerrarse: para
 * ese momento el foco ya esta dentro del `Modal`, y no debe volver al
 * disparador del `Dropdown`).
 */
export function restoreFocus(container: HTMLElement, trigger: HTMLElement | null): void {
  if (!trigger || !trigger.isConnected) return;
  if (!container.contains(document.activeElement)) return;
  trigger.focus();
}
