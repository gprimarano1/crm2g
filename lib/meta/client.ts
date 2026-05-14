const META_API_VERSION = "v19.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export class MetaAPIError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly subcode?: number,
    public readonly type?: string
  ) {
    super(message);
    this.name = "MetaAPIError";
  }

  get isRateLimit() {
    return this.code === 17 || this.code === 613 || this.code === 80000;
  }

  get isPermission() {
    return this.code === 10 || this.code === 200;
  }
}

interface MetaErrorBody {
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function metaFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {},
  options: {
    method?: "GET" | "POST";
    body?: Record<string, string>;
    retries?: number;
    cache?: RequestCache;
  } = {}
): Promise<T> {
  const { method = "GET", body, retries = 2, cache = "no-store" } = options;

  const url = new URL(`${META_BASE_URL}/${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let lastError: Error = new MetaAPIError("Unknown error");

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await sleep(1200 * attempt);
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method,
        cache,
        ...(body
          ? {
              body: new URLSearchParams(body),
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
          : {}),
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }

    const data = (await res.json()) as MetaErrorBody & T;

    if (data.error) {
      const { message, code, error_subcode: subcode, type } = data.error;
      const apiError = new MetaAPIError(message, code, subcode, type);

      if (apiError.isRateLimit && attempt < retries) {
        lastError = apiError;
        await sleep(3000 * (attempt + 1));
        continue;
      }

      throw apiError;
    }

    if (!res.ok) {
      lastError = new MetaAPIError(`HTTP ${res.status}`, res.status);
      if (attempt < retries) continue;
      throw lastError;
    }

    return data as T;
  }

  throw lastError;
}
