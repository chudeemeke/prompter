import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

// =============================================================================
// TESTS: Input Component
// =============================================================================

describe('Input', () => {
  describe('Rendering', () => {
    it('should render basic input', () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Input placeholder="No label" />);

      expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(<Input label="Required Field" required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not render required indicator when not required', () => {
      render(<Input label="Optional Field" />);

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when error prop provided', () => {
      render(<Input label="Email" error="Invalid email address" />);

      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('should apply error styling when error prop provided', () => {
      render(<Input label="Email" error="Invalid email" data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-red-500');
    });

    it('should not apply error styling when no error', () => {
      render(<Input label="Email" data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input.className).toContain('border-gray-700');
      expect(input.className).not.toContain('border-red-500');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text when provided', () => {
      render(<Input label="Password" helperText="At least 8 characters" />);

      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(
        <Input
          label="Password"
          helperText="At least 8 characters"
          error="Password too weak"
        />
      );

      expect(screen.getByText('Password too weak')).toBeInTheDocument();
      expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument();
    });

    it('should render helper text when no error', () => {
      render(<Input label="Username" helperText="Choose wisely" />);

      expect(screen.getByText('Choose wisely')).toBeInTheDocument();
    });
  });

  describe('ID Generation', () => {
    it('should use provided id', () => {
      render(<Input id="custom-id" label="Custom" />);

      expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'custom-id');
    });

    it('should generate id from label when not provided', () => {
      render(<Input label="User Name" />);

      expect(screen.getByLabelText('User Name')).toHaveAttribute('id', 'input-user-name');
    });
  });

  describe('Custom Class', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input.className).toContain('custom-class');
    });
  });

  describe('Input Types', () => {
    it('should render password type', () => {
      render(<Input type="password" label="Password" />);

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('should render email type', () => {
      render(<Input type="email" label="Email" />);

      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styling when disabled', () => {
      render(<Input label="Disabled" disabled data-testid="input" />);

      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });
  });

  describe('User Interaction', () => {
    it('should handle onChange events', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Input label="Name" onChange={onChange} />);

      await user.type(screen.getByLabelText('Name'), 'Hello');

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('Forwarded Ref', () => {
    it('should forward ref to input element', () => {
      const ref = { current: null as HTMLInputElement | null };

      render(<Input ref={ref} label="Test" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });
});
