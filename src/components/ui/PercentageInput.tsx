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
};

export const PercentageInput: React.FC<PercentageInputProps> = (props) => {
  // Set default step to 1 (representing 1%) unless overridden
  return (
    <ConfiguredNumberInput
      {...props}
      step={0.01}
      min={0}
      max={1}
      formatOptions={{
        style: 'percent',
      }}
    />
  );
};
