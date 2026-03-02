/**
 * Integration Tests: Login Form — Validation Schema
 * Tests the login form's yup validation schema integrated with react-hook-form.
 * We test purely the form validation layer using the same schema defined in useSignIn.
 * No next-auth or next/navigation imports needed.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextFormInput from '@/components/form/TextFormInput';

// Identical schema to useSignIn.js
const loginFormSchema = yup.object({
  email: yup.string().email('Email is wrong').required('Required field'),
  password: yup.string().required('Required field'),
});

// Self-contained login form harness using the same schema as LoginForm
function LoginFormHarness({ onSubmit = jest.fn() }) {
  const { control, handleSubmit } = useForm({
    resolver: yupResolver(loginFormSchema),
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextFormInput control={control} name="email" label="Email" id="email-id" />

      {/* Plain password input to avoid @iconify dependency */}
      <Controller
        control={control}
        name="password"
        defaultValue=""
        render={({ field, fieldState }) => (
          <div>
            <label htmlFor="password-id">Password</label>
            <input id="password-id" type="password" {...field} />
            {fieldState.error?.message && (
              <span role="alert">{fieldState.error.message}</span>
            )}
          </div>
        )}
      />

      <button type="submit">LOGIN NOW</button>
    </form>
  );
}

describe('Login Form — validation schema integration', () => {
  it('renders the email and password fields', () => {
    render(<LoginFormHarness />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the LOGIN NOW button', () => {
    render(<LoginFormHarness />);
    expect(screen.getByRole('button', { name: /login now/i })).toBeInTheDocument();
  });

  it('shows "Required field" errors when form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginFormHarness />);
    await user.click(screen.getByRole('button', { name: /login now/i }));
    await waitFor(() => {
      const errors = screen.getAllByText('Required field');
      expect(errors).toHaveLength(2); // email + password
    });
  });

  it('shows "Email is wrong" for an invalid email format', async () => {
    const user = userEvent.setup();
    render(<LoginFormHarness />);
    await user.type(screen.getByLabelText('Email'), 'notanemail');
    await user.click(screen.getByRole('button', { name: /login now/i }));
    await waitFor(() => {
      expect(screen.getByText('Email is wrong')).toBeInTheDocument();
    });
  });

  it('does not show errors for valid credentials and calls onSubmit', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginFormHarness onSubmit={mockSubmit} />);
    await user.type(screen.getByLabelText('Email'), 'admin@shubhcars.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: /login now/i }));
    await waitFor(() => {
      expect(screen.queryByText('Required field')).not.toBeInTheDocument();
      expect(screen.queryByText('Email is wrong')).not.toBeInTheDocument();
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('passes correct email and password values to onSubmit', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    render(<LoginFormHarness onSubmit={mockSubmit} />);
    await user.type(screen.getByLabelText('Email'), 'admin@shubhcars.com');
    await user.type(screen.getByLabelText('Password'), 'mypassword');
    await user.click(screen.getByRole('button', { name: /login now/i }));
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        { email: 'admin@shubhcars.com', password: 'mypassword' },
        expect.anything()
      );
    });
  });

  it('shows only the password Required error when email is valid but password empty', async () => {
    const user = userEvent.setup();
    render(<LoginFormHarness />);
    await user.type(screen.getByLabelText('Email'), 'admin@shubhcars.com');
    await user.click(screen.getByRole('button', { name: /login now/i }));
    await waitFor(() => {
      const errors = screen.queryAllByText('Required field');
      expect(errors).toHaveLength(1);
      expect(screen.queryByText('Email is wrong')).not.toBeInTheDocument();
    });
  });
});
