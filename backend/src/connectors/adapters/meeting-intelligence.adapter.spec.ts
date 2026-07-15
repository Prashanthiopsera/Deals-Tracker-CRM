import crypto from 'crypto';
import {
  normalizeGranolaPayload,
  normalizeZoomPayload,
  verifyZoomWebhookSignature,
} from './meeting-intelligence.adapter';
import { granolaWebhookFixture, zoomWebhookFixture } from '../../../test-fixtures/connectors/meeting-intelligence.fixture';

describe('MeetingIntelligenceConnectors (WO-099)', () => {
  it('normalizes Granola webhook payloads', () => {
    const normalized = normalizeGranolaPayload(granolaWebhookFixture);
    expect(normalized.source).toBe('granola');
    expect(normalized.action_items[0].status).toBe('pending');
  });

  it('normalizes Zoom meeting.ended payloads', () => {
    const normalized = normalizeZoomPayload(zoomWebhookFixture);
    expect(normalized.meeting_id).toBe('zoom-1');
  });

  it('verifies Zoom webhook signatures', () => {
    const body = JSON.stringify(zoomWebhookFixture);
    const secret = 'zoom-secret';
    const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
    expect(verifyZoomWebhookSignature(body, signature, secret)).toBe(true);
  });
});
