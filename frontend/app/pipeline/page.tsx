import { PipelineKanban } from '../components/PipelineKanban';
import companiesFixture from '../test-fixtures/companies-pipeline.json';
import { createCompaniesApi } from '../lib/companies-api';

export default function PipelinePage() {
  const role = process.env.NEXT_PUBLIC_DEMO_ROLE ?? 'Director';
  const api = createCompaniesApi(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001');

  return (
    <main style={{ padding: 24 }}>
      <h1>Deal Pipeline</h1>
      <PipelineKanban
        role={role}
        initialCompanies={companiesFixture as never}
        onStageChange={(companyId, dealStage) => api.transitionStage(companyId, dealStage)}
        onError={(message) => console.error(message)}
      />
    </main>
  );
}
