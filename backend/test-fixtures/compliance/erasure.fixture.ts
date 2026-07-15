export type ErasureLifecycleStatus =
  | 'REQUESTED'
  | 'DISCOVERY_COMPLETE'
  | 'ERASURE_IN_PROGRESS'
  | 'KEYS_SCHEDULED_FOR_DELETION'
  | 'VERIFICATION_PENDING'
  | 'COMPLETE';

export const erasureSubjectFixtures = {
  email: 'ada@example.com',
  contactId: 'contact-seed-special',
  dekArn: 'arn:aws:kms:us-east-1:123456789012:key/contact-seed-special',
};
