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
  UserCircle,
  Lock,
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
import { ResponsiveButton } from '~/components/ui/ResponsiveButton';
import { APP_NAME } from '~/config/constants';
import { TRPCError } from '@trpc/server';

// --- Type Definitions ---
type RouterOutput = inferRouterOutputs<AppRouter>;
type SettingsData = RouterOutput['settings']['get'];
type SettingUpdateInput = {
  companyName?: string | null;
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
};

// Zod schema for settings (company information only)
// This schema should align with what the backend expects for these fields.
// For simplicity, we'll assume basic string validations. More specific ones can be added.
const companySettingsSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name too long')
    .nullable()
    .optional(),
  companyEmail: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .nullable()
    .optional(),
  companyPhone: z.string().max(50, 'Phone number too long').nullable().optional(),
  companyAddress: z.string().max(500, 'Address too long').nullable().optional(),
});

// --- Helper Functions ---

// Helper function to process fetched data for the form state
// Ensures only company settings are handled
const processSettingsForForm = (data: SettingsData): SettingUpdateInput => {
  return {
    companyName: data.companyName,
    companyEmail: data.companyEmail,
    companyPhone: data.companyPhone,
    companyAddress: data.companyAddress,
    // Removed notification fields
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

  // Fetch settings
  const settingsQuery = api.settings.get.useQuery(undefined, {
    enabled: !!session,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // API mutations
  const utils = api.useUtils(); // Ensure utils is defined
  const updateSettingsMutation = api.settings.update.useMutation({
    onSuccess: (updatedSettings) => {
      // 1. Update Zustand store with what was saved
      setStoreSettings(updatedSettings as SettingsData);

      // 2. Invalidate relevant queries
      utils.settings.get.invalidate();

      // 3. Show success toast
      toast.success(t('settings.saveSuccess')); // Removed unique timestamp for simplicity

      // 4. Clear validation errors on successful save
      setValidationErrors([]);
    },
    onError: (error) => {
      // Try to parse Zod errors from the backend response
      const zodError = error.data?.zodError;
      if (zodError?.fieldErrors || zodError?.formErrors) {
        const issues: ZodIssue[] = [];
        if (zodError.fieldErrors) {
          for (const field in zodError.fieldErrors) {
            const fieldMessages = zodError.fieldErrors[field];
            if (fieldMessages) {
              fieldMessages.forEach((message) => {
                issues.push({ code: z.ZodIssueCode.custom, path: [field], message });
              });
            }
          }
        }
        if (zodError.formErrors) {
          zodError.formErrors.forEach((message) => {
            issues.push({ code: z.ZodIssueCode.custom, path: [], message });
          });
        }
        setValidationErrors(issues);
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

      // Update local form state first
      setFormState(processSettingsForForm(settingsQuery.data));

      // Update the Zustand store with the *complete* fetched data
      setStoreSettings(settingsQuery.data);
    }
    // Add setStoreSettings dependency
  }, [settingsQuery.data, setStoreSettings]);

  // Effect to handle fetch errors
  useEffect(() => {
    if (settingsQuery.error) {
      toast.error(t('settings.fetchError', { message: settingsQuery.error.message }));
      // Initialize formState with empty strings if fetch fails, to allow input
      setFormState({
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
      });
    }
  }, [settingsQuery.error, toast, t]);

  const handleFormChange = (
    field: keyof SettingUpdateInput,
    value: string | undefined // All company fields are strings or null
  ) => {
    if (formState === null && !settingsQuery.isLoading && !settingsQuery.error) {
      // If formState is null and we are not loading and there's no error,
      // it means initial data hasn't arrived or was null. Initialize it.
      setFormState((prevState) => ({
        ...prevState, // spread an empty object if prevState is null initially
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        [field]: value,
      }));
      return;
    }

    if (formState === null && (settingsQuery.isLoading || settingsQuery.error)) {
      // Still loading or error already handled (which initializes formState)
      // Prevent updates until formState is initialized.
      return;
    }

    setFormState((prevState) => ({
      ...(prevState ?? {}), // Ensure prevState is not null
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formState) {
      toast.error(t('settings.loadError'));
      return;
    }

    // Client-side validation before submitting
    const validationResult = companySettingsSchema.safeParse(formState);
    if (!validationResult.success) {
      setValidationErrors(validationResult.error.issues);
      toast.error(t('settings.validationError'));
      return;
    }
    // Clear previous errors if validation passes
    setValidationErrors([]);
    updateSettingsMutation.mutate(validationResult.data);
  };

  const getFieldError = (field: keyof SettingUpdateInput): string | undefined => {
    return validationErrors.find((err) => err.path.includes(field))?.message;
  };

  if (settingsQuery.isLoading && formState === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (!session) {
    // This case might already be handled by MainLayout or a higher-order component
    // If not, and session is strictly required, this is a good place for it.
    // For now, assuming MainLayout handles auth redirection if session is null.
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (settingsQuery.isError && !formState) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <p className="text-danger-500 mb-4 text-lg">{t('settings.fetchErrorTitle')}</p>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          {t('settings.fetchErrorDetail', {
            message: settingsQuery.error?.message || 'Unknown error',
          })}
        </p>
        <Button color="primary" onClick={() => settingsQuery.refetch()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {t('settings.pageTitle')} | {APP_NAME}
        </title>
      </Head>
      <div className="mx-auto">
        <h1 className="mb-6 text-2xl font-bold">{t('settings.pageTitle')}</h1>

        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <CardHeader>
              <h2 className="pl-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                {t('settings.company.title')}
              </h2>
            </CardHeader>
            <CardBody className="space-y-6 p-6">
              <Input
                label={t('settings.company.nameLabel')}
                placeholder={t('settings.company.namePlaceholder')}
                value={formState?.companyName ?? ''}
                onValueChange={(val) => handleFormChange('companyName', val)}
                errorMessage={getFieldError('companyName')}
                isInvalid={!!getFieldError('companyName')}
                maxLength={255}
              />
              <Input
                label={t('settings.company.emailLabel')}
                type="email"
                placeholder={t('settings.company.emailPlaceholder')}
                value={formState?.companyEmail ?? ''}
                onValueChange={(val) => handleFormChange('companyEmail', val)}
                errorMessage={getFieldError('companyEmail')}
                isInvalid={!!getFieldError('companyEmail')}
                maxLength={255}
              />
              <Input
                label={t('settings.company.phoneLabel')}
                placeholder={t('settings.company.phonePlaceholder')}
                value={formState?.companyPhone ?? ''}
                onValueChange={(val) => handleFormChange('companyPhone', val)}
                errorMessage={getFieldError('companyPhone')}
                isInvalid={!!getFieldError('companyPhone')}
                maxLength={50}
              />
              <Textarea
                label={t('settings.company.addressLabel')}
                placeholder={t('settings.company.addressPlaceholder')}
                value={formState?.companyAddress ?? ''}
                onValueChange={(val) => handleFormChange('companyAddress', val)}
                errorMessage={getFieldError('companyAddress')}
                isInvalid={!!getFieldError('companyAddress')}
                maxLength={500}
                minRows={3}
              />
              <Divider />
            </CardBody>
            <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/20">
              <ResponsiveButton
                type="submit"
                color="primary"
                isLoading={updateSettingsMutation.isPending}
                icon={<Save size={18} />}
                label={t('settings.actions.save')}
              >
                {t('settings.actions.save')}
              </ResponsiveButton>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}

SettingsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
