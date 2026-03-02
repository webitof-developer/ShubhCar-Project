/**
 * Unit Tests: src/hooks/useToggle.js
 * Tests: initial state, toggle, setTrue, setFalse
 */
import { renderHook, act } from '@testing-library/react';
import useToggle from '@/hooks/useToggle';

describe('useToggle()', () => {
  it('initializes with false by default', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.isTrue).toBe(false);
  });

  it('initializes with true when passed true', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.isTrue).toBe(true);
  });

  it('toggle() switches false → true', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => { result.current.toggle(); });
    expect(result.current.isTrue).toBe(true);
  });

  it('toggle() switches true → false', () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => { result.current.toggle(); });
    expect(result.current.isTrue).toBe(false);
  });

  it('setTrue() sets state to true regardless of current state', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => { result.current.setTrue(); });
    expect(result.current.isTrue).toBe(true);
    // calling again should keep it true
    act(() => { result.current.setTrue(); });
    expect(result.current.isTrue).toBe(true);
  });

  it('setFalse() sets state to false regardless of current state', () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => { result.current.setFalse(); });
    expect(result.current.isTrue).toBe(false);
    // calling again should keep it false
    act(() => { result.current.setFalse(); });
    expect(result.current.isTrue).toBe(false);
  });

  it('returns isTrue, toggle, setTrue, setFalse', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current).toHaveProperty('isTrue');
    expect(typeof result.current.toggle).toBe('function');
    expect(typeof result.current.setTrue).toBe('function');
    expect(typeof result.current.setFalse).toBe('function');
  });
});
