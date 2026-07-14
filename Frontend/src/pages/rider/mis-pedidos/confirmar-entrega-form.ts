import { Plus, Trash2 } from 'lucide';
import { Checkbox } from '../../../components/checkbox/checkbox';
import { IconButton } from '../../../components/button/icon-button';
import { Button } from '../../../components/button/button';
import { Input } from '../../../components/input/input';
import { Textarea } from '../../../components/textarea/textarea';
import type { FotoEntregaInput } from '../../../types/pedido';
import { cn } from '../../../utils/cn';
import { el } from '../../../utils/dom';

export interface ConfirmarEntregaFormValues {
  fotos: FotoEntregaInput[];
  observaciones?: string;
}

export interface ConfirmarEntregaFormHandle {
  element: HTMLElement;
  validate: () => ConfirmarEntregaFormValues | null;
}

interface FotoRow {
  rowEl: HTMLElement;
  urlInput: ReturnType<typeof Input>;
  principalCheckbox: ReturnType<typeof Checkbox>;
}

/**
 * Formulario de "Confirmar entrega" (CU10): el backend exige al menos una
 * URL de foto (no acepta archivos, solo URLs ya almacenadas — ver
 * ConfirmarEntregaDto/FotoEntregaInputDto). Permite agregar/quitar filas
 * de foto dinamicamente porque el backend acepta un arreglo de 1 o mas.
 */
export function buildConfirmarEntregaForm(): ConfirmarEntregaFormHandle {
  const rows: FotoRow[] = [];
  const rowsContainer = el('div', { className: 'flex flex-col gap-3' });

  const fotosErrorText = el('p', { className: cn('text-sm text-danger-600', 'hidden') }, '');

  function setFotosError(message: string | undefined): void {
    fotosErrorText.textContent = message ?? '';
    fotosErrorText.classList.toggle('hidden', !message);
  }

  function addRow(): void {
    const isFirst = rows.length === 0;
    const urlInput = Input({
      name: `fotoUrl-${rows.length}`,
      label: isFirst ? 'URL de la foto' : undefined,
      placeholder: 'https://...',
    });
    const principalCheckbox = Checkbox({
      name: `fotoPrincipal-${rows.length}`,
      label: 'Principal',
    });
    const removeButton = IconButton({
      icon: Trash2,
      label: 'Quitar foto',
      variant: 'ghost',
      size: 'sm',
      onClick: () => removeRow(rowEl),
    });

    const rowEl = el(
      'div',
      { className: 'flex items-end gap-3' },
      el('div', { className: 'flex-1' }, urlInput.wrapper),
      principalCheckbox.wrapper,
      rows.length > 0 ? removeButton : null,
    );

    rows.push({ rowEl, urlInput, principalCheckbox });
    rowsContainer.appendChild(rowEl);
  }

  function removeRow(rowEl: HTMLElement): void {
    if (rows.length <= 1) return;
    const index = rows.findIndex((row) => row.rowEl === rowEl);
    if (index === -1) return;
    rows.splice(index, 1);
    rowEl.remove();
  }

  addRow();

  const addButton = Button({
    label: 'Agregar otra foto',
    icon: Plus,
    variant: 'outline',
    size: 'sm',
    onClick: () => addRow(),
  });

  const observacionesField = Textarea({
    name: 'observaciones',
    label: 'Observaciones',
    helpText: 'Opcional',
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    el(
      'div',
      { className: 'flex flex-col gap-2' },
      el('span', { className: 'text-sm font-medium text-text-primary' }, 'Fotos de entrega'),
      rowsContainer,
      addButton,
      fotosErrorText,
    ),
    observacionesField.wrapper,
  );

  function validate(): ConfirmarEntregaFormValues | null {
    setFotosError(undefined);
    observacionesField.setError(undefined);

    const fotos: FotoEntregaInput[] = [];
    for (const row of rows) {
      const urlImagen = row.urlInput.input.value.trim();
      if (urlImagen) {
        fotos.push({ urlImagen, esPrincipal: row.principalCheckbox.checkbox.checked });
      }
    }

    if (fotos.length === 0) {
      setFotosError('Agrega al menos una URL de foto');
      return null;
    }

    const observaciones = observacionesField.textarea.value.trim();
    if (observaciones.length > 500) {
      observacionesField.setError('Maximo 500 caracteres');
      return null;
    }

    return { fotos, observaciones: observaciones || undefined };
  }

  return { element, validate };
}
