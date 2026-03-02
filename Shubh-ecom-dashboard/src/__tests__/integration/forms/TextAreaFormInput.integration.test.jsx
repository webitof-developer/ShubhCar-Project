/**
 * Integration Tests: TextAreaFormInput component
 * Tests that it correctly integrates with react-hook-form:
 * - renders a textarea with label
 * - shows validation errors
 * - accepts user input
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import TextAreaFormInput from '@/components/form/TextAreaFormInput';

function TextAreaHarness({ schema, name = 'notes', label = 'Notes' }) {
  const { control, handleSubmit } = useForm({
    resolver: schema ? yupResolver(schema) : undefined,
  });
  return (
    <form onSubmit={handleSubmit(() => {})}>
      <TextAreaFormInput control={control} name={name} label={label} id={`${name}-id`} />
      <button type="submit">Submit</button>
    </form>
  );
}

describe('TextAreaFormInput — integration with react-hook-form', () => {
  it('renders the label text', () => {
    render(<TextAreaHarness />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('renders a textarea element', () => {
    render(<TextAreaHarness />);
    // textarea has the implicit role of "textbox"
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('allows multiline typing in the textarea', async () => {
    const user = userEvent.setup();
    render(<TextAreaHarness />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Line 1{Enter}Line 2');
    expect(textarea).toHaveValue('Line 1\nLine 2');
  });

  it('shows a validation error when required textarea is empty on submit', async () => {
    const user = userEvent.setup();
    const schema = yup.object({ notes: yup.string().required('Notes are required') });
    render(<TextAreaHarness schema={schema} />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText('Notes are required')).toBeInTheDocument();
    });
  });

  it('does not show error when textarea has content', async () => {
    const user = userEvent.setup();
    const schema = yup.object({ notes: yup.string().required('Notes are required') });
    render(<TextAreaHarness schema={schema} />);
    await user.type(screen.getByRole('textbox'), 'Some valid notes here');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(screen.queryByText('Notes are required')).not.toBeInTheDocument();
    });
  });
});
