import { BadRequestException } from '@nestjs/common';
import { DealStage } from '../database/enums';

const STAGE_ORDER: DealStage[] = [
  DealStage.SOURCED,
  DealStage.SCREENING,
  DealStage.DILIGENCE,
  DealStage.PARTNER_IC_REVIEW,
  DealStage.TERM_SHEET,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST,
  DealStage.CLOSED_PASSED,
];

export function allowedNextStages(current: DealStage): DealStage[] {
  const next: DealStage[] = [DealStage.CLOSED_PASSED];
  const index = STAGE_ORDER.indexOf(current);
  if (index >= 0 && index < STAGE_ORDER.length - 1) {
    const sequential = STAGE_ORDER[index + 1];
    if (sequential !== DealStage.CLOSED_PASSED) {
      next.unshift(sequential);
    }
    if (current === DealStage.TERM_SHEET) {
      next.unshift(DealStage.CLOSED_WON, DealStage.CLOSED_LOST);
    }
  }
  return [...new Set(next)];
}

export function validateStageTransition(current: DealStage, target: DealStage): void {
  if (current === target) return;
  const allowed = allowedNextStages(current);
  if (!allowed.includes(target)) {
    throw new BadRequestException({
      message: `Invalid stage transition from ${current} to ${target}`,
      allowedNextStages: allowed,
    });
  }
}

export function stageDateKey(stage: DealStage): string {
  return `${stage}_entered_at`;
}
