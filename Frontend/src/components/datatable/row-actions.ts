import { MoreVertical } from 'lucide';
import type { IconNode } from 'lucide';
import { IconButton } from '../button/icon-button';
import { Dropdown } from '../dropdown/dropdown';

export interface RowAction {
  label: string;
  icon?: IconNode;
  /** Accion a ejecutar. Omitir si la fila usa `href` para navegar en su lugar. */
  onSelect?: () => void;
  /** Alternativa a `onSelect`: navega via el router SPA (ej. "Ver sucursales" de una tienda). */
  href?: string;
  danger?: boolean;
  /** Si es true, la accion se omite (ej. "Activar" cuando ya esta activo). */
  hidden?: boolean;
}

/**
 * Menu de acciones por fila, reutilizable por el DataTable de cualquier
 * modulo (Ver/Editar/Activar/Desactivar/Eliminar/navegar, etc.). Compone
 * IconButton + Dropdown ya existentes; no es una tabla ni un modal nuevo.
 */
export function RowActions(actions: RowAction[]): HTMLElement {
  const visible = actions.filter((action) => !action.hidden);

  const trigger = IconButton({
    icon: MoreVertical,
    label: 'Acciones',
    variant: 'ghost',
    size: 'sm',
  });

  const dropdown = Dropdown({
    trigger,
    align: 'right',
    items: visible.map((action) => ({
      label: action.label,
      icon: action.icon,
      danger: action.danger,
      onSelect: action.onSelect,
      href: action.href,
    })),
  });

  return dropdown.wrapper;
}
