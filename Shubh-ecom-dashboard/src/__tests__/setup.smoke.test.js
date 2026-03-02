/**
 * SMOKE TEST - Phase 1 Verification
 * This test verifies that the Jest + React Testing Library setup is working.
 * Once passing, you can delete or extend this file.
 */

describe('Jest Setup - Smoke Test', () => {
  it('Jest is running correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('jest-dom matchers are available', () => {
    // Check that jest-dom extended expect is available
    const div = document.createElement('div');
    div.textContent = 'Hello Dashboard';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello Dashboard');
    document.body.removeChild(div);
  });

  it('environment is correctly set to jsdom (browser-like)', () => {
    // window and document should exist in jsdom
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
