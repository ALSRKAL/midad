/**
 * Minimal, explicit Result type.
 *
 * Server actions never throw to the client: they return a value or a typed failure, so the UI can
 * render a field error, a toast or a retry without try/catch archaeology. Expected failures are
 * values; only genuine bugs throw (and are logged by the action wrapper).
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Maps the success value, leaving a failure untouched. */
export function mapResult<T, U, E>(result: Result<T, E>, map: (value: T) => U): Result<U, E> {
  return result.ok ? ok(map(result.value)) : result;
}

/** Unwraps a success or throws — only for call sites where a failure is a programming error. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.value;
  throw new Error(`Tried to unwrap a failed Result: ${String(result.error)}`);
}
