const SENSITIVE_HOLD_PATH_PATTERN = /\/book\/hold\/[^/?#\s]+/gi;

const INTERNAL_ORIGIN = "https://doglife.internal";

export function isSensitiveHoldPath(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return /\/book\/hold\/[^/?#\s]+/i.test(value);
}

export function normalizeSensitivePath(value: string): string {
  return value.replace(
    SENSITIVE_HOLD_PATH_PATTERN,
    "/book/hold/:token"
  );
}

export function sanitizeSensitiveTelemetryValue<T>(value: T): T {
  if (typeof value === "string") {
    return normalizeSensitivePath(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeSensitiveTelemetryValue(item)
    ) as T;
  }

  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(
      value as Record<string, unknown>
    )) {
      output[key] = sanitizeSensitiveTelemetryValue(item);
    }

    return output as T;
  }

  return value;
}

export function safeInternalReturnPath(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(candidate)
  ) {
    return null;
  }

  try {
    const parsed = new URL(candidate, INTERNAL_ORIGIN);

    if (parsed.origin !== INTERNAL_ORIGIN) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
