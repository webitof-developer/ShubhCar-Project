/**
 * Unit Tests: src/components/FallbackLoading.jsx
 * Tests: renders correctly with correct skeleton structure
 */
import React from 'react';
import { render, container } from '@testing-library/react';
import FallbackLoading from '@/components/FallbackLoading';

describe('FallbackLoading component', () => {
  it('renders without crashing', () => {
    const { container } = render(<FallbackLoading />);
    expect(container).toBeTruthy();
  });

  it('renders 4 skeleton-card elements', () => {
    const { container } = render(<FallbackLoading />);
    const skeletonCards = container.querySelectorAll('.skeleton-card');
    expect(skeletonCards.length).toBe(4);
  });

  it('renders skeleton elements for the body layout', () => {
    const { container } = render(<FallbackLoading />);
    const skeletons = container.querySelectorAll('.skeleton');
    // 4 skeleton-cards + 3 body skeletons = 7 total
    expect(skeletons.length).toBeGreaterThanOrEqual(7);
  });

  it('wraps everything in a div with class "p-4"', () => {
    const { container } = render(<FallbackLoading />);
    expect(container.firstChild.className).toContain('p-4');
  });
});
