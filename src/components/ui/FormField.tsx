'use client';

import React from 'react';
import { Input, Textarea } from '@heroui/react';

type FormFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'date';
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  helpText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
};

/**
 * FormField component that wraps HeroUI form components with consistent styling and accessibility features
 */
export function FormField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  helpText,
  isRequired = false,
  isDisabled = false,
  placeholder,
  className,
  min,
  max
}: FormFieldProps) {
  // Format value to string for use in input
  const stringValue = value !== undefined ? value.toString() : '';

  // Render the appropriate input component based on type
  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <Textarea
          id={id}
          name={name}
          value={stringValue}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          isRequired={isRequired}
          isDisabled={isDisabled}
          isInvalid={!!error}
          className={className}
        />
      );
    }
    
    return (
      <Input
        id={id}
        name={name}
        type={type}
        value={stringValue}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        isRequired={isRequired}
        isDisabled={isDisabled}
        isInvalid={!!error}
        min={type === 'number' ? min : undefined}
        max={type === 'number' ? max : undefined}
        className={className}
      />
    );
  };

  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
        {isRequired && <span className="text-danger ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {helpText && !error && (
        <div className="text-xs text-muted-foreground mt-1">
          {helpText}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-danger mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
  );
} 