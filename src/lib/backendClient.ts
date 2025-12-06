const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4000";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function backendFetch<T>(
  input: string,
  init?: FetchOptions
): Promise<T> {
  const url = new URL(input, API_BASE_URL).toString();
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Backend request failed: ${response.status} ${errorText}`.trim()
    );
  }

  return (await response.json()) as T;
}
