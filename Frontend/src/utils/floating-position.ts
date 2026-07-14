export interface FloatingTriggerRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export interface FloatingSize {
  width: number;
  height: number;
}

export interface ComputeFloatingPositionOptions {
  /** Rect del elemento que abre el flotante (`trigger.getBoundingClientRect()`), en coordenadas de viewport. */
  triggerRect: FloatingTriggerRect;
  /** Ancho/alto reales del panel flotante ya medidos (ej. via `getBoundingClientRect()` con opacity 0, pero ya fuera de `display:none`). */
  floatingSize: FloatingSize;
  /** Alineacion horizontal preferida respecto al trigger, cuando hay espacio para respetarla. */
  align?: 'left' | 'right';
  /** Separacion entre el trigger y el panel, y margen minimo respecto a los bordes de la ventana (px). */
  margin?: number;
}

export interface FloatingPosition {
  /** Coordenadas para `position: fixed` (relativas al viewport, no al documento). */
  top: number;
  left: number;
  /** Lado real donde termino abriendo, util para elegir `transform-origin` u otros ajustes visuales. */
  openedUpward: boolean;
  alignedRight: boolean;
}

/**
 * Calcula la posicion de un panel flotante (`position: fixed`) respecto a
 * su trigger, sin salirse nunca de la ventana: abre hacia abajo o hacia
 * arriba segun el espacio disponible, y se alinea a la derecha o
 * izquierda del trigger segun corresponda. Funcion pura (no toca el DOM,
 * no mantiene estado): reutilizable por cualquier componente flotante
 * posicionado respecto a un trigger (`Dropdown` hoy; `Tooltip` u otros en
 * el futuro), sin duplicar esta logica.
 */
export function computeFloatingPosition({
  triggerRect,
  floatingSize,
  align = 'right',
  margin = 8,
}: ComputeFloatingPositionOptions): FloatingPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spaceBelow = viewportHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const openedUpward = spaceBelow < floatingSize.height + margin && spaceAbove > spaceBelow;

  const top = openedUpward
    ? triggerRect.top - floatingSize.height - margin
    : triggerRect.bottom + margin;

  let left = align === 'right' ? triggerRect.right - floatingSize.width : triggerRect.left;
  let alignedRight = align === 'right';

  if (left < margin) {
    left = triggerRect.left;
    alignedRight = false;
  }
  if (left + floatingSize.width > viewportWidth - margin) {
    left = triggerRect.right - floatingSize.width;
    alignedRight = true;
  }

  left = Math.max(margin, Math.min(left, viewportWidth - floatingSize.width - margin));

  return { top, left, openedUpward, alignedRight };
}
