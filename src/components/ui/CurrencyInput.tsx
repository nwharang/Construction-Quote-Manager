'use client';

import React from 'react';
import { type NumberInputProps } from '@heroui/react';
import { ConfiguredNumberInput } from './ConfiguredNumberInput'; // Assuming it's in the same directory
// No longer need useConfigStore here as ConfiguredNumberInput handles it

// Omit the numberType prop as it's fixed, and the props calculated by ConfiguredNumberInput
type CurrencyInputProps = Omit<
  NumberInputProps,
  'formatOptions' | 'startContent' | 'endContent' | 'numberType' // Remove numberType from Omit
> & {
  // Allow overriding min/step if absolutely necessary, though defaults are set by ConfiguredNumberInput
  min?: number;
  step?: number;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = (props) => {
  // Directly return ConfiguredNumberInput with numberType set to 'currency'
  // Pass all other props through. ConfiguredNumberInput will handle defaults.
  return (
    <ConfiguredNumberInput
      {...props} // Pass through all other props like label, value, onChange, isInvalid, etc.
    />
  );
};
