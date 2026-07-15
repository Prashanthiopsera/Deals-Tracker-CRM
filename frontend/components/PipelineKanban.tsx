'use client';

import { useMemo, useState } from 'react';
import { CompanyCard } from '../lib/companies-api';
import { applyOptimisticStage, replaceCompany } from '../lib/pipeline-kanban.logic';
import { PIPELINE_STAGES, canDragCards, daysInStage } from '../lib/pipeline-stages';

export interface PipelineKanbanProps {
  role: string;
  initialCompanies: CompanyCard[];
  onStageChange: (companyId: string, targetStage: string) => Promise<CompanyCard>;
  onError?: (message: string) => void;
}

export function PipelineKanban({
  role,
  initialCompanies,
  onStageChange,
  onError,
}: PipelineKanbanProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [closedCollapsed, setClosedCollapsed] = useState(false);
  const dragEnabled = canDragCards(role);

  const grouped = useMemo(() => {
    const map = new Map<string, CompanyCard[]>();
    for (const stage of PIPELINE_STAGES) {
      map.set(stage.key, companies.filter((company) => company.deal_stage === stage.key));
    }
    return map;
  }, [companies]);

  async function handleDrop(companyId: string, targetStage: string) {
    const current = companies.find((company) => company.id === companyId);
    if (!current || current.deal_stage === targetStage) return;

    const previous = companies;
    setCompanies((rows) => applyOptimisticStage(rows, companyId, targetStage));

    try {
      const updated = await onStageChange(companyId, targetStage);
      setCompanies((rows) => replaceCompany(rows, updated));
    } catch (error) {
      setCompanies(previous);
      onError?.(error instanceof Error ? error.message : 'Stage transition failed');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
        {PIPELINE_STAGES.filter((stage) => stage.group === 'active').map((stage) => (
          <KanbanColumn
            key={stage.key}
            title={stage.label}
            stageKey={stage.key}
            companies={grouped.get(stage.key) ?? []}
            dragEnabled={dragEnabled}
            onDrop={handleDrop}
          />
        ))}
      </div>
      <button type="button" onClick={() => setClosedCollapsed((value) => !value)}>
        {closedCollapsed ? 'Show Closed Deals' : 'Hide Closed Deals'}
      </button>
      {!closedCollapsed && (
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          {PIPELINE_STAGES.filter((stage) => stage.group === 'closed').map((stage) => (
            <KanbanColumn
              key={stage.key}
              title={stage.label}
              stageKey={stage.key}
              companies={grouped.get(stage.key) ?? []}
              dragEnabled={dragEnabled}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  title,
  stageKey,
  companies,
  dragEnabled,
  onDrop,
}: {
  title: string;
  stageKey: string;
  companies: CompanyCard[];
  dragEnabled: boolean;
  onDrop: (companyId: string, targetStage: string) => void;
}) {
  return (
    <section
      style={{ minWidth: 240, background: '#f5f5f5', padding: 8, borderRadius: 8 }}
      onDragOver={(event) => {
        if (dragEnabled) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const companyId = event.dataTransfer.getData('text/company-id');
        if (companyId) onDrop(companyId, stageKey);
      }}
    >
      <h3>{title}</h3>
      {companies.map((company) => (
        <article
          key={company.id}
          draggable={dragEnabled}
          onDragStart={(event) => event.dataTransfer.setData('text/company-id', company.id)}
          style={{ background: '#fff', marginBottom: 8, padding: 8, borderRadius: 6 }}
        >
          <strong>{company.name}</strong>
          <div>{company.sector ?? 'Unknown sector'}</div>
          <div>Lead: {company.deal_lead_id ?? 'Unassigned'}</div>
          <div>Check: {company.check_size ?? '—'}</div>
          <div>Days in stage: {daysInStage(company.key_dates, company.deal_stage)}</div>
        </article>
      ))}
    </section>
  );
}
