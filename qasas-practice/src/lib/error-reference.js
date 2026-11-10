export function createErrorReferenceId() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase()
    .slice(0, 8);
  return `ERR-${suffix}`;
}
