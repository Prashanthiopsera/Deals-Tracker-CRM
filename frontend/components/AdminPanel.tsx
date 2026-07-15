'use client';

import { Fragment, useMemo, useState } from 'react';
import { AdminPolicy, AdminUser, AuditLogEntry, ConnectorCard, createAdminApi } from '../lib/admin-api';

type Tab = 'users' | 'policies' | 'audit' | 'connectors';

interface AdminPanelProps {
  role: string;
  token?: string;
}

export function AdminPanel({ role, token }: AdminPanelProps) {
  const api = useMemo(() => createAdminApi(token), [token]);
  const [tab, setTab] = useState<Tab>('users');
  const [message, setMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [auditRows, setAuditRows] = useState<AuditLogEntry[]>([]);
  const [connectors, setConnectors] = useState<ConnectorCard[]>([]);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Associate');

  if (role !== 'Admin') {
    return <p role="alert">Access denied — Admin role required.</p>;
  }

  async function loadUsers() {
    const result = await api.listUsers();
    setUsers(result.items);
  }

  async function loadPolicies() {
    const result = await api.listPolicies();
    setPolicies(result.items);
  }

  async function loadAudit() {
    const result = await api.searchAuditLogs();
    setAuditRows(result.items);
  }

  async function loadConnectors() {
    const result = await api.listConnectors();
    setConnectors(result);
  }

  async function handleTabChange(next: Tab) {
    setTab(next);
    setMessage(null);
    try {
      if (next === 'users') await loadUsers();
      if (next === 'policies') await loadPolicies();
      if (next === 'audit') await loadAudit();
      if (next === 'connectors') await loadConnectors();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    }
  }

  return (
    <div>
      <nav aria-label="Admin sections" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {(['users', 'policies', 'audit', 'connectors'] as Tab[]).map((key) => (
          <button key={key} type="button" onClick={() => void handleTabChange(key)} aria-pressed={tab === key}>
            {key}
          </button>
        ))}
      </nav>

      {message ? <p role="status">{message}</p> : null}

      {tab === 'users' ? (
        <section aria-label="Users">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void api
                .inviteUser(inviteEmail, inviteEmail.split('@')[0], inviteRole)
                .then(() => {
                  setMessage('User invited');
                  setInviteEmail('');
                  return loadUsers();
                })
                .catch((error) => setMessage(error instanceof Error ? error.message : 'Invite failed'));
            }}
          >
            <input
              type="email"
              required
              placeholder="email@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
              {['Director', 'Principal', 'Associate', 'Intern', 'Admin'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button type="submit">Invite user</button>
          </form>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        const nextRole = window.prompt('New role', user.role);
                        if (!nextRole || !window.confirm(`Change role to ${nextRole}?`)) return;
                        void api
                          .changeRole(user.id, nextRole)
                          .then(() => loadUsers())
                          .catch((error) => setMessage(error instanceof Error ? error.message : 'Failed'));
                      }}
                    >
                      Change role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === 'policies' ? (
        <section aria-label="Policies">
          <ul>
            {policies.map((policy) => (
              <li key={policy.id}>
                <strong>{policy.description}</strong> — updated {policy.updatedAt}
                <pre>{policy.policyText}</pre>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'audit' ? (
        <section aria-label="Audit logs">
          <button
            type="button"
            onClick={() => {
              void api
                .exportAuditCsv()
                .then((csv) => {
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement('a');
                  anchor.href = url;
                  anchor.download = 'audit-logs.csv';
                  anchor.click();
                })
                .catch((error) => setMessage(error instanceof Error ? error.message : 'Export failed'));
            }}
          >
            Export CSV
          </button>
          <table>
            <tbody>
              {auditRows.map((row) => (
                <Fragment key={String(row.id)}>
                  <tr>
                    <td>{row.operationType}</td>
                    <td>{row.entityType}</td>
                    <td>{row.entityId}</td>
                    <td>
                      <button type="button" onClick={() => setExpandedAudit(String(row.id))}>
                        Details
                      </button>
                    </td>
                  </tr>
                  {expandedAudit === String(row.id) ? (
                    <tr>
                      <td colSpan={4}>
                        <pre>{JSON.stringify({ before: row.beforeState, after: row.afterState }, null, 2)}</pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === 'connectors' ? (
        <section aria-label="Connectors" style={{ display: 'grid', gap: 12 }}>
          {connectors.map((connector) => (
            <article key={connector.id} style={{ border: '1px solid #ccc', padding: 12 }}>
              <h3>{connector.name}</h3>
              <p>Type: {connector.type}</p>
              <p>Health: {connector.healthStatus}</p>
              <p>Last sync: {connector.lastSyncAt ?? 'never'}</p>
              <label>
                <input type="checkbox" checked={connector.enabled} readOnly /> Enabled
              </label>
              <button
                type="button"
                onClick={() => {
                  void api
                    .testConnector(connector.id)
                    .then((result) => setMessage(result.message))
                    .catch((error) => setMessage(error instanceof Error ? error.message : 'Test failed'));
                }}
              >
                Test connectivity
              </button>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
