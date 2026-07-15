'use client';

import { AppShell } from '../../components/AppShell';
import { SearchPanel } from '../../components/SearchPanel';

export default function SearchPage() {
  return (
    <AppShell>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
        Universal Search
      </h1>
      <SearchPanel />
    </AppShell>
  );
}
