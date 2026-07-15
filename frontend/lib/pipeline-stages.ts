export const PIPELINE_STAGES = [
  { key: 'sourced', label: 'Sourced', group: 'active' },
  { key: 'screening', label: 'Screening', group: 'active' },
  { key: 'diligence', label: 'Diligence', group: 'active' },
  { key: 'partner_ic_review', label: 'Partner/IC Review', group: 'active' },
  { key: 'term_sheet', label: 'Term Sheet', group: 'active' },
  { key: 'closed_won', label: 'Closed Won', group: 'closed' },
  { key: 'closed_lost', label: 'Closed Lost', group: 'closed' },
  { key: 'closed_passed', label: 'Closed Passed', group: 'closed' },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]['key'];

export function daysInStage(keyDates: Record<string, string> | undefined, stage: string): number {
  const enteredAt = keyDates?.[`${stage}_entered_at`];
  if (!enteredAt) return 0;
  const entered = new Date(enteredAt).getTime();
  return Math.max(0, Math.floor((Date.now() - entered) / 86_400_000));
}

export function canDragCards(role: string): boolean {
  return ['Director', 'Principal', 'Associate', 'Admin'].includes(role);
}
