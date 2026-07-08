export const getErrorText = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error !== 'object' || !error) return String(error ?? '');

  return ['message', 'code', 'details', 'hint']
    .map((key) => String((error as Record<string, unknown>)[key] ?? ''))
    .filter(Boolean)
    .join(' ');
};

export const toError = (value: unknown, fallback: string): Error => {
  if (value instanceof Error) return value;
  const message = getErrorText(value);
  return new Error(message || fallback);
};
