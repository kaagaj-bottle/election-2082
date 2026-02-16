const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }
  const response = await fetch(url.toString(), { signal });
  return handleResponse<T>(response);
}

export async function apiGetByUrl<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  return handleResponse<T>(response);
}
