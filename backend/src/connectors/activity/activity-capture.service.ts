import { Injectable } from '@nestjs/common';

export interface ActivityQueueMessage {
  activity_type: 'email' | 'meeting';
  matched_company_id: string | null;
  user_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class ActivityQueueService {
  readonly queue: ActivityQueueMessage[] = [];
  readonly dlq: ActivityQueueMessage[] = [];

  publish(message: ActivityQueueMessage): void {
    this.queue.push(message);
  }
}

export interface ConnectorSyncState {
  user_id: string;
  connector_type: 'gmail' | 'google_calendar';
  history_id?: string | null;
  sync_token?: string | null;
}

@Injectable()
export class ConnectorSyncStateService {
  private readonly states = new Map<string, ConnectorSyncState>();

  key(userId: string, connectorType: string): string {
    return `${userId}:${connectorType}`;
  }

  get(userId: string, connectorType: 'gmail' | 'google_calendar'): ConnectorSyncState | undefined {
    return this.states.get(this.key(userId, connectorType));
  }

  save(state: ConnectorSyncState): void {
    this.states.set(this.key(state.user_id, state.connector_type), state);
  }
}

export function extractDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}

export function matchCompanyByEmail(
  emails: string[],
  companyDomains: Record<string, string>,
): string | null {
  for (const email of emails) {
    const domain = extractDomain(email);
    const match = Object.entries(companyDomains).find(([, companyDomain]) => companyDomain === domain);
    if (match) return match[0];
  }
  return null;
}
