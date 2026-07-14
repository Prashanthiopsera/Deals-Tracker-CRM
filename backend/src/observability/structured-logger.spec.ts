import { StructuredLogger } from './structured-logger';

describe('StructuredLogger', () => {
  it('writes JSON logs with required fields', () => {
    const logger = new StructuredLogger();
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    logger.log('hello', { operation: 'test', userId: 'u1' });

    const output = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.operation).toBe('test');
    expect(parsed.userId).toBe('u1');
    expect(parsed.timestamp).toBeDefined();

    spy.mockRestore();
  });
});
