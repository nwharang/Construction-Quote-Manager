'use client';

import React from 'react';
import { type NumberInputProps } from '@heroui/react';
import { ConfiguredNumberInput } from './ConfiguredNumberInput';

// Omit the numberType prop and calculated props
type PercentageInputProps = Omit<
  NumberInputProps,
  'formatOptions' | 'startContent' | 'endContent' | 'step' | 'min'
> & {
  // Allow overriding min/step
  min?: number;
  step?: number;
};

export const PercentageInput: React.FC<PercentageInputProps> = (props) => {
  return <ConfiguredNumberInput numberType="percentage" {...props} />;
}; 