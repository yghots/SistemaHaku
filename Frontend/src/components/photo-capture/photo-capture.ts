import { Camera, Trash2 } from 'lucide';
import { Button } from '../button/button';
import { IconButton } from '../button/icon-button';
import { Loader } from '../loader/loader';
import { cn } from '../../utils/cn';
import { el } from '../../utils/dom';
import { optimizarFoto } from '../../utils/optimizar-foto';

export interface PhotoCaptureProps {
  /** Texto del boton de captura (ej. "Tomar foto de recojo"). */
  label: string;
  /** Se invoca cada vez que el archivo optimizado cambia: el archivo listo para enviar, o `null` si se quito o si la optimizacion fallo. */
  onChange?: (file: File | null) => void;
  className?: string;
}

export interface PhotoCaptureHandle {
  element: HTMLElement;
  /** Archivo ya optimizado (WebP, redimensionado, comprimido) listo para enviar — `null` mientras no haya foto o se este procesando todavia. */
  getFile: () => File | null;
  setError: (message: string | undefined) => void;
  /** Libera el object URL de la vista previa — llamar al descartar definitivamente este widget (ej. al quitar la fila que lo contiene). */
  dispose: () => void;
}

/**
 * Captura de fotografia con optimizacion automatica y transparente
 * (Fase 23). El mismo `<input type="file" accept="image/*" capture=
 * "environment">` abre la camara trasera en moviles compatibles y
 * degrada automaticamente al selector de archivos del sistema en
 * Desktop/Tablet/navegadores sin soporte de `capture` — sin deteccion de
 * capacidades por JS, es el propio navegador quien decide, exactamente
 * como pide la fase.
 *
 * Al elegir un archivo: se muestra un indicador de carga (nunca se
 * bloquea la interfaz — `optimizarFoto` corre en un Web Worker) mientras
 * se redimensiona/convierte/comprime, y luego se reemplaza por la vista
 * previa YA OPTIMIZADA — el usuario nunca ve la imagen original. Si la
 * optimizacion falla, se muestra un error inline y vuelve al estado
 * inicial (nunca queda un archivo sin optimizar listo para enviarse).
 */
export function PhotoCapture(props: PhotoCaptureProps): PhotoCaptureHandle {
  let archivoOptimizado: File | null = null;
  let previewUrl: string | null = null;

  const input = el('input', {
    type: 'file',
    accept: 'image/*',
    capture: 'environment',
    className: 'hidden',
  });

  const errorText = el('p', { className: cn('text-sm text-danger-600', 'hidden') }, '');

  function setError(message: string | undefined): void {
    errorText.textContent = message ?? '';
    errorText.classList.toggle('hidden', !message);
  }

  const triggerButton = Button({
    label: props.label,
    icon: Camera,
    variant: 'outline',
    size: 'sm',
    onClick: () => input.click(),
  });

  const removeButton = IconButton({
    icon: Trash2,
    label: 'Quitar foto',
    variant: 'ghost',
    size: 'sm',
    onClick: () => reset(),
  });

  const previewImg = el('img', {
    className: 'h-16 w-16 rounded-lg border border-border-default object-cover',
    alt: 'Vista previa de la fotografia optimizada',
  });

  const previewSlot = el(
    'div',
    { className: 'hidden items-center gap-3' },
    previewImg,
    removeButton,
  );

  const loadingSlot = el(
    'div',
    { className: 'hidden items-center gap-2 text-sm text-text-secondary' },
    Loader({ size: 16 }),
    'Optimizando fotografia...',
  );

  const row = el(
    'div',
    { className: 'flex flex-wrap items-center gap-3' },
    triggerButton,
    previewSlot,
    loadingSlot,
  );

  const wrapper = el(
    'div',
    { className: cn('flex flex-col gap-2', props.className) },
    row,
    errorText,
  );

  function showState(state: 'idle' | 'loading' | 'preview'): void {
    triggerButton.classList.toggle('hidden', state !== 'idle');
    loadingSlot.classList.toggle('hidden', state !== 'loading');
    loadingSlot.classList.toggle('flex', state === 'loading');
    previewSlot.classList.toggle('hidden', state !== 'preview');
    previewSlot.classList.toggle('flex', state === 'preview');
  }
  showState('idle');

  function revokePreview(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function reset(): void {
    archivoOptimizado = null;
    revokePreview();
    input.value = '';
    showState('idle');
    props.onChange?.(null);
  }

  input.addEventListener('change', () => {
    const archivo = input.files?.[0];
    if (!archivo) return;

    setError(undefined);
    showState('loading');

    optimizarFoto(archivo)
      .then((optimizada) => {
        archivoOptimizado = optimizada;
        revokePreview();
        previewUrl = URL.createObjectURL(optimizada);
        previewImg.src = previewUrl;
        showState('preview');
        props.onChange?.(optimizada);
      })
      .catch(() => {
        input.value = '';
        setError('No se pudo procesar la fotografia. Intenta nuevamente.');
        showState('idle');
        props.onChange?.(null);
      });
  });

  wrapper.appendChild(input);

  function getFile(): File | null {
    return archivoOptimizado;
  }

  return { element: wrapper, getFile, setError, dispose: revokePreview };
}
