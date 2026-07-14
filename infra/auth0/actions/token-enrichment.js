/**
 * Auth0 Post-Login Action — injects p7vc custom claims into access tokens.
 * Deploy via Terraform auth0_action resource (WO-017).
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://p7vc-crm.com';
  api.accessToken.setCustomClaim(`${namespace}/p7vc_role`, event.user.app_metadata?.p7vc_role ?? 'Intern');
  api.accessToken.setCustomClaim(`${namespace}/p7vc_user_id`, event.user.app_metadata?.p7vc_user_id ?? event.user.user_id);
  api.accessToken.setCustomClaim(`${namespace}/p7vc_team_id`, event.user.app_metadata?.p7vc_team_id ?? null);

  // Standard claim names consumed by NestJS JwtStrategy
  api.accessToken.setCustomClaim('p7vc_role', event.user.app_metadata?.p7vc_role ?? 'Intern');
  api.accessToken.setCustomClaim('p7vc_user_id', event.user.app_metadata?.p7vc_user_id ?? event.user.user_id);
  api.accessToken.setCustomClaim('p7vc_team_id', event.user.app_metadata?.p7vc_team_id ?? null);
};
