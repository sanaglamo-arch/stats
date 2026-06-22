/**
 * Tiny fetch helper with timeout, used by every live adapter. Kept minimal and
 * dependency-free. Any network failure throws and the caller degrades to seed.
 */
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "FootyCompare/0.1 (ingestion; non-commercial)",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch raw text (for HTML/embedded-JSON scrapers). */
export async function fetchText(
  url: string,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "FootyCompare/0.1 (ingestion; non-commercial)",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
