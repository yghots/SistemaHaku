import { Eye, EyeOff, Truck } from 'lucide';
import { infoAlert } from '../../components/alert/alert';
import { Button } from '../../components/button/button';
import { IconButton } from '../../components/button/icon-button';
import { Card } from '../../components/card/card';
import { Icon } from '../../components/icon/icon';
import { Input } from '../../components/input/input';
import { env } from '../../config/env';
import { DEFAULT_PATH_BY_ROLE } from '../../constants/roles';
import { AuthService } from '../../services/auth.service';
import { HttpError } from '../../services/http/http-error';
import { SessionService } from '../../services/session.service';
import { el } from '../../utils/dom';

/**
 * Pantalla de Login. Unica pagina de AuthLayout esta fase. Al autenticar
 * correctamente, guarda la sesion (SessionService) y navega (recarga dura,
 * no SPA) al panel que corresponde al rol devuelto por el backend.
 */
export function LoginPage(): HTMLElement {
  const usuarioField = Input({
    name: 'identificador',
    label: 'Usuario o correo',
    placeholder: 'usuario o correo@ejemplo.com',
    required: true,
  });

  const toggleVisibilityButton = IconButton({
    icon: Eye,
    label: 'Mostrar contraseña',
    size: 'sm',
    variant: 'ghost',
  });

  const passwordField = Input({
    name: 'password',
    label: 'Contraseña',
    type: 'password',
    required: true,
    trailingAction: toggleVisibilityButton,
  });

  let passwordVisible = false;
  toggleVisibilityButton.addEventListener('click', () => {
    passwordVisible = !passwordVisible;
    passwordField.input.type = passwordVisible ? 'text' : 'password';
    const label = passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña';
    toggleVisibilityButton.setAttribute('aria-label', label);
    toggleVisibilityButton.setAttribute('title', label);
    toggleVisibilityButton.firstElementChild?.replaceWith(
      Icon({ icon: passwordVisible ? EyeOff : Eye, size: 16 }),
    );
  });

  let submitButton = buildSubmitButton(false);

  function buildSubmitButton(loading: boolean): HTMLButtonElement {
    return Button({ label: 'Ingresar', type: 'submit', fullWidth: true, loading });
  }

  function setSubmitting(loading: boolean): void {
    const newButton = buildSubmitButton(loading);
    submitButton.replaceWith(newButton);
    submitButton = newButton;
    usuarioField.input.disabled = loading;
    passwordField.input.disabled = loading;
    toggleVisibilityButton.disabled = loading;
  }

  const form = el(
    'form',
    { className: 'flex flex-col gap-5' },
    usuarioField.wrapper,
    passwordField.wrapper,
    submitButton,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSubmit();
  });

  async function handleSubmit(): Promise<void> {
    usuarioField.setError(undefined);
    passwordField.setError(undefined);

    const identificador = usuarioField.input.value.trim();
    const password = passwordField.input.value;

    let hasError = false;
    if (!identificador) {
      usuarioField.setError('Este campo es obligatorio');
      hasError = true;
    }
    if (!password) {
      passwordField.setError('Este campo es obligatorio');
      hasError = true;
    }
    if (hasError) return;

    setSubmitting(true);
    try {
      const { usuario } = await AuthService.login({ identificador, password });
      SessionService.saveSession(usuario);
      window.location.href = DEFAULT_PATH_BY_ROLE[usuario.rol];
    } catch (error) {
      const message =
        error instanceof HttpError
          ? error.message
          : 'No se pudo conectar con el servidor. Intenta nuevamente.';
      await infoAlert({ title: 'No se pudo iniciar sesion', text: message, icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const logoMark = el(
    'div',
    { className: 'flex flex-col items-center gap-3 text-center' },
    el(
      'span',
      {
        className:
          'flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
      },
      Icon({ icon: Truck, size: 24 }),
    ),
    el('h1', { className: 'text-xl font-semibold text-text-primary' }, env.appName),
    el(
      'p',
      { className: 'text-sm text-text-muted' },
      'Ingresa tus credenciales para acceder al sistema',
    ),
  );

  return Card({
    className: 'w-full shadow-md',
    children: [el('div', { className: 'flex flex-col gap-6' }, logoMark, form)],
  });
}
