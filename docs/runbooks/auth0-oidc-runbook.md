# Auth0 OIDC Runbook (WO-017)

## Login flow
1. User redirects to Auth0 `/authorize` with PKCE.
2. Callback exchanges code at `/oauth/token`.
3. NestJS `JwtAuthGuard` validates RS256 JWT against Auth0 JWKS.

## Troubleshooting
- **401 on all routes**: verify `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, and JWKS cache TTL.
- **Role missing**: confirm Auth0 Action adds `p7vcRole` custom claim.
- **Session expiry**: check refresh token rotation in Auth0 tenant settings.
