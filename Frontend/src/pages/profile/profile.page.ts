import { Moon, Sun } from 'lucide';
import { confirmDialog, infoAlert } from '../../components/alert/alert';
import { Avatar } from '../../components/avatar/avatar';
import { Badge } from '../../components/badge/badge';
import { Button } from '../../components/button/button';
import { Card } from '../../components/card/card';
import { DetailList } from '../../components/detail-list/detail-list';
import { EmptyState } from '../../components/empty-state/empty-state';
import { Input } from '../../components/input/input';
import { Loader } from '../../components/loader/loader';
import { PageHeader } from '../../components/page-header/page-header';
import { showSuccessToast } from '../../components/toast/toast';
import { ROL_USUARIO_BADGE_VARIANT, ROL_USUARIO_LABEL } from '../../constants/rol-usuario';
import { env } from '../../config/env';
import { HttpError } from '../../services/http/http-error';
import { ProfileService } from '../../services/profile.service';
import type { Usuario } from '../../types/usuario';
import { el } from '../../utils/dom';
import { nombreCompleto } from '../../utils/nombre-completo';
import { getTheme, onThemeChange, setTheme, type Theme } from '../../utils/theme';

/**
 * "Mi Perfil": pagina unica, compartida verbatim por el panel
 * Administrativo (`/admin/perfil`) y el panel del Motorizado
 * (`/rider/perfil`) — misma implementacion exacta para ambos roles, sin
 * ramas por rol (el rol/estado mostrados ya reflejan al usuario real).
 * Solo se comunica con `ProfileService`, nunca con `UsuariosService` o
 * `SessionService` directamente.
 */
