'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Select,
  SelectItem,
  Switch,
  Divider,
  Spinner,
  Tabs,
  Tab,
  NumberInput,
  Textarea,
} from '@heroui/react';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Save, Palette, Settings as SettingsIcon, Bell } from 'lucide-react';
import { api } from '~/trpc/react';
import { MainLayout } from '~/layouts';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useConfigStore } from '~/store/configStore';
import { SUPPORTED_CURRENCIES, FORMAT } from '~/config/constants';
import type { ZodIssue } from 'zod';
import { z } from 'zod';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { useI18n } from '~/hooks/useI18n';
import type { AppLocale, LocaleInfo } from '~/i18n/locales';

// --- Type Definitions ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type SettingsData = RouterOutput['settings']['get'];
type SettingUpdateInput = inferRouterInputs<AppRouter>['settings']['update'];

// --- Helper Functions ---

// Helper function to process fetched data for the form state
// Ensures numeric fields are numbers and handles nulls/undefined
const processSettingsForForm = (data: SettingsData): SettingUpdateInput => {
  // Helper to validate enum types with fallback
  const validateEnum = <T extends string>(
    value: string | null | undefined,
    allowed: readonly T[],
    fallback: T
  ): T => {
    return value && allowed.includes(value as T) ? (value as T) : fallback;
  };

  return {
    companyName: data.companyName ?? '',
    companyEmail: data.companyEmail ?? '',
    companyPhone: data.companyPhone ?? '', // Keep as string for input, Zod handles optional
    companyAddress: data.companyAddress ?? '', // Keep as string for input, Zod handles optional
    // Convert string decimals from DB/query to numbers for form
    defaultComplexityCharge:
      typeof data.defaultComplexityCharge === 'string'
        ? parseFloat(data.defaultComplexityCharge)
        : (data.defaultComplexityCharge ?? 0),
    defaultMarkupCharge:
      typeof data.defaultMarkupCharge === 'string'
        ? parseFloat(data.defaultMarkupCharge)
        : (data.defaultMarkupCharge ?? 0),
    defaultTaskPrice:
      typeof data.defaultTaskPrice === 'string'
        ? parseFloat(data.defaultTaskPrice)
        : (data.defaultTaskPrice ?? 0),
    defaultMaterialPrice:
      typeof data.defaultMaterialPrice === 'string'
        ? parseFloat(data.defaultMaterialPrice)
        : (data.defaultMaterialPrice ?? 0),
    emailNotifications: data.emailNotifications ?? true,
    quoteNotifications: data.quoteNotifications ?? true,
    taskNotifications: data.taskNotifications ?? true,
    // Validate enum fields
    theme: validateEnum(data.theme, ['light', 'dark', 'system'] as const, 'system'),
    locale: validateEnum(data.locale, ['en', 'vi'] as const, 'en'), // Assuming 'vi' is valid
    currency: data.currency ?? 'USD',
    currencySymbol: data.currencySymbol ?? '$',
    dateFormat: data.dateFormat ?? 'MM/DD/YYYY',
    timeFormat: validateEnum(data.timeFormat, ['12h', '24h'] as const, '12h'),
  };
};

/**
 * Settings page component for user preferences
 */
