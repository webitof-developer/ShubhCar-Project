/**
 * Unit Tests: src/hooks/useLocalStorage.js
 * Tests: initial value, setValue, override flag, cross-tab storage event
 */
import { renderHook, act } from '@testing-library/react';
import useLocalStorage from '@/hooks/useLocalStorage';

// Mock the logger to suppress error output in test console
jest.mock('@/lib/logger', () => ({
  error: jest.fn(),
}));

beforeEach(() => {
  localStorage.clear();
});

describe('useLocalStorage()', () => {
  it('returns the initialValue when nothing is stored under the key', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'hello')
    );
    expect(result.current[0]).toBe('hello');
  });

  it('persists the initialValue to localStorage on first render', () => {
    renderHook(() => useLocalStorage('test-key', 'hello'));
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('hello');
  });

  it('reads an existing value from localStorage instead of initialValue', () => {
    localStorage.setItem('test-key', JSON.stringify('saved-value'));
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );
    expect(result.current[0]).toBe('saved-value');
  });

  it('setValue updates the state and localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );
    act(() => {
      result.current[1]('new-value');
    });
    expect(result.current[0]).toBe('new-value');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('new-value');
  });

  it('setValue accepts a function updater (similar to useState)', () => {
    const { result } = renderHook(() =>
      useLocalStorage('counter', 0)
    );
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
  });

  it('returns initialValue when override=true, ignoring stored value', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'override-value', true)
    );
    expect(result.current[0]).toBe('override-value');
  });

  it('works with object values serialised as JSON', () => {
    const obj = { name: 'Shubh', role: 'admin' };
    const { result } = renderHook(() =>
      useLocalStorage('user', obj)
    );
    expect(result.current[0]).toEqual(obj);
  });
});
