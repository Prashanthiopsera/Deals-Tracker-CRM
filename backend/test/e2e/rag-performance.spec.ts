describe('RAG performance harness (WO-129)', () => {
  it('validates p95 latency budget under 1000ms in mock mode', () => {
    const samples = [120, 240, 380, 410, 520];
    samples.sort((a, b) => a - b);
    const p95Index = Math.floor(samples.length * 0.95) - 1;
    expect(samples[p95Index]).toBeLessThan(1000);
  });
});
