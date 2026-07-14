import { Input } from '../../../components/input/input';
import { Select, type SelectOption } from '../../../components/select/select';
import { Textarea } from '../../../components/textarea/textarea';
import { ClientesService } from '../../../services/clientes.service';
import type { Cliente } from '../../../types/cliente';
import { SucursalesService } from '../../../services/sucursales.service';
import { TiendasService } from '../../../services/tiendas.service';
import type { Pedido } from '../../../types/pedido';
import { el } from '../../../utils/dom';
import { createDependentOptionsLoader } from '../../../utils/dependent-options';
import { toSelectOptions } from '../../../utils/select-options';

export interface PedidoFormMode {
  mode: 'create' | 'edit';
  initial?: Pedido;
}

export interface PedidoFormValues {
  clienteId?: number;
  sucursalId?: number;
  direccionEntrega: string;
  telefonoContacto?: string;
  descripcionProducto?: string;
  valorProducto?: number;
  costoEnvio?: number;
  observaciones?: string;
}

export interface PedidoFormHandle {
  element: HTMLElement;
  validate: () => PedidoFormValues | null;
}

/**
 * Formulario compartido por Crear y Editar pedido (mismo patron de la Fase 4).
 * Es el unico formulario que resuelve sus propios selectores: Cliente y
 * Tienda se cargan en paralelo (listas independientes entre si); Sucursal
 * depende de la Tienda elegida y solo se consulta cuando esta tiene valor,
 * cacheando por tienda para no repetir la misma consulta (ver
 * `utils/dependent-options.ts`). En modo edicion, Cliente y Sucursal son
 * inmutables (igual que en el backend) y se muestran de solo lectura.
 */
