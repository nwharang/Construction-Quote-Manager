'use client';

import React from 'react';
import { type NumberInputProps } from '@heroui/react';
import { ConfiguredNumberInput } from './ConfiguredNumberInput';
import { useConfigStore } from '~/store';

// Omit the numberType prop and calculated props
type IntegerInputProps = Omit<
  NumberInputProps,
  'formatOptions' | 'startContent' | 'endContent' | 'step' | 'min'
> & {
  // Allow overriding min/step (default min=1, step=1)
  min?: number;
  step?: number;
};

export const IntegerInput: React.FC<IntegerInputProps> = (props) => {
  // Default min to 1 for integer inputs unless overridden
  return <ConfiguredNumberInput {...props} />;
};
