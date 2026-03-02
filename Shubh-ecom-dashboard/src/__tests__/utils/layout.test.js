/**
 * Unit Tests: src/utils/layout.js
 * Tests: toggleDocumentAttribute
 */
import { toggleDocumentAttribute } from '@/utils/layout';

describe('toggleDocumentAttribute()', () => {
  beforeEach(() => {
    // Ensure html element starts clean for each test
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-menu');
  });

  it('sets an attribute on the <html> element by default', () => {
    toggleDocumentAttribute('data-theme', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes an existing attribute when remove=true', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleDocumentAttribute('data-theme', 'dark', true);
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('sets the attribute even when remove=true but attribute does not exist yet (else branch)', () => {
    // When remove=true but the attribute is not present, hasAttribute is null (falsy),
    // so the condition `if (remove && hasAttribute)` is false, and setAttribute is called instead.
    toggleDocumentAttribute('data-theme', 'dark', true);
    // The attribute gets SET, not removed, because it wasn't there in the first place
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('sets an attribute on a custom HTML tag (e.g. body)', () => {
    toggleDocumentAttribute('data-menu', 'sidebar', false, 'body');
    expect(document.body.getAttribute('data-menu')).toBe('sidebar');
    document.body.removeAttribute('data-menu');
  });

  it('overwrites an existing attribute value', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    toggleDocumentAttribute('data-theme', 'dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
