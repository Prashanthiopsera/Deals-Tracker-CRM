const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function headers(token?: string): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export interface SearchResultItem {
  entityType: string;
  recordId: string;
  matchedField: string;
  snippet: string;
  rank?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
  latencyMs?: number;
  mode?: string;
}

export async function searchRecords(
  query: string,
  token?: string,
  mode: 'full_text' | 'semantic' = 'full_text',
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, mode });
  const path = mode === 'full_text' ? '/api/search' : '/api/search/filtered';
  const response = await fetch(`${API_BASE}${path}?${params.toString()}`, {
    headers: headers(token),
  });
  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }
  return response.json();
}

export async function listSavedSearches(token?: string) {
  const response = await fetch(`${API_BASE}/api/search/saved`, { headers: headers(token) });
  if (!response.ok) throw new Error('Failed to load saved searches');
  return response.json();
}

export async function createSavedSearch(
  name: string,
  query: string,
  token?: string,
  mode: 'full_text' | 'semantic' = 'full_text',
) {
  const response = await fetch(`${API_BASE}/api/search/saved`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ name, query, mode }),
  });
  if (!response.ok) throw new Error('Failed to save search');
  return response.json();
}
