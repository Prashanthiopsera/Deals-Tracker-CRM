'use client';

export interface ActivityItem {
  id: string;
  activity_type: 'email' | 'meeting' | 'calendar_event' | 'note';
  subject?: string;
  body_preview?: string;
  participants: Array<Record<string, unknown>>;
  occurred_at: string;
  source: string;
}

const TYPE_COLORS: Record<string, string> = {
  email: '#2563eb',
  meeting: '#16a34a',
  calendar_event: '#ea580c',
  note: '#6b7280',
};

interface Props {
  activities: ActivityItem[];
  lastTouch?: { occurred_at: string; activity_type: string } | null;
  nextStep?: { subject: string; occurred_at: string } | null;
}

export function ActivityTimeline({ activities, lastTouch, nextStep }: Props) {
  if (activities.length === 0) {
    return <p data-testid="activity-empty">No activities yet</p>;
  }

  return (
    <section data-testid="activity-timeline">
      <header>
        <p data-testid="last-touch">
          Last touch: {lastTouch ? `${lastTouch.activity_type} · ${lastTouch.occurred_at}` : 'None'}
        </p>
        <p data-testid="next-step">
          Next step: {nextStep ? `${nextStep.subject} · ${nextStep.occurred_at}` : 'No upcoming events'}
        </p>
      </header>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id} data-testid={`activity-${activity.activity_type}`}>
            <span style={{ color: TYPE_COLORS[activity.activity_type] ?? '#111827' }}>
              {activity.activity_type}
            </span>
            <strong>{activity.subject ?? 'Untitled'}</strong>
            <span>{activity.body_preview}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
