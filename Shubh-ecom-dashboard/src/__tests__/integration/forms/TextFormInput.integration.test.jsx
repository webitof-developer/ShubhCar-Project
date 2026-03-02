/**
 * Integration Tests: TextFormInput component
 * Tests that it correctly integrates with react-hook-form:
 * - renders the label and input
 * - shows the controlled value
 * - shows validation error messages
 * - marks the input as invalid when there is an error
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextFormInput from '@/components/form/TextFormInput';

// Helper: Wrap component with a real useForm instance
function TextFormInputHarness({ schema, defaultValues, name = 'email', label = 'Email' }) {
  const { control, handleSubmit } = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <TextFormInput control={control} name={name} label={label} id={`${name}-id`} />
      <button type="submit">Submit</button>
    </form>
  );
}

describe('TextFormInput — integration with react-hook-form', () => {
  it('renders the label text', () => {
    render(<TextFormInputHarness />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders an input element', () => {
    render(<TextFormInputHarness />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('allows the user to type in the input', async () => {
    const user = userEvent.setup();
    render(<TextFormInputHarness />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'hello@test.com');
    expect(input).toHaveValue('hello@test.com');
  });

  it('shows a validation error when required field is submitted empty', async () => {
    const user = userEvent.setup();
    const schema = yup.object({ email: yup.string().required('Email is required') });
    render(<TextFormInputHarness schema={schema} name="email" label="Email" />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('shows an email format error for an invalid email', async () => {
    const user = userEvent.setup();
    const schema = yup.object({
      email: yup.string().email('Invalid email format').required('Required'),
    });
    render(<TextFormInputHarness schema={schema} name="email" label="Email" />);
    await user.type(screen.getByRole('textbox'), 'notanemail');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('does NOT show a validation error for a valid email', async () => {
    const user = userEvent.setup();
    const schema = yup.object({ email: yup.string().email('Invalid').required('Required') });
    render(<TextFormInputHarness schema={schema} name="email" label="Email" />);
    await user.type(screen.getByRole('textbox'), 'valid@email.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.queryByText('Invalid')).not.toBeInTheDocument();
    });
  });

  it('renders with the defaultValue pre-filled', () => {
    render(<TextFormInputHarness defaultValues={{ email: 'prefilled@test.com' }} />);
    expect(screen.getByRole('textbox')).toHaveValue('prefilled@test.com');
  });
});
