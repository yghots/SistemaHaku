/** Devuelve una version "debounced" de `fn`: solo se ejecuta si pasan `delayMs` sin una nueva llamada. */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  let timeoutId: number | undefined;

  return (...args: Args): void => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delayMs);
  };
}
