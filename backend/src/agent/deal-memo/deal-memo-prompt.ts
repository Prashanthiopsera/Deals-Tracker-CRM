import { dealMemoTemplateSections } from '../../../test-fixtures/agent/deal-memo.fixture';

export function buildDealMemoPrompt(context: {
  company: Record<string, unknown>;
  notes: string[];
  activities: Array<Record<string, unknown>>;
}): string {
  const sections = dealMemoTemplateSections.join(', ');
  return `Generate an IC memo with sections: ${sections}. Company: ${JSON.stringify(context.company)}. Notes: ${context.notes.join('; ')}. Activities: ${JSON.stringify(context.activities)}`;
}

export function renderMemoTemplate(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  for (const title of dealMemoTemplateSections) {
    const marker = `## ${title}`;
    if (content.includes(marker)) {
      sections[title] = content.split(marker)[1]?.split('##')[0]?.trim() ?? '';
    }
  }
  return sections;
}
