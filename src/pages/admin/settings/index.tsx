'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ButtonGroup,
} from '@heroui/react';
import {
  Save,
  Palette,
  Settings as SettingsIcon,
  Bell,
  X,
  Check,
  FileImage,
  Upload,
  Trash2,
} from 'lucide-react';
import { api } from '~/trpc/react';
import { MainLayout } from '~/layouts';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';
import { useConfigStore } from '~/store/configStore';
import type { ZodIssue } from 'zod';
import { z } from 'zod';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/api/root';
import { useI18n } from '~/hooks/useI18n';
import type { AppLocale, LocaleInfo } from '~/i18n/locales';
import { useLocaleCurrency } from '~/hooks/useLocaleCurrency';
import { LocaleSelector } from '~/components/ui/LocaleSelector';
import { useRouter } from 'next/router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ResponsiveButton } from '~/components/ui/ResponsiveButton';

// --- Type Definitions ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type SettingsData = RouterOutput['settings']['get'];
type SettingUpdateInput = inferRouterInputs<AppRouter>['settings']['update'] & {
  locale?: string;
  currency?: string;
};

// --- Helper Functions ---

// Helper function to process fetched data for the form state
// Ensures numeric fields are numbers and handles nulls/undefined
const processSettingsForForm = (data: SettingsData): SettingUpdateInput => {
  return {
    companyName: data.companyName,
    companyEmail: data.companyEmail,
    companyPhone: data.companyPhone,
    companyAddress: data.companyAddress,
    emailNotifications: data.emailNotifications,
    quoteNotifications: data.quoteNotifications,
    taskNotifications: data.taskNotifications,
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
  const { currentLocale } = useI18n();
  const { syncLocaleCurrency } = useLocaleCurrency();
  const router = useRouter();

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

      // 4. Clear validation errors on successful save
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

  const handleFormChange = (
    field: keyof SettingUpdateInput,
    value: string | number | boolean | undefined
  ) => {
    if (!formState) {
      return;
    }

    let processedValue: string | number | boolean | undefined = value;

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
  };

  const handleSave = async () => {
    if (!formState) {
      toast.error(t('settings.loadError'));
      return;
    }

    updateSettingsMutation.mutate(formState);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (settingsQuery.isError || !formState) {
    return (
      <div className="text-danger p-4 text-center">
        <p>{t('settings.loadError')}</p>
        <Button onPress={() => settingsQuery.refetch()} className="mt-2">
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
        <title>{t('settings.pageTitle')}</title>
      </Head>

      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <h1 className="text-primary-900 dark:text-primary-100 mb-6 text-2xl font-bold">
          {t('settings.pageTitle')}
        </h1>

        {settingsQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50/50 shadow-sm dark:bg-gray-900/20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <>
            <Tabs aria-label="Settings Options" size="lg" className="mb-6">
              <Tab key="general" title={t('settings.company.title')}>
                {formState && (
                  <Card className="mb-6 border border-gray-100 shadow-sm dark:border-gray-800">
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="text-primary-800 dark:text-primary-200 text-xl font-semibold">
                        {t('settings.company.title')}
                      </h2>
                    </CardHeader>
                    <CardBody className="gap-5 p-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Input
                            label={t('settings.company.name')}
                            value={formState.companyName ?? ''}
                            onChange={(e) => handleFormChange('companyName', e.target.value)}
                            isInvalid={!!getFieldError('companyName')}
                            errorMessage={getFieldError('companyName')}
                            classNames={{
                              label: 'text-gray-700 dark:text-gray-300 font-medium',
                            }}
                          />
                        </div>
                        <div>
                          <Input
                            label={t('settings.company.email')}
                            value={formState.companyEmail ?? ''}
                            onChange={(e) => handleFormChange('companyEmail', e.target.value)}
                            type="email"
                            isInvalid={!!getFieldError('companyEmail')}
                            errorMessage={getFieldError('companyEmail')}
                            classNames={{
                              label: 'text-gray-700 dark:text-gray-300 font-medium',
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Input
                            label={t('settings.company.phone')}
                            value={formState.companyPhone ?? ''}
                            onChange={(e) => handleFormChange('companyPhone', e.target.value)}
                            type="tel"
                            isInvalid={!!getFieldError('companyPhone')}
                            errorMessage={getFieldError('companyPhone')}
                            classNames={{
                              label: 'text-gray-700 dark:text-gray-300 font-medium',
                            }}
                          />
                        </div>
                        <div>
                          <Textarea
                            label={t('settings.company.address')}
                            value={formState.companyAddress ?? ''}
                            onChange={(e) => handleFormChange('companyAddress', e.target.value)}
                            isInvalid={!!getFieldError('companyAddress')}
                            errorMessage={getFieldError('companyAddress')}
                            classNames={{
                              label: 'text-gray-700 dark:text-gray-300 font-medium',
                            }}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </Tab>

              <Tab key="notifications" title={t('settings.notifications.title')}>
                {formState && (
                  <Card className="mb-6 border border-gray-100 shadow-sm dark:border-gray-800">
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="text-primary-800 dark:text-primary-200 text-xl font-semibold">
                        {t('settings.notifications.title')}
                      </h2>
                    </CardHeader>
                    <CardBody className="gap-5 p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">{t('settings.notifications.email')}</span>
                          <Switch
                            isSelected={formState.emailNotifications}
                            onValueChange={(value) => handleFormChange('emailNotifications', value)}
                            color="primary"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">{t('settings.notifications.quotes')}</span>
                          <Switch
                            isSelected={formState.quoteNotifications}
                            onValueChange={(value) => handleFormChange('quoteNotifications', value)}
                            color="primary"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">{t('settings.notifications.app')}</span>
                          <Switch
                            isSelected={formState.taskNotifications}
                            onValueChange={(value) => handleFormChange('taskNotifications', value)}
                            color="primary"
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </Tab>
            </Tabs>

            <div className="mt-8 flex justify-end space-x-2">
              <ResponsiveButton
                type="submit"
                color="primary"
                isLoading={updateSettingsMutation.isPending}
                icon={updateSettingsMutation.isPending ? null : <Check size={18} />}
                label={t('settings.actions.save')}
                onPress={handleSave}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}

SettingsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};
