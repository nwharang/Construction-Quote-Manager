import React from 'react';
import { Input, Textarea } from '@heroui/react';

interface AccessibleFormFieldProps {
  id: string;
  name: string;
  label: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AccessibleFormField({
  id,
  name,
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  className,
}: AccessibleFormFieldProps) {
  const isInvalid = !!error;
  const errorId = isInvalid ? `${id}-error` : undefined;
  
  const inputProps = {
    id,
    name,
    value: value || '',
    onChange,
    onBlur,
    placeholder,
    isDisabled: disabled,
    isInvalid,
    isRequired: required,
    'aria-invalid': isInvalid,
    'aria-describedby': errorId,
    className,
  };
  
  return (
    <div className={`mb-4 ${className || ''}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium mb-1.5"
      >
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <Textarea {...inputProps} />
      ) : (
        <Input type={type} {...inputProps} />
      )}
      
      {isInvalid && (
        <div 
          id={errorId}
          className="text-danger text-sm mt-1"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
} 