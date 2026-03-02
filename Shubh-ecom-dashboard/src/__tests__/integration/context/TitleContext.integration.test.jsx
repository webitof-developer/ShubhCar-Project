/**
 * Integration Tests: TitleContext (useTitleContext)
 * Tests that the TitleProvider correctly manages title state
 * and that useTitle hook works with it.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TitleProvider, useTitle } from '@/context/useTitleContext';

// A helper component that reads and updates the title
function TitleConsumer({ newTitle }) {
  const { title, setTitle } = useTitle();
  return (
    <div>
      <span data-testid="title-display">{title}</span>
      {newTitle && (
        <button onClick={() => setTitle(newTitle)}>Set Title</button>
      )}
    </div>
  );
}

describe('TitleContext — integration', () => {
  it('provides the default title "WELCOME!" to consumers', () => {
    render(
      <TitleProvider>
        <TitleConsumer />
      </TitleProvider>
    );
    expect(screen.getByTestId('title-display')).toHaveTextContent('WELCOME!');
  });

  it('allows consumers to update the title via setTitle', () => {
    render(
      <TitleProvider>
        <TitleConsumer newTitle="Dashboard" />
      </TitleProvider>
    );
    act(() => {
      screen.getByRole('button').click();
    });
    expect(screen.getByTestId('title-display')).toHaveTextContent('Dashboard');
  });

  it('multiple consumers share the same title state', () => {
    render(
      <TitleProvider>
        <TitleConsumer newTitle="Orders" />
        <TitleConsumer />
      </TitleProvider>
    );
    // Click the button in the first consumer
    act(() => {
      screen.getByRole('button').click();
    });
    // Both displays should show the updated title
    const displays = screen.getAllByTestId('title-display');
    expect(displays[0]).toHaveTextContent('Orders');
    expect(displays[1]).toHaveTextContent('Orders');
  });

  it('throws an error when useTitle is used outside TitleProvider', () => {
    // Suppress the expected console.error from React
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TitleConsumer />)).toThrow(
      'useTitle must be used within a TitleProvider'
    );
    spy.mockRestore();
  });
});
