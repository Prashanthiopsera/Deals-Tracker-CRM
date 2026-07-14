export enum UserRole {
  DIRECTOR = 'Director',
  PRINCIPAL = 'Principal',
  ASSOCIATE = 'Associate',
  INTERN = 'Intern',
  ADMIN = 'Admin',
}

export enum DealStage {
  SOURCED = 'sourced',
  SCREENING = 'screening',
  DILIGENCE = 'diligence',
  PARTNER_IC_REVIEW = 'partner_ic_review',
  TERM_SHEET = 'term_sheet',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  CLOSED_PASSED = 'closed_passed',
}

export enum CompanyFundingStage {
  SEED = 'seed',
  SERIES_A = 'series_a',
  SERIES_B = 'series_b',
  SERIES_C = 'series_c',
  GROWTH = 'growth',
  LATE_STAGE = 'late_stage',
  OTHER = 'other',
}

export enum CompanyStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
  PORTFOLIO = 'Portfolio',
}
