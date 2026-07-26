export function requirePositiveLimit(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

export function timestampToDate(value) {
  return value?.toDate?.() || null;
}
