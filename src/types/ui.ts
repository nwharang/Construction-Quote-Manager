/**
 * UI related types
 */

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  value: string | number | boolean;
  options?: Array<{ label: string; value: string | number | boolean }>;
  disabled?: boolean;
  helpText?: string;
  min?: number;
  max?: number;
  step?: number;
  currency?: boolean;
  percentage?: boolean;
  hidden?: boolean;
  readonly?: boolean;
}

export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}

export interface FormSettings {
  labelPlacement?: 'inside' | 'outside' | 'outside-left';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'bordered' | 'underlined';
  fullWidth?: boolean;
  required?: boolean;
}

export interface ButtonSettings {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fullWidth?: boolean;
}

export interface TableSettings {
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  headerClassName?: string;
  cellClassName?: string;
  rowClassName?: string;
}

export interface ToastSettings {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface UISettings {
  formSettings: FormSettings;
  buttonSettings: ButtonSettings;
  tableSettings: TableSettings;
  toastSettings: ToastSettings;
} 