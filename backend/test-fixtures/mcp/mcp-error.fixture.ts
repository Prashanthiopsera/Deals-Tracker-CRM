export const mcpErrorFixtures = {
  auth0Timeout: { code: 'AUTH_SERVICE_UNAVAILABLE', message: 'Authentication service unavailable' },
  cedarTimeout: {
    code: 'AUTHORIZATION_SERVICE_UNAVAILABLE',
    message: 'Authorization service unavailable',
  },
  parseError: { code: 'PARSE_ERROR', message: 'Invalid JSON-RPC request' },
};
