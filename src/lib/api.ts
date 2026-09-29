/**
 * Browser-side API client.
 * The JWT is kept in localStorage and sent as a bearer token.
 * No secret or AI provider key is ever present in frontend code.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const TOKEN_KEY = "vma.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Array<{ path: string; message: string }>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch {
    throw new ApiError(
      0,
      "network_error",
      "We couldn't reach the server. Check your connection and try again."
    );
  }

  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const err = (parsed as { error?: { code?: string; message?: string; fields?: unknown } })
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "unknown_error",
      err?.message ?? "Something went wrong. Please try again.",
      err?.fields as Array<{ path: string; message: string }> | undefined
    );
  }

  return parsed as T;
}
