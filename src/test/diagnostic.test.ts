// Testing with globals (no imports)
// vitest.config.ts has globals: true

describe('Diagnostic Test', () => {
  it('should verify vitest works', () => {
    expect(true).toBe(true);
  });

  it('should verify math works', () => {
    expect(1 + 1).toBe(2);
  });
});
