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
import { Save, Palette, Settings as SettingsIcon, Bell } from 'lucide-react';
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

// --- Type Definitions ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type SettingsData = RouterOutput['settings']['get'];
type SettingUpdateInput = inferRouterInputs<AppRouter>['settings']['update'];

// --- Helper Functions ---

// Helper function to process fetched data for the form state
// Ensures numeric fields are numbers and handles nulls/undefined
const processSettingsForForm = (data: SettingsData): SettingUpdateInput => {
  return {
    companyName: data.companyName ?? '',
    companyEmail: data.companyEmail ?? '',
    companyPhone: data.companyPhone ?? '', // Keep as string for input, Zod handles optional
    companyAddress: data.companyAddress ?? '', // Keep as string for input, Zod handles optional
    emailNotifications: data.emailNotifications ?? true,
    quoteNotifications: data.quoteNotifications ?? true,
    taskNotifications: data.taskNotifications ?? true,
  };
};

/**
 * Settings page component for user preferences
 */
export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const toast = useAppToast();
  const { setSettings: setStoreSettings } = useConfigStore();

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

    if (!formState.companyName || !formState.companyEmail) {
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
        <title>Settings</title>
      </Head>

      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <h1 className="text-primary-900 dark:text-primary-100 mb-6 text-2xl font-bold">Settings</h1>

        {settingsQuery.isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50/50 shadow-sm dark:bg-gray-900/20">
            <Spinner size="lg" color="primary" />
          </div>
        ) : (
          <>
            <Tabs aria-label="Settings Options" size="lg" className="mb-6">
              <Tab key="general" title="General">
                {formState && (
                  <Card className="mb-6 border border-gray-100 shadow-sm dark:border-gray-800">
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="text-primary-800 dark:text-primary-200 text-xl font-semibold">
                        Company Information
                      </h2>
                    </CardHeader>
                    <CardBody className="gap-5 p-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Input
                            label="Company Name"
                            value={formState.companyName}
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
                            label="Company Email"
                            value={formState.companyEmail}
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
                            label="Company Phone"
                            value={formState.companyPhone}
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
                            label="Company Address"
                            value={formState.companyAddress}
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

              <Tab key="notifications" title="Notifications">
                {formState && (
                  <Card className="mb-6 border border-gray-100 shadow-sm dark:border-gray-800">
                    <CardHeader className="flex items-center justify-between">
                      <h2 className="text-primary-800 dark:text-primary-200 text-xl font-semibold">
                        Notification Preferences
                      </h2>
                    </CardHeader>
                    <CardBody className="gap-5 p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">Email Notifications</span>
                          <Switch
                            isSelected={formState.emailNotifications}
                            onValueChange={(value) => handleFormChange('emailNotifications', value)}
                            color="primary"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">Quote Notifications</span>
                          <Switch
                            isSelected={formState.quoteNotifications}
                            onValueChange={(value) => handleFormChange('quoteNotifications', value)}
                            color="primary"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/20">
                          <span className="font-medium">Task Notifications</span>
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

            {formState && (
              <div className="flex justify-end gap-3 rounded-lg bg-gray-50/80 p-4 shadow-sm dark:bg-gray-800/20">
                <Button
                  variant="flat"
                  color="danger"
                  onClick={handleCancel}
                  isDisabled={updateSettingsMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  startContent={<Save className="h-5 w-5" />}
                  onClick={handleSave}
                  isLoading={updateSettingsMutation.isPending}
                  isDisabled={updateSettingsMutation.isPending}
                  className="px-6"
                >
                  Save
                </Button>
              </div>
            )}
          </>
        )}
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