export function ProfilePage(): HTMLElement {
  const contentSlot = el(
    'div',
    { className: 'flex justify-center py-10' },
    Loader({ label: 'Cargando perfil' }),
  );

  const container = el(
    'div',
    { className: 'flex flex-col gap-6' },
    PageHeader({
      title: 'Mi Perfil',
      description: 'Gestiona tu informacion personal, seguridad y preferencias.',
      breadcrumb: [{ label: 'Mi Perfil' }],
    }),
    contentSlot,
  );

  void init();

  async function init(): Promise<void> {
    try {
      const usuario = await ProfileService.obtenerPerfil();
      contentSlot.replaceChildren(buildContent(usuario));
    } catch (error) {
      contentSlot.replaceChildren(
        EmptyState({
          title: 'No se pudo cargar tu perfil',
          description:
            error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.',
        }),
      );
    }
  }

  function buildContent(usuarioInicial: Usuario): HTMLElement {
    let usuarioActual = usuarioInicial;

    const infoCardSlot = el('div', {}, buildInfoCard(usuarioActual));
    const accountCardSlot = el('div', {}, buildAccountCard(usuarioActual));

    function onPerfilActualizado(actualizado: Usuario): void {
      usuarioActual = actualizado;
      infoCardSlot.replaceChildren(buildInfoCard(usuarioActual));
      accountCardSlot.replaceChildren(buildAccountCard(usuarioActual));
    }

    function buildInfoCard(usuario: Usuario): HTMLElement {
      const nombresField = Input({
        name: 'nombres',
        label: 'Nombres',
        required: true,
        value: usuario.nombres,
      });
      const apellidosField = Input({
        name: 'apellidos',
        label: 'Apellidos',
        required: true,
        value: usuario.apellidos,
      });
      const usuarioField = Input({
        name: 'usuario',
        label: 'Usuario',
        required: true,
        value: usuario.usuario,
      });
      const correoField = Input({
        name: 'correo',
        label: 'Correo',
        type: 'email',
        required: true,
        value: usuario.correo,
      });

      const saveButton = Button({ label: 'Guardar cambios', onClick: () => void handleGuardar() });

      async function handleGuardar(): Promise<void> {
        nombresField.setError(undefined);
        apellidosField.setError(undefined);
        usuarioField.setError(undefined);
        correoField.setError(undefined);

        const nombresValue = nombresField.input.value.trim();
        const apellidosValue = apellidosField.input.value.trim();
        const usuarioValue = usuarioField.input.value.trim();
        const correoValue = correoField.input.value.trim();

        let valid = true;
        if (!nombresValue) {
          nombresField.setError('Este campo es obligatorio');
          valid = false;
        } else if (nombresValue.length > 100) {
          nombresField.setError('Maximo 100 caracteres');
          valid = false;
        }

        if (!apellidosValue) {
          apellidosField.setError('Este campo es obligatorio');
          valid = false;
        } else if (apellidosValue.length > 100) {
          apellidosField.setError('Maximo 100 caracteres');
          valid = false;
        }

        if (!usuarioValue) {
          usuarioField.setError('Este campo es obligatorio');
          valid = false;
        } else if (usuarioValue.length > 50) {
          usuarioField.setError('Maximo 50 caracteres');
          valid = false;
        }

        if (!correoValue) {
          correoField.setError('Este campo es obligatorio');
          valid = false;
        } else if (correoValue.length > 150) {
          correoField.setError('Maximo 150 caracteres');
          valid = false;
        }

        if (!valid) return;

        saveButton.disabled = true;
        try {
          const actualizado = await ProfileService.actualizarPerfil({
            nombres: nombresValue,
            apellidos: apellidosValue,
            usuario: usuarioValue,
            correo: correoValue,
          });
          showSuccessToast('Perfil actualizado correctamente');
          onPerfilActualizado(actualizado);
        } catch (error) {
          await showApiError(error);
        } finally {
          saveButton.disabled = false;
        }
      }

      return Card({
        title: 'Informacion personal',
        children: el(
          'div',
          { className: 'flex flex-col gap-4' },
          el(
            'div',
            { className: 'flex items-center gap-4' },
            Avatar({ name: nombreCompleto(usuario), size: 'lg' }),
            el(
              'div',
              { className: 'flex flex-col gap-1' },
              el(
                'span',
                { className: 'text-base font-semibold text-text-primary' },
                nombreCompleto(usuario),
              ),
              el('span', { className: 'text-sm text-text-muted' }, usuario.correo),
            ),
          ),
          nombresField.wrapper,
          apellidosField.wrapper,
          usuarioField.wrapper,
          correoField.wrapper,
          DetailList({
            fields: [
              {
                label: 'Rol',
                value: Badge({
                  label: ROL_USUARIO_LABEL[usuario.rol],
                  variant: ROL_USUARIO_BADGE_VARIANT[usuario.rol],
                }),
              },
              {
                label: 'Estado',
                value: Badge({
                  label: usuario.activo ? 'Activo' : 'Inactivo',
                  variant: usuario.activo ? 'success' : 'danger',
                }),
              },
            ],
          }),
        ),
        footer: saveButton,
      });
    }

    function buildSecurityCard(): HTMLElement {
      const passwordField = Input({
        name: 'password',
        label: 'Nueva contrasena',
        type: 'password',
        required: true,
        helpText: 'Minimo 8 caracteres',
      });
      const confirmField = Input({
        name: 'passwordConfirm',
        label: 'Confirmar contrasena',
        type: 'password',
        required: true,
      });

      const changeButton = Button({
        label: 'Cambiar contrasena',
        variant: 'outline',
        onClick: () => void handleCambiar(),
      });

      async function handleCambiar(): Promise<void> {
        passwordField.setError(undefined);
        confirmField.setError(undefined);

        const password = passwordField.input.value;
        const confirmacion = confirmField.input.value;

        let valid = true;
        if (!password) {
          passwordField.setError('Este campo es obligatorio');
          valid = false;
        } else if (password.length < 8) {
          passwordField.setError('Debe tener al menos 8 caracteres');
          valid = false;
        } else if (password.length > 100) {
          passwordField.setError('Maximo 100 caracteres');
          valid = false;
        }

        if (valid && password !== confirmacion) {
          confirmField.setError('Las contrasenas no coinciden');
          valid = false;
        }

        if (!valid) return;

        const confirmado = await confirmDialog({
          title: 'Cambiar contrasena',
          text: '¿Confirmas cambiar tu contrasena?',
          icon: 'question',
        });
        if (!confirmado) return;

        changeButton.disabled = true;
        try {
          await ProfileService.actualizarPassword({ password });
          showSuccessToast('Contrasena actualizada correctamente');
          passwordField.input.value = '';
          confirmField.input.value = '';
        } catch (error) {
          await showApiError(error);
        } finally {
          changeButton.disabled = false;
        }
      }

      return Card({
        title: 'Seguridad',
        subtitle: 'No se solicita tu contrasena actual (sistema de uso interno).',
        children: el(
          'div',
          { className: 'flex flex-col gap-4' },
          passwordField.wrapper,
          confirmField.wrapper,
        ),
        footer: changeButton,
      });
    }

    function buildAccountCard(usuario: Usuario): HTMLElement {
      return Card({
        title: 'Informacion de la cuenta',
        children: DetailList({
          fields: [
            {
              label: 'Rol',
              value: Badge({
                label: ROL_USUARIO_LABEL[usuario.rol],
                variant: ROL_USUARIO_BADGE_VARIANT[usuario.rol],
              }),
            },
            {
              label: 'Estado',
              value: Badge({
                label: usuario.activo ? 'Activo' : 'Inactivo',
                variant: usuario.activo ? 'success' : 'danger',
              }),
            },
            { label: 'Version del sistema', value: env.appVersion },
          ],
        }),
      });
    }

    function buildThemeCard(): HTMLElement {
      function buildButtons(): HTMLElement {
        const temaActual: Theme = getTheme();
        return el(
          'div',
          { className: 'flex gap-3' },
          Button({
            label: 'Claro',
            icon: Sun,
            variant: temaActual === 'light' ? 'primary' : 'outline',
            onClick: () => setTheme('light'),
          }),
          Button({
            label: 'Oscuro',
            icon: Moon,
            variant: temaActual === 'dark' ? 'primary' : 'outline',
            onClick: () => setTheme('dark'),
          }),
        );
      }

      const buttonsSlot = el('div', {}, buildButtons());
      onThemeChange(() => buttonsSlot.replaceChildren(buildButtons()));

      return Card({
        title: 'Tema',
        subtitle: 'Cambia la apariencia de la aplicacion. Se aplica de inmediato.',
        children: buttonsSlot,
      });
    }

    return el(
      'div',
      { className: 'grid grid-cols-1 gap-6 xl:grid-cols-2' },
      infoCardSlot,
      el(
        'div',
        { className: 'flex flex-col gap-6' },
        buildSecurityCard(),
        accountCardSlot,
        buildThemeCard(),
      ),
    );
  }

  async function showApiError(error: unknown): Promise<void> {
    const message =
      error instanceof HttpError ? error.message : 'No se pudo conectar con el servidor.';
    await infoAlert({ title: 'No se pudo completar la accion', text: message, icon: 'error' });
  }

  return container;
}