export function buildPedidoForm({ mode, initial }: PedidoFormMode): PedidoFormHandle {
  let clientesById = new Map<string, Cliente>();

  const clienteField =
    mode === 'create'
      ? Select({
          name: 'clienteId',
          label: 'Cliente',
          required: true,
          options: [],
          disabled: true,
          placeholder: 'Cargando clientes...',
          onChange: (value) => handleClienteChange(value),
        })
      : Input({ name: 'clienteId', label: 'Cliente', value: 'Cargando...', disabled: true });

  const tiendaField =
    mode === 'create'
      ? Select({
          name: 'tiendaId',
          label: 'Tienda',
          required: true,
          options: [],
          disabled: true,
          placeholder: 'Cargando tiendas...',
          onChange: (value) => void handleTiendaChange(value),
        })
      : null;

  const sucursalField =
    mode === 'create'
      ? Select({
          name: 'sucursalId',
          label: 'Sucursal',
          required: true,
          options: [],
          disabled: true,
          placeholder: 'Selecciona primero una tienda',
        })
      : Input({ name: 'sucursalId', label: 'Sucursal', value: 'Cargando...', disabled: true });

  const direccionEntregaField = Input({
    name: 'direccionEntrega',
    label: 'Direccion de entrega',
    required: true,
    value: initial?.direccionEntrega,
  });

  const telefonoContactoField = Input({
    name: 'telefonoContacto',
    label: 'Telefono de contacto',
    helpText: 'Opcional, se usa el del cliente si se deja vacio',
    value: initial?.telefonoContacto ?? undefined,
  });

  const descripcionProductoField = Input({
    name: 'descripcionProducto',
    label: 'Descripcion del producto',
    helpText: 'Opcional',
    value: initial?.descripcionProducto ?? undefined,
  });

  const valorProductoField = Input({
    name: 'valorProducto',
    label: 'Valor del producto',
    type: 'number',
    helpText: 'Opcional',
    value: initial?.valorProducto ?? undefined,
  });

  const costoEnvioField = Input({
    name: 'costoEnvio',
    label: 'Costo de envio',
    type: 'number',
    helpText: 'Opcional',
    value: initial?.costoEnvio ?? undefined,
  });

  const observacionesField = Textarea({
    name: 'observaciones',
    label: 'Observaciones',
    helpText: 'Opcional',
    value: initial?.observaciones ?? undefined,
  });

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    clienteField.wrapper,
    tiendaField?.wrapper ?? null,
    sucursalField.wrapper,
    direccionEntregaField.wrapper,
    telefonoContactoField.wrapper,
    descripcionProductoField.wrapper,
    valorProductoField.wrapper,
    costoEnvioField.wrapper,
    observacionesField.wrapper,
  );

  const sucursalesLoader = createDependentOptionsLoader<number, SelectOption>((tiendaId) =>
    SucursalesService.listar({ page: 1, limit: 100, tiendaId }).then((response) =>
      toSelectOptions(
        response.data,
        (sucursal) => sucursal.id,
        (sucursal) => sucursal.nombre,
      ),
    ),
  );

  let latestTiendaRequestId = 0;

  async function handleTiendaChange(tiendaIdValue: string): Promise<void> {
    if (mode !== 'create' || !('setOptions' in sucursalField)) return;
    const requestId = ++latestTiendaRequestId;
    sucursalField.setDisabled(true);
    sucursalField.setOptions([]);
    if (!tiendaIdValue) return;
    const options = await sucursalesLoader.load(Number(tiendaIdValue));
    // Si el usuario ya eligio otra tienda mientras esta solicitud estaba en
    // curso, esta respuesta quedo obsoleta: no pisar la seleccion vigente.
    if (requestId !== latestTiendaRequestId) return;
    sucursalField.setOptions(options);
    sucursalField.setDisabled(false);
  }

  /**
   * Completa Direccion de entrega y Telefono de contacto con los datos ya
   * registrados del cliente elegido (el backend usa el telefono del
   * cliente si se deja vacio: ver comentario de `telefonoContacto` en
   * create-pedido.dto.ts). Solo rellena campos que el admin no haya escrito
   * todavia, para no pisar un valor ya editado manualmente.
   */
  function handleClienteChange(clienteIdValue: string): void {
    if (!clienteIdValue) return;
    const cliente = clientesById.get(clienteIdValue);
    if (!cliente) return;
    if (!direccionEntregaField.input.value.trim()) {
      direccionEntregaField.input.value = cliente.direccion;
    }
    if (!telefonoContactoField.input.value.trim()) {
      telefonoContactoField.input.value = cliente.telefono;
    }
  }

  if (mode === 'create' && 'setOptions' in clienteField && tiendaField) {
    void Promise.all([
      ClientesService.listar({ page: 1, limit: 100 }),
      TiendasService.listar({ page: 1, limit: 100 }).then((response) =>
        toSelectOptions(
          response.data,
          (tienda) => tienda.id,
          (tienda) => tienda.nombre,
        ),
      ),
    ]).then(([clientesResponse, tiendaOptions]) => {
      clientesById = new Map(clientesResponse.data.map((cliente) => [cliente.id, cliente]));
      clienteField.setOptions(
        toSelectOptions(
          clientesResponse.data,
          (cliente) => cliente.id,
          (cliente) => cliente.nombreCompleto,
        ),
      );
      clienteField.setDisabled(false);
      tiendaField.setOptions(tiendaOptions);
      tiendaField.setDisabled(false);
    });
  }

  if (mode === 'edit' && initial) {
    void Promise.all([
      ClientesService.buscarPorId(initial.clienteId),
      SucursalesService.buscarPorId(initial.sucursalId),
    ]).then(([cliente, sucursal]) => {
      if ('input' in clienteField) clienteField.input.value = cliente.nombreCompleto;
      if ('input' in sucursalField) sucursalField.input.value = sucursal.nombre;
    });
  }

  function validate(): PedidoFormValues | null {
    direccionEntregaField.setError(undefined);
    telefonoContactoField.setError(undefined);
    descripcionProductoField.setError(undefined);
    valorProductoField.setError(undefined);
    costoEnvioField.setError(undefined);
    observacionesField.setError(undefined);
    if ('setError' in clienteField) clienteField.setError(undefined);
    if (mode === 'create' && 'setError' in sucursalField) sucursalField.setError(undefined);

    let valid = true;
    let clienteId: number | undefined;
    let sucursalId: number | undefined;

    if (mode === 'create' && 'select' in clienteField) {
      const clienteIdValue = clienteField.select.value;
      if (!clienteIdValue) {
        clienteField.setError('Selecciona un cliente');
        valid = false;
      } else {
        clienteId = Number(clienteIdValue);
      }
    }

    if (mode === 'create' && 'select' in sucursalField) {
      const sucursalIdValue = sucursalField.select.value;
      if (!sucursalIdValue) {
        sucursalField.setError('Selecciona una sucursal');
        valid = false;
      } else {
        sucursalId = Number(sucursalIdValue);
      }
    }

    const direccionEntrega = direccionEntregaField.input.value.trim();
    const telefonoContacto = telefonoContactoField.input.value.trim();
    const descripcionProducto = descripcionProductoField.input.value.trim();
    const valorProductoRaw = valorProductoField.input.value.trim();
    const costoEnvioRaw = costoEnvioField.input.value.trim();
    const observaciones = observacionesField.textarea.value.trim();

    if (!direccionEntrega) {
      direccionEntregaField.setError('Este campo es obligatorio');
      valid = false;
    } else if (direccionEntrega.length > 255) {
      direccionEntregaField.setError('Maximo 255 caracteres');
      valid = false;
    }

    if (telefonoContacto && telefonoContacto.length > 20) {
      telefonoContactoField.setError('Maximo 20 caracteres');
      valid = false;
    }

    if (descripcionProducto && descripcionProducto.length > 255) {
      descripcionProductoField.setError('Maximo 255 caracteres');
      valid = false;
    }

    let valorProducto: number | undefined;
    if (valorProductoRaw) {
      valorProducto = Number(valorProductoRaw);
      if (Number.isNaN(valorProducto) || valorProducto < 0) {
        valorProductoField.setError('Debe ser un numero valido');
        valid = false;
      }
    }

    let costoEnvio: number | undefined;
    if (costoEnvioRaw) {
      costoEnvio = Number(costoEnvioRaw);
      if (Number.isNaN(costoEnvio) || costoEnvio < 0) {
        costoEnvioField.setError('Debe ser un numero valido');
        valid = false;
      }
    }

    if (observaciones && observaciones.length > 500) {
      observacionesField.setError('Maximo 500 caracteres');
      valid = false;
    }

    if (!valid) return null;

    return {
      clienteId,
      sucursalId,
      direccionEntrega,
      telefonoContacto: telefonoContacto || undefined,
      descripcionProducto: descripcionProducto || undefined,
      valorProducto,
      costoEnvio,
      observaciones: observaciones || undefined,
    };
  }

  return { element, validate };
}
