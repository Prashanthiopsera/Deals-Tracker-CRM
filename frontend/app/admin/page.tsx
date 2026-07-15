'use client';

import { AppShell } from '../../components/AppShell';
import { AdminPanel } from '../../components/AdminPanel';

export default function AdminPage() {
  const role = process.env.NEXT_PUBLIC_DEMO_ROLE ?? 'Admin';

  return (
    <AppShell>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
        Admin Panel
      </h1>
      <AdminPanel role={role} />
    </AppShell>
  );
}
