import { ImageOff } from 'lucide';
import { Badge } from '../../../components/badge/badge';
import { DataTable, type DataTableColumn } from '../../../components/datatable/datatable';
import { Icon } from '../../../components/icon/icon';
import { Modal } from '../../../components/modal/modal';
import type { FotoEntrega, TipoFoto } from '../../../types/foto-entrega';
import { cn } from '../../../utils/cn';
import { el } from '../../../utils/dom';
import { fotoEntregaUrl } from '../../../utils/foto-entrega-url';

const TIPO_FOTO_LABEL: Record<TipoFoto, string> = {
  recojo: 'Recojo',
  entrega: 'Entrega',
};

/**
 * Miniatura clickeable de una foto: abre una vista previa en grande sobre
 * un `Modal` (reutilizado tal cual, nunca una pestaña nueva ni descarga).
 * Si el binario no carga (foto eliminada, error de red), se reemplaza por
 * un placeholder con icono — nunca un cuadro roto de `<img>`.
 */
function fotoThumbnail(row: FotoEntrega): HTMLElement {
  const src = fotoEntregaUrl(row);
  const alt = `Foto de ${TIPO_FOTO_LABEL[row.tipo].toLowerCase()}`;
  let cargada = true;

  const img = el('img', {
    src,
    alt,
    className: 'h-full w-full object-cover',
    loading: 'lazy',
  });

  const placeholder = el(
    'div',
    {
      className:
        'hidden h-full w-full flex-col items-center justify-center gap-0.5 bg-surface-hover text-text-muted',
    },
    Icon({ icon: ImageOff, size: 18 }),
    el('span', { className: 'text-[9px] font-medium leading-none' }, 'Sin imagen'),
  );

  const thumbnail = el(
    'button',
    {
      type: 'button',
      className: cn(
        'block h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border-default shadow-sm',
        'transition-transform duration-150 ease-out hover:scale-105 hover:shadow-md',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      ),
      'aria-label': `Ver ${alt} en tamano completo`,
    },
    img,
    placeholder,
  );

  img.addEventListener('error', () => {
    cargada = false;
    img.classList.add('hidden');
    placeholder.classList.remove('hidden');
    placeholder.classList.add('flex');
    thumbnail.classList.remove('cursor-pointer', 'hover:scale-105', 'hover:shadow-md');
    thumbnail.classList.add('cursor-default');
  });

  thumbnail.addEventListener('click', () => {
    if (!cargada) return;
    openFotoPreview(src, alt);
  });

  return thumbnail;
}

/** Vista previa en grande: mismo `Modal` de siempre (X, click afuera, Escape ya incluidos). */
function openFotoPreview(src: string, alt: string): void {
  const modal = Modal({
    size: 'xl',
    content: el(
      'div',
      { className: 'flex items-center justify-center' },
      el('img', {
        src,
        alt,
        className: 'max-h-[75vh] w-auto max-w-full rounded-lg object-contain',
      }),
    ),
    onClose: () => modal.destroy(),
  });
  modal.open();
}

/**
 * Tabla de fotografias de recojo/entrega de un pedido. El backend
 * almacena el binario en MySQL (Fase 22), no una URL propia: cada fila
 * muestra una miniatura que apunta a `GET /pedidos/:id/fotos/:fotoId/imagen`
 * (`fotoEntregaUrl`). Reutilizada por el "Ver detalle" de Pedidos (Admin)
 * y por el detalle de pedido del panel del Motorizado.
 */
export function PedidoFotos(fotos: FotoEntrega[]): HTMLElement {
  const columns: DataTableColumn<FotoEntrega>[] = [
    { key: 'id', header: 'Imagen', render: (row) => fotoThumbnail(row) },
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
