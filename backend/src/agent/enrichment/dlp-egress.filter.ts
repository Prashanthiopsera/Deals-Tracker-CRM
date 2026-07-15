const PII_KEYS = ['email', 'phone', 'ssn', 'contact_email'];

export function filterDlpEgress(payload: Record<string, unknown>): Record<string, unknown> {
  return redactObject(payload) as Record<string, unknown>;
}

function redactObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (PII_KEYS.some((piiKey) => key.toLowerCase().includes(piiKey))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = redactObject(nested);
    }
  }
  return result;
}
