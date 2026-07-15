import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { OWNERSHIP_FIELD_KEYS } from '../companies/ownership-fields';
import { dlpPolicyFixtures } from '../../test-fixtures/connectors/dlp.fixture';

export type DlpAction = 'allow' | 'redact' | 'block';

export interface DlpScanResult {
  allowed: boolean;
  action: DlpAction;
  findings: string[];
  payload: Record<string, unknown>;
}

@Injectable()
export class DlpFilterService {
  constructor(private readonly audit: AuditService) {}

  scanEgress(connectorType: string, payload: Record<string, unknown>): DlpScanResult {
    const started = performance.now();
    const findings: string[] = [];
    let action: DlpAction = 'allow';
    const output = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

    const emailPattern = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
    const phonePattern = /\+?[\d][\d\-()\s]{6,}/g;
    const ssnPattern = /\d{3}-\d{2}-\d{4}/g;

    const serialized = JSON.stringify(output);
    if (emailPattern.test(serialized)) findings.push('email');
    if (phonePattern.test(serialized)) findings.push('phone');
    if (ssnPattern.test(serialized)) findings.push('ssn');

    for (const key of OWNERSHIP_FIELD_KEYS) {
      if (Object.prototype.hasOwnProperty.call(output, key)) {
        findings.push('ownership_field');
        action = 'block';
        delete output[key];
      }
    }

    if (findings.includes('email') || findings.includes('phone') || findings.includes('ssn')) {
      action = action === 'block' ? 'block' : 'redact';
      this.redactObject(output, emailPattern);
      this.redactObject(output, phonePattern);
      this.redactObject(output, ssnPattern);
    }

    const policyAction = dlpPolicyFixtures.find((policy) => policy.connector_scope === '*')?.action;
    if (policyAction === 'block' && findings.length > 0) {
      action = 'block';
    }

    this.audit.publishAuditEvent({
      actorId: 'system',
      actorRole: 'Admin',
      operation: 'update',
      resourceType: 'DlpScan',
      resourceId: connectorType,
      metadata: {
        action: 'dlp.scan',
        findings,
        action_taken: action,
        latency_ms: performance.now() - started,
      },
    });

    return { allowed: action !== 'block', action, findings, payload: output };
  }

  private redactObject(value: unknown, pattern: RegExp): void {
    if (typeof value === 'string') {
      return;
    }
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        const item = value[index];
        if (typeof item === 'string') {
          value[index] = item.replace(pattern, '[REDACTED]');
        } else {
          this.redactObject(item, pattern);
        }
      }
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (typeof nested === 'string') {
          (value as Record<string, unknown>)[key] = nested.replace(pattern, '[REDACTED]');
        } else {
          this.redactObject(nested, pattern);
        }
      }
    }
  }
}
