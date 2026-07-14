export async function refreshSessionIfNeeded(): Promise<boolean> {
  const response = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
  return response.ok;
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, { ...init, credentials: 'include' });
  if (response.status !== 401) return response;
  const refreshed = await refreshSessionIfNeeded();
  if (!refreshed) {
    window.location.href = '/api/auth/login?reason=session-expired';
    return response;
  }
  return fetch(input, { ...init, credentials: 'include' });
}
