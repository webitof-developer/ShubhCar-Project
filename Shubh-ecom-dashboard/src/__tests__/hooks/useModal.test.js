/**
 * Unit Tests: src/hooks/useModal.js
 * Tests: initial state, openModalWithSize, openModalWithClass, openModalWithScroll, toggleModal
 */
import { renderHook, act } from '@testing-library/react';
import useModal from '@/hooks/useModal';

describe('useModal()', () => {
  it('initializes with isOpen=false', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isOpen).toBe(false);
  });

  it('toggleModal() opens the modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.toggleModal(); });
    expect(result.current.isOpen).toBe(true);
  });

  it('toggleModal() closes the modal when already open', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.toggleModal(); }); // open
    act(() => { result.current.toggleModal(); }); // close
    expect(result.current.isOpen).toBe(false);
  });

  it('openModalWithSize() sets the size and opens modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.openModalWithSize('lg'); });
    expect(result.current.size).toBe('lg');
    expect(result.current.isOpen).toBe(true);
    expect(result.current.scroll).toBe(false);
    expect(result.current.className).toBe('');
  });

  it('openModalWithClass() sets the className and opens modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.openModalWithClass('modal-full'); });
    expect(result.current.className).toBe('modal-full');
    expect(result.current.isOpen).toBe(true);
    expect(result.current.scroll).toBe(false);
  });

  it('openModalWithScroll() enables scroll and opens modal', () => {
    const { result } = renderHook(() => useModal());
    act(() => { result.current.openModalWithScroll(); });
    expect(result.current.scroll).toBe(true);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.className).toBe('');
  });

  it('returns all expected properties', () => {
    const { result } = renderHook(() => useModal());
    expect(result.current).toHaveProperty('isOpen');
    expect(result.current).toHaveProperty('size');
    expect(result.current).toHaveProperty('className');
    expect(result.current).toHaveProperty('scroll');
    expect(typeof result.current.toggleModal).toBe('function');
    expect(typeof result.current.openModalWithSize).toBe('function');
    expect(typeof result.current.openModalWithClass).toBe('function');
    expect(typeof result.current.openModalWithScroll).toBe('function');
  });
});
