import { Injectable } from '@nestjs/common';
import { dlpPolicyFixtures } from '../../test-fixtures/connectors/dlp.fixture';

@Injectable()
export class AdminDlpPolicyService {
  private policies = [...dlpPolicyFixtures];

  list(actorRole: string) {
    if (actorRole !== 'Admin') throw new Error('Forbidden');
    return this.policies;
  }

  upsert(actorRole: string, policy: (typeof dlpPolicyFixtures)[number]) {
    if (actorRole !== 'Admin') throw new Error('Forbidden');
    const index = this.policies.findIndex((entry) => entry.id === policy.id);
    if (index >= 0) this.policies[index] = policy;
    else this.policies.push(policy);
    return policy;
  }
}
