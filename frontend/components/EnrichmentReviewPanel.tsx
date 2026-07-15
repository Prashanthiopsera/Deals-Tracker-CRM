'use client';

import { useState } from 'react';

export interface EnrichmentProposal {
  taskId: string;
  userEntered: Record<string, unknown>;
  proposed: Record<string, unknown>;
}

interface Props {
  proposal: EnrichmentProposal;
  onApprove: (approved: Record<string, unknown>, rejected: string[]) => void;
  onReject: () => void;
}

export function EnrichmentReviewPanel({ proposal, onApprove, onReject }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const fields = Object.keys(proposal.proposed).filter((key) => key !== 'sources' && key !== 'key_contacts');

  const toggle = (field: string) => {
    setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApprove = () => {
    const approved: Record<string, unknown> = {};
    const rejected: string[] = [];
    for (const field of fields) {
      if (selected[field]) {
        approved[field] = proposal.proposed[field];
      } else {
        rejected.push(field);
      }
    }
    onApprove(approved, rejected);
  };

  return (
    <section data-testid="enrichment-review-panel">
      <h2>Enrichment Review</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Your Value</th>
            <th>Proposed</th>
            <th>Accept</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field}>
              <td>{field}</td>
              <td>{String(proposal.userEntered[field] ?? '—')}</td>
              <td>{String(proposal.proposed[field] ?? '—')}</td>
              <td>
                <input
                  type="checkbox"
                  checked={Boolean(selected[field])}
                  onChange={() => toggle(field)}
                  aria-label={`Accept ${field}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={handleApprove}>
        Approve Selected
      </button>
      <button type="button" onClick={onReject}>
        Reject All
      </button>
    </section>
  );
}
