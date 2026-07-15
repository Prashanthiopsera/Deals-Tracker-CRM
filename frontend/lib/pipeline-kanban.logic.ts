import { CompanyCard } from './companies-api';

export function applyOptimisticStage(
  companies: CompanyCard[],
  companyId: string,
  targetStage: string,
): CompanyCard[] {
  return companies.map((company) =>
    company.id === companyId ? { ...company, deal_stage: targetStage } : company,
  );
}

export function replaceCompany(companies: CompanyCard[], updated: CompanyCard): CompanyCard[] {
  return companies.map((company) => (company.id === updated.id ? updated : company));
}

export function isDragEnabled(role: string): boolean {
  return ['Director', 'Principal', 'Associate', 'Admin'].includes(role);
}
