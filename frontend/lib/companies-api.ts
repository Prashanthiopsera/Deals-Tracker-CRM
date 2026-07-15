export interface CompanyCard {
  id: string;
  name: string;
  deal_stage: string;
  sector?: string | null;
  deal_lead_id?: string | null;
  check_size?: number | null;
  key_dates?: Record<string, string>;
}

export interface CompaniesApiClient {
  listByStage(stage: string): Promise<CompanyCard[]>;
  transitionStage(companyId: string, dealStage: string): Promise<CompanyCard>;
}

export function createCompaniesApi(baseUrl: string, token?: string): CompaniesApiClient {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  return {
    async listByStage(stage: string) {
      const response = await fetch(`${baseUrl}/api/companies?deal_stage=${stage}&limit=100`, {
        headers,
      });
      if (!response.ok) throw new Error(`Failed to load companies for ${stage}`);
      const payload = (await response.json()) as { items: CompanyCard[] };
      return payload.items;
    },
    async transitionStage(companyId: string, dealStage: string) {
      const response = await fetch(`${baseUrl}/api/companies/${companyId}/stage`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ deal_stage: dealStage }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(error.message ?? 'Stage transition failed');
      }
      return (await response.json()) as CompanyCard;
    },
  };
}

export async function loadPipelineBoard(api: CompaniesApiClient, stages: string[]): Promise<CompanyCard[]> {
  const batches = await Promise.all(stages.map((stage) => api.listByStage(stage)));
  return batches.flat();
}
