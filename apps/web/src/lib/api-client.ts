const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
}

async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'message' in data ? data.message : null) as
      | string
      | string[]
      | null;
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(' ') : (message ?? 'Une erreur est survenue.'),
      data,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, accessToken?: string | null) => rawRequest<T>(path, { accessToken }),
  post: <T>(path: string, body?: unknown, accessToken?: string | null) =>
    rawRequest<T>(path, { method: 'POST', body, accessToken }),
  patch: <T>(path: string, body?: unknown, accessToken?: string | null) =>
    rawRequest<T>(path, { method: 'PATCH', body, accessToken }),
};
