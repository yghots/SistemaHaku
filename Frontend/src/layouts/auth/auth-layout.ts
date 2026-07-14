import { Moon, Sun } from 'lucide';
import { Icon } from '../../components/icon/icon';
import { IconButton } from '../../components/button/icon-button';
import { Footer } from '../../components/footer/footer';
import { env } from '../../config/env';
import { getTheme, onThemeChange, toggleTheme } from '../../utils/theme';
import { el } from '../../utils/dom';
import type { LayoutHandle } from '../layout.types';

/**
 * Layout para paginas sin sesion (login, recuperar contrasena). A
 * diferencia de Admin/Rider, NO lleva Sidebar: antes de autenticarse no
 * hay rutas de negocio que ofrecer (decision aprobada explicitamente,
 * ver FRONTEND_PROGRESS.md Fase 2). Header minimo (logo + tema) + Footer.
 */
export function AuthLayout(): LayoutHandle {
  const themeToggle = IconButton({
    icon: getTheme() === 'dark' ? Sun : Moon,
    label: 'Cambiar tema',
    onClick: () => toggleTheme(),
  });
  onThemeChange((theme) => {
    const newIcon = Icon({ icon: theme === 'dark' ? Sun : Moon, size: 18 });
    themeToggle.firstElementChild?.replaceWith(newIcon);
  });

  const header = el('header', {
    className:
      'flex min-h-16 shrink-0 items-center justify-between px-6 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))]',
  });
  header.append(
    el('span', { className: 'text-base font-semibold text-text-primary' }, env.appName),
    themeToggle,
  );

  const mount = el('div', { className: 'w-full max-w-md' });

  const element = el(
    'div',
    { className: 'flex min-h-screen flex-col bg-surface-muted' },
    header,
    el(
      'div',
      {
        className:
          'flex flex-1 items-center justify-center pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
      },
      mount,
    ),
    Footer({ appName: env.appName }),
  );

  return { element, mount };
}
