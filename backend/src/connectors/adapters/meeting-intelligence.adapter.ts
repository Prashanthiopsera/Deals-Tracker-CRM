import crypto from 'crypto';
import {
  granolaWebhookFixture,
  meetingIntelligenceFixture,
  zoomWebhookFixture,
} from '../../../test-fixtures/connectors/meeting-intelligence.fixture';
import { filterDlpEgress } from '../../agent/enrichment/dlp-egress.filter';
import { matchCompanyByEmail } from '../activity/activity-capture.service';

export interface MeetingIntelligence {
  meeting_id: string;
  title: string;
  date: string;
  duration: number;
  attendees: string[];
  transcript_summary: string;
  action_items: Array<Record<string, unknown>>;
  source: 'granola' | 'zoom';
}

export function normalizeGranolaPayload(payload: typeof granolaWebhookFixture): MeetingIntelligence {
  return {
    meeting_id: payload.meeting_id,
    title: payload.title,
    date: new Date().toISOString(),
    duration: 30,
    attendees: payload.attendees.map((attendee) => attendee.email),
    transcript_summary: String(filterDlpEgress({ notes: payload.notes }).notes),
    action_items: payload.action_items.map((item) => ({ ...item, status: 'pending' })),
    source: 'granola',
  };
}

export function normalizeZoomPayload(payload: typeof zoomWebhookFixture): MeetingIntelligence {
  const object = payload.payload.object;
  return {
    meeting_id: object.id,
    title: object.topic,
    date: new Date().toISOString(),
    duration: object.duration,
    attendees: [object.participant_email],
    transcript_summary: meetingIntelligenceFixture.transcript_summary,
    action_items: [],
    source: 'zoom',
  };
}

export function verifyZoomWebhookSignature(body: string, signature: string, secret: string): boolean {
  const digest = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return signature === digest;
}

export function matchMeetingToCompany(intelligence: MeetingIntelligence): string | null {
  return matchCompanyByEmail(intelligence.attendees, {
    '11111111-1111-1111-1111-111111111111': 'acmerobotics.com',
  });
}
