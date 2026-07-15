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

export enum PiiClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
}

export enum ActivityType {
  EMAIL = 'email',
  MEETING = 'meeting',
  CALENDAR_EVENT = 'calendar_event',
  NOTE = 'note',
  CALL = 'call',
}

export enum DocumentType {
  DECK = 'deck',
  MEMO = 'memo',
  TERM_SHEET = 'term_sheet',
  IC_MEMO = 'ic_memo',
  FINANCIAL_MODEL = 'financial_model',
  OTHER = 'other',
}

export enum CompanyStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ARCHIVED = 'Archived',
  PORTFOLIO = 'Portfolio',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REASSIGN = 'reassign',
  STAGE_TRANSITION = 'stage_transition',
  OWNERSHIP_REASSIGNMENT = 'ownership_reassignment',
  AI_RETRIEVAL = 'ai_retrieval',
  AI_RESPONSE = 'ai_response',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_DENIED = 'permission_denied',
}

export enum UserStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
}

export enum CommentRecordType {
  COMPANY = 'company',
  CONTACT = 'contact',
  ACTIVITY = 'activity',
  DOCUMENT = 'document',
}
