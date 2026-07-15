import { of } from 'rxjs';
import { ForbiddenException } from '@nestjs/common';
import { OwnershipFieldInterceptor } from './ownership-field.interceptor';
import { OwnershipPatchGuard } from './ownership-patch.guard';
import { containsOwnershipFields, stripOwnershipFields, toCompanyResponse } from './ownership-fields';
import { stripMcpOwnershipFields } from './mcp-ownership';

describe('ownership field authorization', () => {
  const company = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Acme',
    p7vc_deal_lead: '22222222-2222-2222-2222-222222222222',
    deal_lead_support_1: '33333333-3333-3333-3333-333333333333',
    deal_lead_support_2: '44444444-4444-4444-4444-444444444444',
    notes: 'test',
    status: 'Active',
  };

  it('includes ownership fields for director responses', () => {
    const response = toCompanyResponse(company);
    expect(response.deal_lead_id).toBeDefined();
    expect(response.support1_id).toBeDefined();
  });

  it('strips ownership fields for intern serialization', () => {
    const response = stripOwnershipFields(toCompanyResponse(company));
    expect(response).not.toHaveProperty('deal_lead_id');
    expect(response).not.toHaveProperty('support1_id');
    expect(response).not.toHaveProperty('support2_id');
  });

  it('blocks intern ownership patch attempts', () => {
    const guard = new OwnershipPatchGuard();
    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'PATCH',
            user: { p7vcRole: 'Intern', p7vcUserId: 'intern-1' },
            body: { deal_lead_id: 'new-id' },
          }),
        }),
      } as never),
    ).toThrow(ForbiddenException);
  });

  it('allows intern non-ownership patch', () => {
    const guard = new OwnershipPatchGuard();
    expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'PATCH',
            user: { p7vcRole: 'Intern', p7vcUserId: 'intern-1' },
            body: { notes: 'updated' },
          }),
        }),
      } as never),
    ).toBe(true);
  });

  it('strips ownership fields from MCP payloads for interns', () => {
    const payload = stripMcpOwnershipFields('Intern', toCompanyResponse(company));
    expect(payload.deal_lead_id).toBeUndefined();
  });

  it('interceptor removes ownership fields for intern role', async () => {
    const interceptor = new OwnershipFieldInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { p7vcRole: 'Intern', p7vcUserId: 'intern-1' } }),
      }),
    } as never;
    const result = await new Promise<unknown>((resolve) => {
      interceptor.intercept(context, { handle: () => of(company) }).subscribe(resolve);
    });
    expect(result).not.toHaveProperty('deal_lead_id');
  });

  it('detects ownership fields in patch body', () => {
    expect(containsOwnershipFields({ support2_id: 'x' })).toBe(true);
    expect(containsOwnershipFields({ notes: 'ok' })).toBe(false);
  });
});
