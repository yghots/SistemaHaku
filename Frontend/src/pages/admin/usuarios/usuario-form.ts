import { Input } from '../../../components/input/input';
import { Select } from '../../../components/select/select';
import type { UserRole } from '../../../types/auth';
import type { Usuario } from '../../../types/usuario';
import { el } from '../../../utils/dom';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROL_OPTIONS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'motorizado', label: 'Motorizado' },
];

export interface UsuarioFormMode {
  mode: 'create' | 'edit';
  initial?: Usuario;
  /** Placa ya registrada del perfil de motorizado del usuario (solo modo 'edit' + rol motorizado con perfil existente). */
  initialPlaca?: string;
}

export interface UsuarioFormValues {
  nombres: string;
  apellidos: string;
  usuario: string;
  correo: string;
  /** Vacio en modo edicion significa "no cambiar la contraseña". */
  password: string;
  rol: UserRole;
  /** Solo presente cuando rol === 'motorizado' (Fase 33: creacion/edicion de motorizado unificada con Usuarios). */
  placa?: string;
}

export interface UsuarioFormHandle {
  element: HTMLElement;
  /** Valida en el cliente (formato/obligatoriedad, complementa al backend). Si es invalido, marca los campos y devuelve null. */
  validate: () => UsuarioFormValues | null;
}

/**
 * Formulario compartido por Crear y Editar usuario (misma infraestructura,
 * tal como pide el brief). El modo `edit` precarga valores y vuelve
 * opcional la contraseña.
 *
 * Fase 33 (Parte 5 del rediseno de ciclo de vida): cuando el rol elegido es
 * "Motorizado", se muestra un campo "Placa" adicional — evita el flujo
 * fragmentado de crear el Usuario y luego, por separado, su perfil
 * operativo. El campo se muestra/oculta dinamicamente segun el valor
 * elegido en el Select de rol (no solo el valor inicial), reutilizando el
 * patron ya establecido de campos condicionales del proyecto.
 */
export function buildUsuarioForm({
  mode,
  initial,
  initialPlaca,
}: UsuarioFormMode): UsuarioFormHandle {
  const nombresField = Input({
    name: 'nombres',
    label: 'Nombres',
    required: true,
    value: initial?.nombres,
  });

  const apellidosField = Input({
    name: 'apellidos',
    label: 'Apellidos',
    required: true,
    value: initial?.apellidos,
  });

  const usuarioField = Input({
    name: 'usuario',
    label: 'Usuario',
    required: true,
    value: initial?.usuario,
  });

  const correoField = Input({
    name: 'correo',
    label: 'Correo electronico',
    type: 'email',
    required: true,
    value: initial?.correo,
  });

  const passwordField = Input({
    name: 'password',
    label: mode === 'create' ? 'Contraseña' : 'Nueva contraseña',
    type: 'password',
    required: mode === 'create',
    helpText: mode === 'edit' ? 'Dejar en blanco para no cambiarla' : undefined,
  });

  const rolField = Select({
    name: 'rol',
    label: 'Rol',
    required: true,
    value: initial?.rol ?? 'administrador',
    options: ROL_OPTIONS,
    onChange: (value) => actualizarVisibilidadPlaca(value as UserRole),
  });

  const placaField = Input({
    name: 'placa',
    label: 'Placa',
    required: true,
    value: initialPlaca,
    helpText: 'Placa del vehiculo que usa este motorizado.',
  });

  function actualizarVisibilidadPlaca(rol: UserRole): void {
    placaField.wrapper.classList.toggle('hidden', rol !== 'motorizado');
  }
  actualizarVisibilidadPlaca(initial?.rol ?? 'administrador');

  const element = el(
    'div',
    { className: 'flex flex-col gap-4' },
    nombresField.wrapper,
    apellidosField.wrapper,
    usuarioField.wrapper,
    correoField.wrapper,
    passwordField.wrapper,
    rolField.wrapper,
    placaField.wrapper,
  );

  function validate(): UsuarioFormValues | null {
    nombresField.setError(undefined);
    apellidosField.setError(undefined);
    usuarioField.setError(undefined);
    correoField.setError(undefined);
    passwordField.setError(undefined);
    placaField.setError(undefined);

    const nombres = nombresField.input.value.trim();
    const apellidos = apellidosField.input.value.trim();
    const usuario = usuarioField.input.value.trim();
    const correo = correoField.input.value.trim();
    const password = passwordField.input.value;
    const rol = rolField.select.value as UserRole;
    const placa = placaField.input.value.trim();

    let valid = true;

    if (!nombres) {
      nombresField.setError('Este campo es obligatorio');
      valid = false;
    } else if (nombres.length > 100) {
      nombresField.setError('Maximo 100 caracteres');
      valid = false;
    }

    if (!apellidos) {
      apellidosField.setError('Este campo es obligatorio');
      valid = false;
    } else if (apellidos.length > 100) {
      apellidosField.setError('Maximo 100 caracteres');
      valid = false;
    }

    if (!usuario) {
      usuarioField.setError('Este campo es obligatorio');
      valid = false;
    } else if (usuario.length > 50) {
      usuarioField.setError('Maximo 50 caracteres');
      valid = false;
    }

    if (!correo) {
      correoField.setError('Este campo es obligatorio');
      valid = false;
    } else if (!EMAIL_PATTERN.test(correo)) {
      correoField.setError('Ingresa un correo valido');
      valid = false;
    } else if (correo.length > 150) {
      correoField.setError('Maximo 150 caracteres');
      valid = false;
    }

    if (mode === 'create' && !password) {
      passwordField.setError('Este campo es obligatorio');
      valid = false;
    } else if (password && (password.length < 8 || password.length > 100)) {
      passwordField.setError('Debe tener entre 8 y 100 caracteres');
      valid = false;
    }

    if (rol === 'motorizado') {
      if (!placa) {
        placaField.setError('Este campo es obligatorio');
        valid = false;
      } else if (placa.length > 15) {
        placaField.setError('Maximo 15 caracteres');
        valid = false;
      }
    }

    if (!valid) return null;
    return {
      nombres,
      apellidos,
      usuario,
      correo,
      password,
      rol,
      ...(rol === 'motorizado' ? { placa } : {}),
    };
  }

  return { element, validate };
}
