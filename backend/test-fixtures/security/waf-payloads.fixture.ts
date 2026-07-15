export const wafTestPayloads = {
  sqlInjection: "' OR 1=1 --",
  xss: '<script>alert(1)</script>',
  oversizedBody: 'x'.repeat(11 * 1024 * 1024),
};
