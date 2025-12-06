import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

// =============================================================================
// TESTS: Select Component
// =============================================================================

const defaultOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  describe('Rendering', () => {
    it('should render with options', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select label="Category" options={defaultOptions} />);

      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should render without label', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(<Select label="Required Field" options={defaultOptions} required />);

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not render required indicator when not required', () => {
      render(<Select label="Optional Field" options={defaultOptions} />);

      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should render placeholder when provided', () => {
      render(<Select options={defaultOptions} placeholder="Select an option" />);

      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should not render placeholder when not provided', () => {
      render(<Select options={defaultOptions} />);

      expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should render error message when error prop provided', () => {
      render(<Select label="Category" options={defaultOptions} error="Selection required" />);

      expect(screen.getByText('Selection required')).toBeInTheDocument();
    });

    it('should apply error styling when error prop provided', () => {
      render(
        <Select label="Category" options={defaultOptions} error="Invalid" data-testid="select" />
      );

      const select = screen.getByTestId('select');
      expect(select.className).toContain('border-red-500');
    });

    it('should not apply error styling when no error', () => {
      render(<Select label="Category" options={defaultOptions} data-testid="select" />);

      const select = screen.getByTestId('select');
      expect(select.className).toContain('border-gray-700');
      expect(select.className).not.toContain('border-red-500');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text when provided', () => {
      render(
        <Select
          label="Country"
          options={defaultOptions}
          helperText="Choose your country"
        />
      );

      expect(screen.getByText('Choose your country')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(
        <Select
          label="Country"
          options={defaultOptions}
          helperText="Choose your country"
          error="Country is required"
        />
      );

      expect(screen.getByText('Country is required')).toBeInTheDocument();
      expect(screen.queryByText('Choose your country')).not.toBeInTheDocument();
    });

    it('should render helper text when no error', () => {
      render(
        <Select label="Country" options={defaultOptions} helperText="Optional field" />
      );

      expect(screen.getByText('Optional field')).toBeInTheDocument();
    });
  });

  describe('ID Generation', () => {
    it('should use provided id', () => {
      render(<Select id="custom-id" label="Custom" options={defaultOptions} />);

      expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'custom-id');
    });

    it('should generate id from label when not provided', () => {
      render(<Select label="Country Code" options={defaultOptions} />);

      expect(screen.getByLabelText('Country Code')).toHaveAttribute('id', 'select-country-code');
    });
  });

  describe('Custom Class', () => {
    it('should apply custom className', () => {
      render(<Select options={defaultOptions} className="custom-class" data-testid="select" />);

      const select = screen.getByTestId('select');
      expect(select.className).toContain('custom-class');
    });
  });

  describe('Disabled Options', () => {
    it('should render disabled options', () => {
      const optionsWithDisabled = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
        { value: 'option3', label: 'Option 3' },
      ];

      render(<Select options={optionsWithDisabled} />);

      const disabledOption = screen.getByText('Option 2').closest('option');
      expect(disabledOption).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styling when disabled', () => {
      render(<Select options={defaultOptions} disabled data-testid="select" />);

      const select = screen.getByTestId('select');
      expect(select).toBeDisabled();
    });
  });

  describe('User Interaction', () => {
    it('should handle onChange events', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<Select label="Category" options={defaultOptions} onChange={onChange} />);

      await user.selectOptions(screen.getByLabelText('Category'), 'option2');

      expect(onChange).toHaveBeenCalled();
    });

    it('should update value when option selected', async () => {
      const user = userEvent.setup();

      render(<Select label="Category" options={defaultOptions} />);

      const select = screen.getByLabelText('Category') as HTMLSelectElement;
      await user.selectOptions(select, 'option2');

      expect(select.value).toBe('option2');
    });
  });

  describe('Forwarded Ref', () => {
    it('should forward ref to select element', () => {
      const ref = { current: null as HTMLSelectElement | null };

      render(<Select ref={ref} options={defaultOptions} />);

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('Chevron Icon', () => {
    it('should render chevron icon', () => {
      const { container } = render(<Select options={defaultOptions} />);

      // The chevron icon should be rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});
