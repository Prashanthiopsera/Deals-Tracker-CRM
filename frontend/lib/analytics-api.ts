export function buildFunnelData(stages: Record<string, number>): Array<[string, number]> {
  return Object.entries(stages);
}

export function buildAnalyticsApi(baseUrl: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return {
    async getPipelineSummary() {
      const response = await fetch(`${baseUrl}/api/analytics/pipeline-summary`, { headers });
      if (!response.ok) throw new Error('Failed to load pipeline summary');
      return response.json();
    },
  };
}
