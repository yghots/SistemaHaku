import { Badge } from '../../../components/badge/badge';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import type { FotoEntrega, TipoFoto } from '../../../types/foto-entrega';
import { el } from '../../../utils/dom';
import { fotoEntregaUrl } from '../../../utils/foto-entrega-url';

const TIPO_FOTO_LABEL: Record<TipoFoto, string> = {
  recojo: 'Recojo',
  entrega: 'Entrega',
};

/**
 * Tabla de fotografias de recojo/entrega de un pedido. El backend
 * almacena el binario en MySQL (Fase 22), no una URL propia: cada fila
 * muestra una miniatura que apunta a `GET /pedidos/:id/fotos/:fotoId/imagen`
 * (`fotoEntregaUrl`). Reutilizada por el "Ver detalle" de Pedidos (Admin)
 * y por el detalle de pedido del panel del Motorizado.
 */
export function PedidoFotos(fotos: FotoEntrega[]): HTMLElement {
  const columns: DataTableColumn<FotoEntrega>[] = [
    {
      key: 'id',
      header: 'Imagen',
      render: (row) => {
        const src = fotoEntregaUrl(row);
        return el(
          'a',
          {
            href: src,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'block h-14 w-14 overflow-hidden rounded-lg border border-border-default',
          },
          el('img', {
            src,
            alt: `Foto de ${TIPO_FOTO_LABEL[row.tipo].toLowerCase()}`,
            className: 'h-full w-full object-cover',
            loading: 'lazy',
          }),
        );
      },
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
