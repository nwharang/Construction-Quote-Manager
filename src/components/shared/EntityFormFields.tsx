import React from 'react';
import { 
  Input, 
  Textarea, 
  Select, 
  SelectItem, 
  Checkbox, 
  Radio, 
  RadioGroup,
  NumberInput
} from '@heroui/react';

/**
 * Text input field with consistent styling
 */
export const TextField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
}> = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  fullWidth = true,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <Input
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        isRequired={required}
        isDisabled={disabled || readOnly}
        description={helpText}
        className={fullWidth ? 'w-full' : ''}
        isInvalid={!!error}
        isReadOnly={readOnly}
      />
      {error && (
        <p className="text-xs text-danger mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Text area field with consistent styling
 */
export const TextAreaField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  rows?: number;
}> = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  rows = 3,
}) => {
  return (
    <Textarea
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      isRequired={required}
      isDisabled={disabled || readOnly}
      errorMessage={error}
      description={helpText}
      minRows={rows}
      className="w-full"
      isInvalid={!!error}
      isReadOnly={readOnly}
    />
  );
};

/**
 * Currency input field with consistent styling
 * Following the UI consistency rules from Context.md
 */
export const CurrencyField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  min?: number;
  fullWidth?: boolean;
}> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  min = 0,
  fullWidth = true,
}) => {
  return (
    <NumberInput
      label={label}
      value={value}
      onValueChange={(val) => onChange(val as number)}
      min={min}
      step={0.01}
      startContent="$"
      formatOptions={{ 
        style: 'decimal', 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }}
      isRequired={required}
      isDisabled={disabled || readOnly}
      errorMessage={error}
      description={helpText}
      className={fullWidth ? 'w-full' : ''}
      isInvalid={!!error}
      isReadOnly={readOnly}
    />
  );
};

/**
 * Percentage input field with consistent styling
 * Following the UI consistency rules from Context.md
 */
export const PercentageField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  fullWidth?: boolean;
}> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  min = 0,
  max = 100,
  step = 0.1,
  fullWidth = true,
}) => {
  return (
    <NumberInput
      label={label}
      value={value}
      onValueChange={(val) => onChange(val as number)}
      min={min}
      max={max}
      step={step}
      endContent="%"
      formatOptions={{ 
        style: 'decimal', 
        minimumFractionDigits: 1, 
        maximumFractionDigits: 1 
      }}
      isRequired={required}
      isDisabled={disabled || readOnly}
      errorMessage={error}
      description={helpText}
      className={fullWidth ? 'w-full' : ''}
      isInvalid={!!error}
      isReadOnly={readOnly}
    />
  );
};

/**
 * Integer quantity input field with consistent styling
 * Following the UI consistency rules from Context.md
 */
export const QuantityField: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  min?: number;
  fullWidth?: boolean;
}> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  min = 1,
  fullWidth = true,
}) => {
  return (
    <NumberInput
      label={label}
      value={value}
      onValueChange={(val) => onChange(val as number)}
      min={min}
      step={1}
      formatOptions={{ style: 'decimal', maximumFractionDigits: 0 }}
      isRequired={required}
      isDisabled={disabled || readOnly}
      errorMessage={error}
      description={helpText}
      className={fullWidth ? 'w-full' : ''}
      isInvalid={!!error}
      isReadOnly={readOnly}
    />
  );
};

/**
 * Select field with consistent styling
 */
export const SelectField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  fullWidth?: boolean;
}> = ({
  value,
  onChange,
  options,
  label,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  fullWidth = true,
}) => {
  return (
    <Select
      label={label}
      placeholder={placeholder}
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0]?.toString();
        if (selectedKey) {
          onChange(selectedKey);
        }
      }}
      isRequired={required}
      isDisabled={disabled || readOnly}
      errorMessage={error}
      description={helpText}
      className={fullWidth ? 'w-full' : ''}
      isInvalid={!!error}
    >
      {options.map((option) => (
        <SelectItem key={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
};

/**
 * Radio group field with consistent styling
 */
export const RadioGroupField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
  orientation?: 'horizontal' | 'vertical';
}> = ({
  value,
  onChange,
  options,
  label,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  helpText,
  orientation = 'horizontal',
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <RadioGroup
        value={value}
        onValueChange={onChange}
        orientation={orientation}
        isDisabled={disabled || readOnly}
        description={helpText}
        errorMessage={error}
        isInvalid={!!error}
      >
        {options.map((option) => (
          <Radio key={option.value} value={option.value}>
            {option.label}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
};

/**
 * Checkbox field with consistent styling
 */
export const CheckboxField: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  helpText?: string;
}> = ({
  checked,
  onChange,
  label,
  disabled = false,
  readOnly = false,
  error,
  helpText,
}) => {
  return (
    <div className="space-y-2">
      <Checkbox
        isSelected={checked}
        onValueChange={onChange}
        isDisabled={disabled || readOnly}
      >
        {label}
      </Checkbox>
      {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}; 