export default function SettingsPage() {
  const { t, locales } = useTranslation();
  const { data: session } = useSession();
  const toast = useAppToast();
  const { setSettings: setStoreSettings } = useConfigStore();
  const { changeLocale } = useI18n();

  const [formState, setFormState] = useState<SettingUpdateInput | null>(null);
  const [validationErrors, setValidationErrors] = useState<ZodIssue[]>([]);

  // Fetch settings - remove onSuccess/onError from options
  const settingsQuery = api.settings.get.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // API mutations
  const utils = api.useUtils(); // Ensure utils is defined
  const updateSettingsMutation = api.settings.update.useMutation({
    onSuccess: (updatedSettings) => {
      // 1. Update Zustand store with exactly what was saved
      // Use processSettingsForForm to ensure types align if needed,
      // or ideally, ensure updatedSettings matches Settings type directly.
      // Assuming updatedSettings directly matches the structure needed by the store:
      setStoreSettings(updatedSettings as SettingsData); // Cast if necessary or ensure type match

      // 2. Invalidate relevant queries
      utils.settings.get.invalidate();

      // 3. Show success toast
      toast.success(t('settings.saveSuccess'));

      // 4. Trigger the actual locale change using the newly saved locale
      if (updatedSettings.locale) {
        changeLocale(updatedSettings.locale as AppLocale);
      }

      // 5. Clear validation errors on successful save
      setValidationErrors([]);
    },
    onError: (error) => {
      // Revert to reconstructing Zod issues from flattened error structure
      if (error.data?.zodError?.fieldErrors || error.data?.zodError?.formErrors) {
        const fieldErrors = error.data.zodError.fieldErrors ?? {};
        const formErrors = error.data.zodError.formErrors ?? [];
        const zodIssues: ZodIssue[] = [];

        Object.entries(fieldErrors).forEach(([path, messages]) => {
          (messages ?? []).forEach((message) => {
            zodIssues.push({
              code: z.ZodIssueCode.custom,
              path: [path],
              message: message,
            });
          });
        });

        formErrors.forEach((message) => {
          zodIssues.push({
            code: z.ZodIssueCode.custom,
            path: [],
            message: message,
          });
        });

        setValidationErrors(zodIssues);
        toast.error(t('settings.validationError'));
      } else {
        toast.error(t('settings.saveError', { message: error.message }));
        console.error('Settings update failed:', error);
      }
    },
  });

  // Effect to populate form state when data loads
  useEffect(() => {
    if (settingsQuery.data) {
      // Log the data received from the query *before* updating store/form
      console.log(
        '[SettingsPage] useEffect detected settingsQuery data change:',
        settingsQuery.data
      );

      // Update local form state first
      setFormState(processSettingsForForm(settingsQuery.data));

      // Update the Zustand store with the *complete* fetched data
      console.log('[SettingsPage] Calling setStoreSettings with fetched data.');
      setStoreSettings(settingsQuery.data);
    }
    // Add setStoreSettings dependency
  }, [settingsQuery.data, setStoreSettings]);

  // Effect to handle fetch errors
  useEffect(() => {
    if (settingsQuery.error) {
      toast.error(t('settings.fetchError', { message: settingsQuery.error.message }));
    }
  }, [settingsQuery.error, toast, t]);

  const exampleDate = new Date();

  const handleFormChange = (
    field: keyof SettingUpdateInput,
    value: string | number | boolean | undefined
  ) => {
    if (!formState) {
      return;
    }

    let processedValue: string | number | boolean | undefined = value;

    const numericFields: (keyof SettingUpdateInput)[] = [
      'defaultComplexityCharge',
      'defaultMarkupCharge',
      'defaultTaskPrice',
      'defaultMaterialPrice',
    ];

    if (numericFields.includes(field)) {
      let numValue: number;
      if (typeof value === 'string') {
        numValue = parseFloat(value);
        if (isNaN(numValue)) {
          numValue = 0;
        }
      } else if (typeof value === 'number') {
        numValue = isNaN(value) ? 0 : value;
      } else {
        numValue = 0;
      }
      processedValue = numValue;
    }

    const booleanFields: (keyof SettingUpdateInput)[] = [
      'emailNotifications',
      'quoteNotifications',
      'taskNotifications',
    ];
    if (booleanFields.includes(field)) {
      processedValue = !!value;
    }

    const newState = { ...formState, [field]: processedValue };
    setFormState(newState);

    // No longer update global store immediately for currency/date/time format
  };

  const handleSave = async () => {
    if (!formState) {
      toast.error(t('settings.loadError'));
      return;
    }

    if (
      !formState.companyName ||
      !formState.companyEmail ||
      !formState.currency ||
      !formState.currencySymbol ||
      !formState.dateFormat
    ) {
      toast.error(t('errors.requiredFieldsMissing'));
      return;
    }

    updateSettingsMutation.mutate(formState);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label="Loading settings..." />
      </div>
    );
  }

  if (settingsQuery.isError || !formState) {
    return (
      <div className="text-danger p-4 text-center">
        <p>{t('settings.loadError')}</p>
        <Button onClick={() => settingsQuery.refetch()} className="mt-2">
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const getFieldError = (field: keyof SettingUpdateInput): string | undefined => {
    return validationErrors.find((err) => err.path[0] === field)?.message;
  };

  return (
    <>
      <Head>
        <title>
          {t('settings.title')} | {t('appName')}
        </title>
      </Head>

      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="mb-6 text-2xl font-semibold">{t('settings.title')}</h1>

        <Tabs aria-label="Settings Tabs" variant="underlined" classNames={{ panel: 'p-4 mt-4' }}>
          <Tab
            key="general"
            title={
              <div className="flex items-center space-x-2">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>{t('settings.general')}</span>
              </div>
            }
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">{t('settings.companyInfo')}</h2>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label={t('settings.companyName')}
                  value={formState.companyName || ''}
                  onValueChange={(v) => handleFormChange('companyName', v)}
                  isRequired
                  isInvalid={!!getFieldError('companyName')}
                  errorMessage={getFieldError('companyName')}
                />
                <Input
                  label={t('settings.companyEmail')}
                  type="email"
                  value={formState.companyEmail || ''}
                  onValueChange={(v) => handleFormChange('companyEmail', v)}
                  isRequired
                  isInvalid={!!getFieldError('companyEmail')}
                  errorMessage={getFieldError('companyEmail')}
                />
                <Input
                  label={t('settings.companyPhone')}
                  value={formState.companyPhone || ''}
                  onValueChange={(v) => handleFormChange('companyPhone', v)}
                  isInvalid={!!getFieldError('companyPhone')}
                  errorMessage={getFieldError('companyPhone')}
                />
                <Textarea
                  label={t('settings.companyAddress')}
                  value={formState.companyAddress || ''}
                  onValueChange={(v) => handleFormChange('companyAddress', v)}
                  isInvalid={!!getFieldError('companyAddress')}
                  errorMessage={getFieldError('companyAddress')}
                  className="md:col-span-2"
                />
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-medium">{t('settings.quoteDefaults')}</h2>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <NumberInput
                  label={t('settings.defaultMarkupCharge')}
                  value={formState.defaultMarkupCharge ?? 0}
                  onValueChange={(v) => handleFormChange('defaultMarkupCharge', v)}
                  min={0}
                  max={100}
                  step={0.1}
                  formatOptions={{
                    style: 'decimal',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                  endContent="%"
                  isInvalid={!!getFieldError('defaultMarkupCharge')}
                  errorMessage={getFieldError('defaultMarkupCharge')}
                />
                <NumberInput
                  label={t('settings.defaultComplexityCharge')}
                  value={formState.defaultComplexityCharge ?? 0}
                  onValueChange={(v) => handleFormChange('defaultComplexityCharge', v)}
                  min={0}
                  max={100}
                  step={0.1}
                  formatOptions={{
                    style: 'decimal',
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }}
                  endContent="%"
                  isInvalid={!!getFieldError('defaultComplexityCharge')}
                  errorMessage={getFieldError('defaultComplexityCharge')}
                />
                <NumberInput
                  label={t('settings.defaultTaskPrice')}
                  value={formState.defaultTaskPrice ?? 0}
                  onValueChange={(v) => handleFormChange('defaultTaskPrice', v)}
                  min={0}
                  step={0.01}
                  formatOptions={{
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                  startContent={formState.currencySymbol || '$'}
                  isInvalid={!!getFieldError('defaultTaskPrice')}
                  errorMessage={getFieldError('defaultTaskPrice')}
                />
                <NumberInput
                  label={t('settings.defaultMaterialPrice')}
                  value={formState.defaultMaterialPrice ?? 0}
                  onValueChange={(v) => handleFormChange('defaultMaterialPrice', v)}
                  min={0}
                  step={0.01}
                  formatOptions={{
                    style: 'decimal',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                  startContent={formState.currencySymbol || '$'}
                  isInvalid={!!getFieldError('defaultMaterialPrice')}
                  errorMessage={getFieldError('defaultMaterialPrice')}
                />
              </CardBody>
            </Card>
          </Tab>

          <Tab
            key="appearance"
            title={
              <div className="flex items-center space-x-2">
                <Palette className="mr-2 h-4 w-4" />
                <span>{t('settings.appearance')}</span>
              </div>
            }
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">{t('settings.theme')}</h2>
              </CardHeader>
              <CardBody className="flex flex-row items-center justify-between">
                <span>{t('settings.darkMode')}</span>
                <ThemeToggle
                  applyImmediately={false}
                  value={formState.theme}
                  onThemeChange={(newTheme) => handleFormChange('theme', newTheme)}
                />
              </CardBody>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-lg font-medium">{t('settings.localization')}</h2>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select
                  label={t('settings.language')}
                  placeholder={t('settings.selectLanguagePlaceholder')}
                  selectedKeys={formState.locale ? [formState.locale] : []}
                  onSelectionChange={(keys) => {
                    const selection = keys as Set<string>;
                    handleFormChange('locale', Array.from(selection)[0] as AppLocale);
                  }}
                  isInvalid={!!getFieldError('locale')}
                  errorMessage={getFieldError('locale')}
                  description={t('settings.languageDescription')}
                >
                  {(Object.entries(locales || {}) as [AppLocale, LocaleInfo][]).map(
                    ([code, { name, flag }]) => (
                      <SelectItem key={code} textValue={name}>
                        <div className="flex items-center">
                          <span className="mr-2 text-lg" role="img" aria-label={`${name} flag`}>
                            {flag || '🏳️'}
                          </span>
                          {name}
                        </div>
                      </SelectItem>
                    )
                  )}
                </Select>
                <Select
                  label={t('settings.currency')}
                  selectedKeys={formState.currency ? [formState.currency] : []}
                  onSelectionChange={(keys) => {
                    const selection = keys as Set<string>;
                    const selectedCurrencyCode = Array.from(selection)[0] as string;
                    const currencyKey = selectedCurrencyCode as keyof typeof SUPPORTED_CURRENCIES;
                    handleFormChange('currency', selectedCurrencyCode);
                    const symbol = SUPPORTED_CURRENCIES[currencyKey]?.symbol || '';
                    handleFormChange('currencySymbol', symbol);
                  }}
                  isRequired
                  isInvalid={!!getFieldError('currency')}
                  errorMessage={getFieldError('currency')}
                >
                  {Object.entries(SUPPORTED_CURRENCIES).map(([key, { name, symbol }]) => (
                    <SelectItem key={key} startContent={symbol} textValue={`${name} (${key})`}>
                      {name} ({key})
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label={t('settings.dateFormat')}
                  selectedKeys={formState.dateFormat ? [formState.dateFormat] : []}
                  onSelectionChange={(keys) => {
                    const selection = keys as Set<string>;
                    handleFormChange('dateFormat', Array.from(selection)[0] as string);
                  }}
                  isRequired
                  isInvalid={!!getFieldError('dateFormat')}
                  errorMessage={getFieldError('dateFormat')}
                >
                  <SelectItem key={FORMAT.DATE.US} textValue={`${FORMAT.DATE.US}`}>
                    <div className="flex flex-col">
                      <span className="text-sm">{FORMAT.DATE.US}</span>
                      <span className="text-default-500 text-xs">
                        (
                        {exampleDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                        )
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem key={FORMAT.DATE.EU} textValue={FORMAT.DATE.EU}>
                    <div className="flex flex-col">
                      <span className="text-sm">{FORMAT.DATE.EU}</span>
                      <span className="text-default-500 text-xs">
                        (
                        {exampleDate.toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                        )
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem key={FORMAT.DATE.INTL} textValue={FORMAT.DATE.INTL}>
                    <div className="flex flex-col">
                      <span className="text-sm">{FORMAT.DATE.INTL}</span>
                      <span className="text-default-500 text-xs">
                        (
                        {exampleDate.toLocaleDateString('sv-SE', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                        )
                      </span>
                    </div>
                  </SelectItem>
                </Select>
                <p className="text-default-500 text-xs md:col-span-2">
                  {t('settings.dateFormatDescription')}
                </p>
                <Select
                  label={t('settings.timeFormat')}
                  selectedKeys={formState.timeFormat ? [formState.timeFormat] : []}
                  onSelectionChange={(keys) => {
                    const selection = keys as Set<string>;
                    handleFormChange(
                      'timeFormat',
                      Array.from(selection)[0] as SettingUpdateInput['timeFormat']
                    );
                  }}
                  isRequired
                  isInvalid={!!getFieldError('timeFormat')}
                  errorMessage={getFieldError('timeFormat')}
                >
                  <SelectItem key={FORMAT.TIME.H12} textValue="12-Hour">
                    12-Hour
                  </SelectItem>
                  <SelectItem key={FORMAT.TIME.H24} textValue="24-Hour">
                    24-Hour
                  </SelectItem>
                </Select>
                <p className="text-default-500 text-xs md:col-span-2">
                  {t('settings.timeFormatDescription')}
                </p>
              </CardBody>
            </Card>
          </Tab>

          <Tab
            key="notifications"
            title={
              <div className="flex items-center space-x-2">
                <Bell className="mr-2 h-4 w-4" />
                <span>{t('settings.notifications')}</span>
              </div>
            }
          >
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium">{t('settings.notificationPreferences')}</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-grow flex-col gap-1">
                    <span className="text-default-700 text-sm font-medium">
                      {t('settings.emailNotifications')}
                    </span>
                    <span className="text-default-500 text-xs">
                      {t('settings.emailNotificationsDescription')}
                    </span>
                    {getFieldError('emailNotifications') && (
                      <p className="text-danger mt-1 text-xs">
                        {getFieldError('emailNotifications')}
                      </p>
                    )}
                  </div>
                  <Switch
                    isSelected={formState.emailNotifications}
                    onValueChange={(v) => handleFormChange('emailNotifications', v)}
                    aria-label={t('settings.emailNotifications')}
                  />
                </div>
                <Divider />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-grow flex-col gap-1">
                    <span className="text-default-700 text-sm font-medium">
                      {t('settings.quoteNotifications')}
                    </span>
                    <span className="text-default-500 text-xs">
                      {t('settings.quoteNotificationsDescription')}
                    </span>
                    {getFieldError('quoteNotifications') && (
                      <p className="text-danger mt-1 text-xs">
                        {getFieldError('quoteNotifications')}
                      </p>
                    )}
                  </div>
                  <Switch
                    isSelected={formState.quoteNotifications}
                    onValueChange={(v) => handleFormChange('quoteNotifications', v)}
                    aria-label={t('settings.quoteNotifications')}
                  />
                </div>
                <Divider />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-grow flex-col gap-1">
                    <span className="text-default-700 text-sm font-medium">
                      {t('settings.taskNotifications')}
                    </span>
                    <span className="text-default-500 text-xs">
                      {t('settings.taskNotificationsDescription')}
                    </span>
                    {getFieldError('taskNotifications') && (
                      <p className="text-danger mt-1 text-xs">
                        {getFieldError('taskNotifications')}
                      </p>
                    )}
                  </div>
                  <Switch
                    isSelected={formState.taskNotifications}
                    onValueChange={(v) => handleFormChange('taskNotifications', v)}
                    aria-label={t('settings.taskNotifications')}
                  />
                </div>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>

        <Card className="mt-6">
          <CardFooter className="flex justify-end gap-2 p-4">
            <Button
              variant="bordered"
              onPress={handleCancel}
              disabled={updateSettingsMutation.isPending || settingsQuery.isFetching}
            >
              {t('common.cancel')}
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              startContent={<Save size={16} />}
              isLoading={updateSettingsMutation.isPending}
              isDisabled={!formState || settingsQuery.isLoading}
            >
              {t('common.saveChanges')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}

SettingsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};

const handleCancel = () => {
  console.log('Cancel clicked');
  // TODO: Implement logic to reset formState, possibly via refetching settingsQuery
  // settingsQuery.refetch(); // Example
};
