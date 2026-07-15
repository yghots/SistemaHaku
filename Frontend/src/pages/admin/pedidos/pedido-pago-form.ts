import { Input } from '../../../components/input/input';
import { Select } from '../../../components/select/select';
import { Textarea } from '../../../components/textarea/textarea';
import { METODOS_PAGO, type MetodoPago } from '../../../types/pago';
import { el } from '../../../utils/dom';

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
  tarjeta: 'Tarjeta',
};

export interface PagoFormValues {
  metodoPago: MetodoPago;
  monto: number;
  montoRecibido?: number;
  observacion?: string;
}

export interface PagoFormHandle {
  element: HTMLElement;
  validate: () => PagoFormValues | null;
}

/**
 * Formulario de registro de pago (Fase 20): metodo, monto, monto recibido
 * (solo efectivo, con vuelto calculado en vivo) y observacion. Al elegir
 * un metodo distinto de efectivo, "Monto recibido"/"Vuelto" se ocultan
 * automaticamente — el vuelto mostrado aqui es solo una vista previa
 * inmediata para el usuario; el backend vuelve a calcularlo y es siempre
 * la fuente de verdad (`pagos-calculo.util.ts`).
 */
export function buildPagoForm(): PagoFormHandle {
  const metodoField = Select({
    name: 'metodoPago',
    label: 'Metodo de pago',
    required: true,
    placeholder: 'Selecciona un metodo',
    options: METODOS_PAGO.map((metodo) => ({ value: metodo, label: METODO_PAGO_LABEL[metodo] })),
    onChange: () => actualizarVisibilidadEfectivo(),
  });

  const montoField = Input({
    name: 'monto',
    label: 'Monto',
    type: 'number',
    required: true,
    helpText: 'Debe ser mayor a 0',
    onInput: () => actualizarVuelto(),
  });

  const montoRecibidoField = Input({
    name: 'montoRecibido',
    label: 'Monto recibido',
    type: 'number',
    onInput: () => actualizarVuelto(),
  });

  const vueltoField = Input({
    name: 'vuelto',
    label: 'Vuelto',
    type: 'number',
    disabled: true,
    value: '0.00',
  });

  const efectivoWrapper = el(
    'div',
    { className: 'grid grid-cols-1 gap-4 sm:grid-cols-2' },
    montoRecibidoField.wrapper,
    vueltoField.wrapper,
  );

  const observacionField = Textarea({
    name: 'observacion',
    label: 'Observacion',
    helpText: 'Opcional',
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    metodoField.wrapper,
    montoField.wrapper,
    efectivoWrapper,
    observacionField.wrapper,
  );

  function esEfectivo(): boolean {
    return metodoField.select.value === 'efectivo';
  }

  function actualizarVisibilidadEfectivo(): void {
    const efectivo = esEfectivo();
    efectivoWrapper.classList.toggle('hidden', !efectivo);
    if (!efectivo) {
      montoRecibidoField.input.value = '';
      vueltoField.input.value = '0.00';
      montoRecibidoField.setError(undefined);
    }
  }

  function actualizarVuelto(): void {
    if (!esEfectivo()) return;
    const monto = Number(montoField.input.value) || 0;
    const recibido = Number(montoRecibidoField.input.value) || 0;
    const vuelto = recibido > monto ? recibido - monto : 0;
    vueltoField.input.value = vuelto.toFixed(2);
  }

  // Oculto por defecto: ningun metodo esta seleccionado hasta que el usuario elige uno.
  actualizarVisibilidadEfectivo();

  function validate(): PagoFormValues | null {
    metodoField.setError(undefined);
    montoField.setError(undefined);
    montoRecibidoField.setError(undefined);
    observacionField.setError(undefined);

    let valid = true;

    const metodoPago = metodoField.select.value as MetodoPago | '';
    if (!metodoPago) {
      metodoField.setError('Selecciona un metodo de pago');
      valid = false;
    }

    const montoRaw = montoField.input.value.trim();
    const monto = Number(montoRaw);
    if (!montoRaw || Number.isNaN(monto) || monto <= 0) {
      montoField.setError('Debe ser un numero mayor a 0');
      valid = false;
    }

    let montoRecibido: number | undefined;
    if (metodoPago === 'efectivo') {
      const montoRecibidoRaw = montoRecibidoField.input.value.trim();
      montoRecibido = Number(montoRecibidoRaw);
      if (!montoRecibidoRaw || Number.isNaN(montoRecibido)) {
        montoRecibidoField.setError('Ingresa el monto recibido');
        valid = false;
      } else if (valid && montoRecibido < monto) {
        montoRecibidoField.setError('No puede ser menor al monto');
        valid = false;
      }
    }

    const observacion = observacionField.textarea.value.trim();
    if (observacion.length > 255) {
      observacionField.setError('Maximo 255 caracteres');
      valid = false;
    }

    if (!valid || !metodoPago) return null;

    return {
      metodoPago,
      monto,
      montoRecibido,
      observacion: observacion || undefined,
    };
  }

  return { element, validate };
}
