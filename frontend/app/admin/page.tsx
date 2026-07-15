import { AdminPanel } from '../../components/AdminPanel';

export default function AdminPage() {
  const role = process.env.NEXT_PUBLIC_DEMO_ROLE ?? 'Admin';

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin Panel</h1>
      <AdminPanel role={role} />
    </main>
  );
}
