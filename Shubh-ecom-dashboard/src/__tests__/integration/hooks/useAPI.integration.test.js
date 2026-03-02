/**
 * Integration Tests: useAPI hook
 * Tests how the hook manages loading/error/data states
 * when integrated with a mock API function.
 * Uses jest.fn() to mock the API — no real network calls made.
 */
import { renderHook, act } from '@testing-library/react';
import useAPI from '@/hooks/useAPI';

// Mock toast from react-toastify to prevent real notifications in tests
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
const { toast } = require('react-toastify');

describe('useAPI hook — integration with mocked API function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with loading=false, error=null, data=null', () => {
    const mockApi = jest.fn();
    const { result } = renderHook(() => useAPI(mockApi));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });

  it('sets loading=true while the API call is in-flight', async () => {
    let resolveApi;
    const mockApi = jest.fn(() => new Promise((res) => { resolveApi = res; }));
    const { result } = renderHook(() => useAPI(mockApi));

    act(() => { result.current.execute(); });
    expect(result.current.loading).toBe(true);

    // Resolve the promise
    await act(async () => { resolveApi({ id: 1 }); });
    expect(result.current.loading).toBe(false);
  });

  it('sets data on successful API call', async () => {
    const mockData = { products: [{ id: 1, name: 'Car' }] };
    const mockApi = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useAPI(mockApi));

    await act(async () => { await result.current.execute(); });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('sets error when the API call throws', async () => {
    const mockApi = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAPI(mockApi, { showErrorToast: false }));

    await act(async () => {
      try { await result.current.execute(); } catch {}
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('calls toast.success when showSuccessToast=true and API succeeds', async () => {
    const mockApi = jest.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useAPI(mockApi, { showSuccessToast: true, successMessage: 'Saved!', showErrorToast: false })
    );

    await act(async () => { await result.current.execute(); });

    expect(toast.success).toHaveBeenCalledWith('Saved!');
  });

  it('calls toast.error when showErrorToast=true (default) and API fails', async () => {
    const mockApi = jest.fn().mockRejectedValue(new Error('Server down'));
    const { result } = renderHook(() => useAPI(mockApi));

    await act(async () => {
      try { await result.current.execute(); } catch {}
    });

    expect(toast.error).toHaveBeenCalledWith('Server down');
  });

  it('does NOT call toast.error when showErrorToast=false', async () => {
    const mockApi = jest.fn().mockRejectedValue(new Error('Silent fail'));
    const { result } = renderHook(() => useAPI(mockApi, { showErrorToast: false }));

    await act(async () => {
      try { await result.current.execute(); } catch {}
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('reset() clears state back to initial values', async () => {
    const mockData = { id: 42 };
    const mockApi = jest.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useAPI(mockApi));

    await act(async () => { await result.current.execute(); });
    expect(result.current.data).toEqual(mockData);

    act(() => { result.current.reset(); });
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  it('passes arguments through to the API function', async () => {
    const mockApi = jest.fn().mockResolvedValue({});
    const { result } = renderHook(() => useAPI(mockApi));

    await act(async () => { await result.current.execute('token-abc', { id: 5 }); });

    expect(mockApi).toHaveBeenCalledWith('token-abc', { id: 5 });
  });

  it('returns the API result from execute()', async () => {
    const mockApi = jest.fn().mockResolvedValue({ status: 'ok' });
    const { result } = renderHook(() => useAPI(mockApi));

    let returnValue;
    await act(async () => {
      returnValue = await result.current.execute();
    });

    expect(returnValue).toEqual({ status: 'ok' });
  });
});
