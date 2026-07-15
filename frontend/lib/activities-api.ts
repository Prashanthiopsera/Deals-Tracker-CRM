export function buildActivitiesApi(baseUrl: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  return {
    async listCompanyActivities(companyId: string, query: Record<string, string> = {}) {
      const params = new URLSearchParams(query);
      const response = await fetch(`${baseUrl}/api/companies/${companyId}/activities?${params}`, {
        headers,
      });
      if (!response.ok) throw new Error('Failed to load activities');
      return response.json();
    },
  };
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - Date.parse(isoDate);
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
