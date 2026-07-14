export const validJwt =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5In0.' +
  'eyJzdWIiOiJhdXRoMHwxMjMiLCJwN3ZjX3VzZXJfaWQiOiJ1c2VyLTEiLCJwN3ZjX3JvbGUiOiJEaXJlY3RvciIsImV4cCI6OTk5OTk5OTk5OX0.' +
  'signature';

export const expiredJwt =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3Qta2V5In0.' +
  'eyJzdWIiOiJhdXRoMHwxMjMiLCJleHAiOjE1MDAwMDAwMDB9.' +
  'signature';

export const malformedJwt = 'not-a-jwt';

export const testJwks = {
  keys: [
    {
      kty: 'RSA',
      kid: 'test-key',
      use: 'sig',
      n: 'test',
      e: 'AQAB',
    },
  ],
};
