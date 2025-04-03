'use client';

import React from 'react';
import { NumberInput, type NumberInputProps } from '@heroui/react';
import { useConfigStore } from '~/store/configStore';
// import { useTranslation } from '~/hooks/useTranslation'; // No longer needed here

type NumberType = 'currency' | 'percentage' | 'integer';

// Extend NumberInputProps but omit properties we'll calculate internally
type ConfiguredNumberInputProps = Omit<
  NumberInputProps,
  'formatOptions' | 'startContent' | 'endContent' | 'step' | 'min' | 'hideStepper' | 'isWheelDisabled'
> & {
  numberType: NumberType;
  // Allow overriding calculated min/step if needed
  min?: number;
  step?: number;
};

export const ConfiguredNumberInput: React.FC<ConfiguredNumberInputProps> = ({
  numberType,
  value,
  min: propMin, // Renamed to avoid conflict
  step: propStep, // Renamed to avoid conflict
  ...rest // Pass through other standard NumberInput props (label, isInvalid, etc.)
}) => {
  const { settings } = useConfigStore();
  // const { formatCurrency } = useTranslation(); // Removed

  const effectiveLocale = settings?.locale || 'en-US';
  const effectiveCurrency = settings?.currency || 'USD';
  // const currencySymbol = settings?.currencySymbol || '$'; // No longer needed

  // --- Start with base options, including locale --- 
  let derivedFormatOptions: Intl.NumberFormatOptions = {
    style: 'decimal', // Base style
    useGrouping: true,
    // Pass locale for correct grouping/decimal separators
    // locale: effectiveLocale, // Intl.NumberFormat uses browser default or inherent locale. Explicitly setting can override.
    // Let's rely on the component's default locale handling for now, unless issues arise.
  };
  // let derivedStartContent: React.ReactNode = undefined; // No longer needed
  let derivedEndContent: React.ReactNode = undefined; // Only used if style doesn't provide suffix
  let derivedMin: number | undefined = propMin; // Use prop value if provided
  let derivedStep: number | undefined = propStep; // Use prop value if provided

  switch (numberType) {
    case 'currency':
      derivedFormatOptions = {
        ...derivedFormatOptions,
        style: 'currency', // Set style to currency
        currency: effectiveCurrency, // Specify currency code
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };
      // derivedStartContent = currencySymbol; // Removed: Rely on style: 'currency'
      if (propMin === undefined) derivedMin = 0; // Default currency min
      if (propStep === undefined) derivedStep = 0.01; // Default currency step
      break;
    case 'percentage':
      derivedFormatOptions = {
        ...derivedFormatOptions,
        style: 'percent', // Use percent style
        minimumFractionDigits: 1, // Adjust as needed for percentage precision
        maximumFractionDigits: 1,
      };
      // derivedEndContent = '%'; // Style 'percent' usually adds '%'
      if (propMin === undefined) derivedMin = 0; // Percentage min 0
      if (propStep === undefined) derivedStep = 0.01; // Default percentage step 1% (0.01)
      // Optionally set max=1 if appropriate for the use case
      // if (propMax === undefined) derivedMax = 1;
      break;
    case 'integer':
      derivedFormatOptions = {
        ...derivedFormatOptions,
        maximumFractionDigits: 0,
      };
      if (propMin === undefined) derivedMin = 1;
      // --- Integer step is always 1 by default --- 
      if (propStep === undefined) {
        derivedStep = 1;
      }
      break;
  }

  // Ensure value passed to NumberInput is a number or undefined (it handles null internally)
  const numericValue = typeof value === 'number' ? value : undefined;

  return (
    <NumberInput
      value={numericValue}
      formatOptions={derivedFormatOptions} 
      // startContent={derivedStartContent} // Removed
      endContent={derivedEndContent} // Keep in case needed by non-percent styles
      min={derivedMin}
      step={derivedStep}
      // --- Apply global appearance settings --- 
      hideStepper={true}      // Hide ugly steppers
      isWheelDisabled={true} // Disable wheel increment/decrement
      {...rest} // Pass through label, isInvalid, errorMessage, onValueChange, etc.
    />
  );
}; 