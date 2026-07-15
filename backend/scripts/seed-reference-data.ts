/** WO-016: reference data seed entrypoint */
export const referenceSeedStages = ['SOURCED', 'SCREENING', 'DILIGENCE', 'IC_REVIEW', 'TERM_SHEET', 'CLOSED'];
export const referenceSeedRoles = ['Director', 'Principal', 'Associate', 'Intern', 'Admin'];

export function buildReferenceSeedSql(): string {
  return referenceSeedRoles.map((role) => `-- seed role ${role}`).join('\n');
}
