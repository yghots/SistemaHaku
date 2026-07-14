import { Badge } from '../../../components/badge/badge';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import type { FotoEntrega, TipoFoto } from '../../../types/foto-entrega';
import { el } from '../../../utils/dom';

const TIPO_FOTO_LABEL: Record<TipoFoto, string> = {
  recojo: 'Recojo',
  entrega: 'Entrega',
};

/**
 * Tabla de fotografias de recojo/entrega de un pedido. El backend solo
 * almacena URLs (no archivos): cada fila muestra una miniatura enlazada a
 * la imagen original. Reutilizada por el "Ver detalle" de Pedidos (Admin)
 * y por el detalle de pedido del panel del Motorizado.
 */
export function PedidoFotos(fotos: FotoEntrega[]): HTMLElement {
  const columns: DataTableColumn<FotoEntrega>[] = [
    {
      key: 'urlImagen',
      header: 'Imagen',
      render: (row) =>
        el(
          'a',
          {
            href: row.urlImagen,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'block h-14 w-14 overflow-hidden rounded-lg border border-border-default',
          },
          el('img', {
            src: row.urlImagen,
            alt: `Foto de ${TIPO_FOTO_LABEL[row.tipo].toLowerCase()}`,
            className: 'h-full w-full object-cover',
            loading: 'lazy',
          }),
        ),
    },
    { key: 'tipo', header: 'Tipo', render: (row) => Badge({ label: TIPO_FOTO_LABEL[row.tipo] }) },
    {
      key: 'esPrincipal',
      header: 'Principal',
      render: (row) =>
        row.esPrincipal ? Badge({ label: 'Si', variant: 'success' }) : Badge({ label: 'No' }),
    },
  ];

  return DataTable({
    columns,
    rows: fotos,
    getRowKey: (row) => row.id,
    emptyTitle: 'Sin fotos registradas',
    emptyDescription: 'Este pedido todavia no tiene fotos de recojo o entrega.',
  });
}
