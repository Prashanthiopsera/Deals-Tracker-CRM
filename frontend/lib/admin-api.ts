const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

function headers(token?: string): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  lastLogin: string | null;
}

export interface AdminPolicy {
  id: string;
  description: string;
  policyText: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id?: string;
  actorId?: string;
  operationType?: string;
  entityType?: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  createdAt?: string;
}

export interface ConnectorCard {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  healthStatus: string;
  lastSyncAt: string | null;
  credentialHint: string | null;
}

export function createAdminApi(token?: string) {
  const authHeaders = headers(token);

  return {
    async getSessionRole(): Promise<string> {
      const response = await fetch('/api/auth/me');
      if (!response.ok) return 'Intern';
      const payload = (await response.json()) as { role?: string };
      return payload.role ?? 'Intern';
    },
    async listUsers(page = 1): Promise<{ items: AdminUser[]; total: number }> {
      const response = await fetch(`${API_BASE}/api/admin/users?page=${page}`, { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to load users');
      return response.json();
    },
    async inviteUser(email: string, fullName: string, role: string): Promise<AdminUser> {
      const response = await fetch(`${API_BASE}/api/admin/users/invite`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email, fullName, role }),
      });
      if (!response.ok) throw new Error('Invite failed');
      return response.json();
    },
    async changeRole(userId: string, role: string): Promise<AdminUser> {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Role change failed');
      return response.json();
    },
    async listPolicies(): Promise<{ items: AdminPolicy[] }> {
      const response = await fetch(`${API_BASE}/api/admin/policies`, { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to load policies');
      return response.json();
    },
    async searchAuditLogs(page = 1): Promise<{ items: AuditLogEntry[]; total: number }> {
      const response = await fetch(`${API_BASE}/api/admin/audit-logs?page=${page}&pageSize=20`, {
        headers: authHeaders,
      });
      if (!response.ok) throw new Error('Audit search failed');
      return response.json();
    },
    async exportAuditCsv(): Promise<string> {
      const response = await fetch(`${API_BASE}/api/admin/audit-logs/export`, { headers: authHeaders });
      if (!response.ok) throw new Error('Export failed');
      return response.text();
    },
    async listConnectors(): Promise<ConnectorCard[]> {
      const response = await fetch(`${API_BASE}/api/admin/connectors`, { headers: authHeaders });
      if (!response.ok) throw new Error('Failed to load connectors');
      return response.json();
    },
    async testConnector(id: string): Promise<{ success: boolean; message: string }> {
      const response = await fetch(`${API_BASE}/api/admin/connectors/${id}/test`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!response.ok) throw new Error('Connectivity test failed');
      return response.json();
    },
  };
}

export function assertAdminAccess(role: string): { allowed: boolean; message?: string } {
  if (role !== 'Admin') {
    return { allowed: false, message: 'Access denied — Admin role required.' };
  }
  return { allowed: true };
}
