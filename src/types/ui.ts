/**
 * Type definitions for UI-related settings
 */

export interface UISettings {
  formSettings: {
    labelPlacement: string; // e.g., 'outside', 'inside'
    size: string; // e.g., 'sm', 'md', 'lg'
    variant: string; // e.g., 'bordered', 'flat'
    fullWidth: boolean;
    required: boolean;
  };
  buttonSettings: {
    size: string; // e.g., 'sm', 'md', 'lg'
    color: string; // e.g., 'primary', 'secondary'
    variant: string; // e.g., 'solid', 'bordered'
    radius: string; // e.g., 'md', 'lg', 'full'
    fullWidth: boolean;
  };
  tableSettings: {
    striped: boolean;
    hoverable: boolean;
    bordered: boolean;
    shadow: string; // e.g., 'sm', 'md'
    headerClassName: string;
    cellClassName: string;
    rowClassName: string;
  };
  toastSettings: {
    duration: number;
    position: string; // e.g., 'top-right', 'bottom-center'
  };
} 