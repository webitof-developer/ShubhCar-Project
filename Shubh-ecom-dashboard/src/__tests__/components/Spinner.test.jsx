/**
 * Unit Tests: src/components/Spinner.jsx
 * Tests: renders correctly with various props
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Spinner from '@/components/Spinner';

describe('Spinner component', () => {
  it('renders with role="status" by default', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders as a <div> by default', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('renders as a custom tag when tag prop is provided', () => {
    const { container } = render(<Spinner tag="span" />);
    expect(container.firstChild.tagName).toBe('SPAN');
  });

  it('applies "spinner-border" class for type="bordered" (default)', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').className).toContain('spinner-border');
  });

  it('applies "spinner-grow" class for type="grow"', () => {
    render(<Spinner type="grow" />);
    expect(screen.getByRole('status').className).toContain('spinner-grow');
  });

  it('applies text-{color} class when color prop is provided', () => {
    render(<Spinner color="danger" />);
    expect(screen.getByRole('status').className).toContain('text-danger');
  });

  it('falls back to text-primary when no color is provided', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').className).toContain('text-primary');
  });

  it('applies avatar-{size} class when size prop is provided', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByRole('status').className).toContain('avatar-sm');
  });

  it('renders children inside the spinner element', () => {
    render(<Spinner><span>Loading...</span></Spinner>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies a custom className', () => {
    render(<Spinner className="my-custom-class" />);
    expect(screen.getByRole('status').className).toContain('my-custom-class');
  });
});
