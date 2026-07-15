export function buildPartialApprovalPayload(
  proposed: Record<string, unknown>,
  acceptedFields: string[],
): { approved_fields: Record<string, unknown>; rejected_fields: string[] } {
  const approved_fields: Record<string, unknown> = {};
  const rejected_fields: string[] = [];
  for (const [key, value] of Object.entries(proposed)) {
    if (key === 'sources') continue;
    if (acceptedFields.includes(key)) {
      approved_fields[key] = value;
    } else {
      rejected_fields.push(key);
    }
  }
  return { approved_fields, rejected_fields };
}

describe('enrichment partial approval (WO-090)', () => {
  it('splits proposed fields into approved and rejected sets', () => {
    const result = buildPartialApprovalPayload(
      { sector: 'Robotics', geography: 'US', sources: ['zoominfo'] },
      ['sector'],
    );
    expect(result.approved_fields).toEqual({ sector: 'Robotics' });
    expect(result.rejected_fields).toEqual(['geography']);
  });
});
