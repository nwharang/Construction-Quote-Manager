'use client';

import React from 'react';
import { type NumberInputProps } from '@heroui/react';
import { ConfiguredNumberInput } from './ConfiguredNumberInput'; // Assuming it's in the same directory

// Omit the numberType prop as it's fixed, and the props calculated by ConfiguredNumberInput
type CurrencyInputProps = Omit<
  NumberInputProps,
  'formatOptions' | 'startContent' | 'endContent' | 'step' | 'min'
> & {
  // Allow overriding min/step if absolutely necessary, though defaults are set
  min?: number;
  step?: number;
};

export const CurrencyInput: React.FC<CurrencyInputProps> = (props) => {
  return <ConfiguredNumberInput numberType="currency" {...props} />;
}; 