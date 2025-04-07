'use client';

import React from 'react';
import { NumberInput, type NumberInputProps } from '@heroui/react';
import { useConfigStore } from '~/store/configStore';
import { useTranslation } from '~/hooks/useTranslation';
// import { useTranslation } from '~/hooks/useTranslation'; // No longer needed here

export const ConfiguredNumberInput: React.FC<NumberInputProps> = (rest) => {
  const { settings } = useConfigStore();

  return (
    <NumberInput
      locale={settings?.locale || 'en-US'}
      hideStepper={true} // Show steppers to ensure users can increment/decrement
      isWheelDisabled={true} // Disable wheel increment/decrement
      {...rest} // Pass through label, isInvalid, errorMessage, etc.
    />
  );
};
