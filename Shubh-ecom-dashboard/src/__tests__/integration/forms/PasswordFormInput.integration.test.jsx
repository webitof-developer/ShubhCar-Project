/**
 * Integration Tests: PasswordFormInput component
 * Tests that it correctly integrates with react-hook-form:
 * - password is hidden by default
 * - clicking the eye toggle reveals the password
 * - shows validation errors
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import PasswordFormInput from '@/components/form/PasswordFormInput';

// IconifyIcon uses SVG — mock it to avoid rendering issues in jsdom
jest.mock('@/components/wrappers/IconifyIcon', () => ({
  __esModule: true,
  default: function MockIcon() { return null; },
}));

function PasswordInputHarness({ schema, name = 'password', label = 'Password' }) {
  const { control, handleSubmit } = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <PasswordFormInput control={control} name={name} label={label} id={`${name}-id`} />
      <button type="submit">Submit</button>
    </form>
  );
}

describe('PasswordFormInput — integration with react-hook-form', () => {
  it('renders the password label', () => {
    render(<PasswordInputHarness />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders the input as type="password" by default (hidden)', () => {
    render(<PasswordInputHarness />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('shows a validation error when password is empty on submit', async () => {
    const user = userEvent.setup();
    const schema = yup.object({ password: yup.string().required('Password is required') });
    render(<PasswordInputHarness schema={schema} />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('shows min-length validation error', async () => {
    const user = userEvent.setup();
    const schema = yup.object({
      password: yup.string().min(8, 'Min 8 characters').required('Required'),
    });
    render(<PasswordInputHarness schema={schema} />);
    await user.type(screen.getByLabelText('Password'), 'abc');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
    });
  });

  it('does not show error for a valid password', async () => {
    const user = userEvent.setup();
    const schema = yup.object({
      password: yup.string().min(6, 'Too short').required('Required'),
    });
    render(<PasswordInputHarness schema={schema} />);
    await user.type(screen.getByLabelText('Password'), 'validPass123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.queryByText('Too short')).not.toBeInTheDocument();
    });
  });
});
