import { McpExceptionFilter } from './mcp-exception.filter';

describe('McpExceptionFilter (WO-088)', () => {
  it('returns MCP JSON-RPC error without stack traces', () => {
    const filter = new McpExceptionFilter();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status: () => ({ json }) }),
      }),
    } as never;

    filter.catch(new Error('AUTH_FAILED'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonrpc: '2.0',
        error: { code: 'AUTH_FAILED', message: 'Authentication failed' },
      }),
    );
  });
});
