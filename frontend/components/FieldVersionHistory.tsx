'use client';

import { shouldShowFieldHistory } from '../lib/field-history';

export interface FieldHistoryEntry {
  actor_id: string;
  timestamp: string;
  old_value: unknown;
  new_value: unknown;
}

interface Props {
  fieldName: string;
  entries: FieldHistoryEntry[];
  role: string;
}

export function FieldVersionHistory({ fieldName, entries, role }: Props) {
  if (!shouldShowFieldHistory(fieldName, role)) {
    return null;
  }

  if (entries.length === 0) {
    return <p data-testid="field-history-empty">No changes recorded</p>;
  }

  return (
    <section data-testid={`field-history-${fieldName}`}>
      <ul>
        {entries.map((entry, index) => (
          <li key={`${entry.timestamp}-${index}`}>
            {entry.actor_id}: {String(entry.old_value)} → {String(entry.new_value)} ({entry.timestamp})
          </li>
        ))}
      </ul>
    </section>
  );
}
