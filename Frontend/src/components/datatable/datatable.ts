import { AlertTriangle, Inbox } from 'lucide';
import { Button } from '../button/button';
import { EmptyState } from '../empty-state/empty-state';
import { Skeleton } from '../skeleton/skeleton';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';

export interface DataTableColumn<T> {
  key: keyof T & string;
  header: string;
  render?: (row: T) => Node | string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  /** Mensaje de error (ej. fallo de red/API). Tiene prioridad sobre loading/rows. */
  error?: string;
  /** Boton "Reintentar" mostrado junto al error, si se provee. */
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Tabla generica y reutilizable. NO crear tablas especificas por modulo
 * (ej. "PedidosTable"): toda tabla del proyecto se construye configurando
 * `columns`/`rows` de esta.
 */
export function DataTable<T>(props: DataTableProps<T>): HTMLDivElement {
  const wrapper = el('div', {
    className: cn(
      'overflow-x-auto rounded-xl border border-border-default bg-surface-elevated',
      props.className,
    ),
  });

  const headerRow = el(
    'tr',
    {},
    ...props.columns.map((column) =>
      el(
        'th',
        {
          className: cn(
            'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted',
            column.className,
          ),
        },
        column.header,
      ),
    ),
  );

  const table = el(
    'table',
    { className: 'w-full min-w-full divide-y divide-border-default text-sm' },
    el('thead', { className: 'bg-surface-muted' }, headerRow),
  );

  if (props.error) {
    wrapper.appendChild(
      EmptyState({
        icon: AlertTriangle,
        title: 'No se pudo cargar la informacion',
        description: props.error,
        action: props.onRetry
          ? Button({ label: 'Reintentar', variant: 'outline', size: 'sm', onClick: props.onRetry })
          : undefined,
      }),
    );
    return wrapper;
  }

  if (props.loading) {
    const skeletonRows = Array.from({ length: 4 }, () =>
      el(
        'tr',
        {},
        ...props.columns.map(() =>
          el('td', { className: 'px-4 py-3' }, Skeleton({ width: '100%', height: '1rem' })),
        ),
      ),
    );
    table.appendChild(
      el('tbody', { className: 'divide-y divide-border-default' }, ...skeletonRows),
    );
    wrapper.appendChild(table);
    return wrapper;
  }

  if (props.rows.length === 0) {
    wrapper.appendChild(
      EmptyState({
        icon: Inbox,
        title: props.emptyTitle ?? 'Sin resultados',
        description: props.emptyDescription ?? 'No hay datos para mostrar todavia.',
      }),
    );
    return wrapper;
  }

  const bodyRows = props.rows.map((row) =>
    el(
      'tr',
      {
        className: 'transition-colors hover:bg-surface-muted',
        dataset: { rowKey: props.getRowKey(row) },
      },
      ...props.columns.map((column) => {
        const content = column.render ? column.render(row) : String(row[column.key] ?? '');
        return el(
          'td',
          { className: cn('px-4 py-3 text-text-primary', column.className) },
          content,
        );
      }),
    ),
  );

  table.appendChild(el('tbody', { className: 'divide-y divide-border-default' }, ...bodyRows));

  // Por debajo de `sm` la tabla se reemplaza por una lista de tarjetas
  // apiladas (una por fila), generada automaticamente a partir de las
  // mismas `columns` — ninguna pagina construye su propia version movil:
  // esta es la unica estrategia responsive de DataTable, reutilizada por
  // absolutamente todos los listados del proyecto (Admin y Rider) sin
  // que ninguno tenga que pasar props ni markup adicional. Ambos arboles
  // conviven en el DOM; Tailwind (`hidden`/`sm:hidden`) decide cual se ve
  // segun el ancho de pantalla, sin JS ni listeners de resize.
  const cardList = el(
    'div',
    { className: 'flex flex-col gap-3 p-3 sm:hidden' },
    ...props.rows.map((row) => buildCard(row, props.columns, props.getRowKey(row))),
  );

  wrapper.appendChild(el('div', { className: 'hidden sm:block' }, table));
  wrapper.appendChild(cardList);

  return wrapper;
}

/**
 * Tarjeta movil generada a partir de `columns`: la primera columna con
 * `header` no vacio es el titulo de la tarjeta; una columna con
 * `header: ''` (la convencion ya usada en todo el proyecto para la celda
 * de `RowActions`) se ubica junto al titulo en vez de en la lista de
 * pares etiqueta/valor; el resto se apila como filas "etiqueta: valor".
 * No se omite ninguna columna: mismo contenido que la tabla, solo con
 * otra disposicion visual.
 */
function buildCard<T>(row: T, columns: DataTableColumn<T>[], rowKey: string): HTMLElement {
  const metaColumn = columns.find((column) => column.header === '');
  const contentColumns = columns.filter((column) => column.header !== '');
  const [titleColumn, ...restColumns] = contentColumns;

  function renderColumn(column: DataTableColumn<T>): Node | string {
    return column.render ? column.render(row) : String(row[column.key] ?? '');
  }

  return el(
    'div',
    {
      className:
        'flex flex-col gap-2 rounded-lg border border-border-default p-4 transition-colors hover:bg-surface-muted',
      dataset: { rowKey },
    },
    el(
      'div',
      { className: 'flex items-start justify-between gap-3' },
      titleColumn
        ? el(
            'span',
            { className: 'text-sm font-semibold text-text-primary' },
            renderColumn(titleColumn),
          )
        : null,
      metaColumn ? renderColumn(metaColumn) : null,
    ),
    restColumns.length > 0
      ? el(
          'dl',
          { className: 'flex flex-col gap-1.5' },
          ...restColumns.map((column) =>
            el(
              'div',
              { className: 'flex items-baseline justify-between gap-3 text-sm' },
              el('dt', { className: 'shrink-0 text-text-muted' }, column.header),
              el('dd', { className: 'text-right text-text-primary' }, renderColumn(column)),
            ),
          ),
        )
      : null,
  );
}
