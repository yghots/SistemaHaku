import { DataTable, type DataTableColumn } from '../datatable/datatable';
import { Pagination } from '../pagination/pagination';
import { SearchBar } from '../searchbar/searchbar';
import { Select, type SelectOption } from '../select/select';
import { HttpError } from '../../services/http/http-error';
import type { PaginatedResponse } from '../../types/api';
import { el } from '../../utils/dom';

interface ResourceSearchFilterField {
  type?: 'search';
  /** Nombre exacto del parametro de query que soporta el backend (ej. "usuario", "correo"). No inventar filtros no soportados. */
  name: string;
  placeholder: string;
  initialValue?: string;
}

interface ResourceSelectFilterField {
  type: 'select';
  name: string;
  /** Tambien se usa como etiqueta de la opcion "sin filtro" (ej. "Todas las tiendas"). */
  placeholder: string;
  options: SelectOption[];
  initialValue?: string;
}

export type ResourceFilterField = ResourceSearchFilterField | ResourceSelectFilterField;

export interface ResourceTableOptions<T, F extends Record<string, string>> {
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  fetchPage: (
    params: { page: number; limit: number } & Partial<F>,
  ) => Promise<PaginatedResponse<T>>;
  /** Un campo de filtro por cada parametro que el backend soporte (texto libre o seleccion). */
  filterFields?: ResourceFilterField[];
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
}

export interface ResourceTableHandle {
  element: HTMLElement;
  /** Vuelve a pedir la pagina actual al backend (ej. tras crear/editar/eliminar un registro). */
  reload: () => void;
}

/**
 * Infraestructura reutilizable para todo listado administrativo: compone
 * filtros (SearchBar y/o Select) + DataTable (loading/error/vacio) +
 * Pagination, maneja el estado de pagina/filtros y las llamadas de
 * recarga. Ningun modulo debe reimplementar esta orquestacion: solo
 * configurar columnas, `fetchPage` y los campos de filtro soportados por
 * su propio endpoint.
 */
export function ResourceTable<T, F extends Record<string, string> = Record<string, string>>(
  options: ResourceTableOptions<T, F>,
): ResourceTableHandle {
  const limit = options.pageSize ?? 10;
  let page = 1;
  const filters: Partial<F> = {};

  for (const field of options.filterFields ?? []) {
    if (field.initialValue) {
      (filters as Record<string, string>)[field.name] = field.initialValue;
    }
  }

  const tableContainer = el('div', {});
  const paginationContainer = el('div', { className: 'flex justify-center' });

  function renderTable(rows: T[], state: { loading?: boolean; error?: string } = {}): void {
    tableContainer.replaceChildren(
      DataTable({
        columns: options.columns,
        rows,
        getRowKey: options.getRowKey,
        loading: state.loading,
        error: state.error,
        onRetry: state.error ? () => void load() : undefined,
        emptyTitle: options.emptyTitle,
        emptyDescription: options.emptyDescription,
      }),
    );
  }

  function renderPagination(total: number): void {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (totalPages <= 1) {
      paginationContainer.replaceChildren();
      return;
    }
    paginationContainer.replaceChildren(
      Pagination({
        page,
        totalPages,
        onPageChange: (newPage) => {
          page = newPage;
          void load();
        },
      }),
    );
  }

  async function load(): Promise<void> {
    renderTable([], { loading: true });
    try {
      const result = await options.fetchPage({ page, limit, ...filters });
      renderTable(result.data);
      renderPagination(result.total);
    } catch (error) {
      const message =
        error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
      renderTable([], { error: message });
      paginationContainer.replaceChildren();
    }
  }

  function applyFilter(name: string, value: string): void {
    if (value) {
      (filters as Record<string, string>)[name] = value;
    } else {
      delete (filters as Record<string, string>)[name];
    }
    page = 1;
    void load();
  }

  function renderFilterField(field: ResourceFilterField): HTMLElement {
    if (field.type === 'select') {
      const select = Select({
        name: field.name,
        value: field.initialValue ?? '',
        options: [{ value: '', label: field.placeholder }, ...field.options],
        onChange: (value) => applyFilter(field.name, value),
      });
      return el('div', { className: 'w-full max-w-xs' }, select.wrapper);
    }

    const search = SearchBar({
      placeholder: field.placeholder,
      value: field.initialValue,
      className: 'w-full max-w-xs',
      onSearch: (value) => applyFilter(field.name, value),
    });
    return search.wrapper;
  }

  const filterBar = options.filterFields?.length
    ? el(
        'div',
        { className: 'flex flex-wrap gap-3' },
        ...options.filterFields.map(renderFilterField),
      )
    : null;

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    filterBar,
    tableContainer,
    paginationContainer,
  );

  void load();

  return { element, reload: () => void load() };
}
