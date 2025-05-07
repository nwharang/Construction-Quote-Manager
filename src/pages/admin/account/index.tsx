'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody, CardFooter, Input, Tabs, Tab, Spinner } from '@heroui/react';
import { Save } from 'lucide-react';
import { api } from '~/trpc/react';
import { MainLayout } from '~/layouts';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppToast } from '~/components/providers/ToastProvider';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ResponsiveButton } from '~/components/ui/ResponsiveButton';
import { APP_NAME } from '~/config/constants';
import type { NextPageWithLayout } from '~/types/next';
import { TRPCError } from '@trpc/server';
import { useQueryClient } from '@tanstack/react-query';
import type { updateLoginInfoRouterInputSchema } from '~/server/api/routers/auth';

// Zod schema for the Profile form
const profileFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  image: z
    .string()
    .url('Must be a valid URL')
    .max(2048, 'URL too long')
    .nullable()
    .or(z.literal(''))
    .optional(),
});
type ProfileFormData = z.infer<typeof profileFormSchema>;

// Zod schema for the Change Password form
const changePasswordFormSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });
type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

// Zod schema for the Account Info form (email/username)
const accountInfoFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .optional(), // Assuming username is distinct and optional to change
  currentPassword: z.string().min(1, 'Current password is required to change login info'),
});
type AccountInfoFormData = z.infer<typeof accountInfoFormSchema>;

// Type for the mutation payload, inferred from the router's Zod schema
type UpdateLoginInfoMutationInput = z.infer<typeof updateLoginInfoRouterInputSchema>;

const AccountSettingsPage: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();
  const toast = useAppToast();
  const queryClient = useQueryClient();

  // Fetch user profile data directly from the database
  const {
    data: userProfileData,
    isLoading: isLoadingProfileData,
    error: profileDataError,
  } = api.auth.getProfile.useQuery(
    undefined, // no input
    {
      enabled: sessionStatus === 'authenticated', // Only fetch if session is authenticated
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s (user not found for some reason) or auth errors
        if (
          error instanceof TRPCError &&
          (error.code === 'NOT_FOUND' ||
            error.code === 'UNAUTHORIZED' ||
            error.code === 'FORBIDDEN')
        ) {
          return false;
        }
        return failureCount < 2; // Retry up to 2 times for other errors
      },
    }
  );

  // --- Profile Form ---
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
    setValue: setProfileValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      image: '',
    },
  });

  useEffect(() => {
    if (userProfileData) {
      setProfileValue('name', userProfileData.name ?? '');
      setProfileValue('image', userProfileData.image ?? '');
    }
  }, [userProfileData, setProfileValue]);

  const updateProfileMutation = api.auth.updateProfile.useMutation({
    onSuccess: async (updatedDbUser) => {
      toast.success(t('account.profile.updateSuccess'));
      // Explicitly set form values from the mutation response for immediate feedback
      setProfileValue('name', updatedDbUser.name ?? '');
      setProfileValue('image', updatedDbUser.image ?? '');
      // Then update the session
      await updateSession({ name: updatedDbUser.name, image: updatedDbUser.image });
      // Invalidate the getProfile query using manual key structure
      await queryClient.invalidateQueries({ queryKey: [['auth', 'getProfile']] });
    },
    onError: (error) => {
      toast.error(t('account.profile.updateError', { message: error.message })); // Add key later
      console.error('Profile update failed:', error);
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      name: data.name,
      image: data.image || null,
    });
  };

  // --- Change Password Form ---
  const {
    register: registerPasswordChange,
    handleSubmit: handleSubmitPasswordChange,
    formState: { errors: passwordChangeErrors, isSubmitting: isSubmittingPasswordChange },
    reset: resetPasswordChangeForm,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const changePasswordMutation = api.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success(t('account.security.passwordChangeSuccess')); // Add key later
      resetPasswordChangeForm();
    },
    onError: (error) => {
      if (error instanceof TRPCError && error.code === 'UNAUTHORIZED') {
        toast.error(t('account.security.errorIncorrectOldPassword')); // Add key later
      } else {
        toast.error(t('account.security.passwordChangeError', { message: error.message })); // Add key later
      }
      console.error('Password change failed:', error);
    },
  });

  const onPasswordChangeSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  // --- Account Info Form (Email/Username) ---
  const accountInfoMethods = useForm<AccountInfoFormData>({
    resolver: zodResolver(accountInfoFormSchema),
    defaultValues: {
      email: '',
      username: '',
      currentPassword: '',
    },
  });

  useEffect(() => {
    if (userProfileData) {
      accountInfoMethods.reset({
        email: userProfileData.email ?? '',
        username: userProfileData.username ?? '',
        currentPassword: '', // Keep currentPassword blank for security
      });
    }
  }, [userProfileData, accountInfoMethods]);

  const updateLoginInfoMutation = api.auth.updateLoginInfo.useMutation({
    onSuccess: async (data) => {
      if (data.success) {
        toast.success(t('account.info.updateSuccess'));
        await updateSession();
        accountInfoMethods.reset({
          email: data.user?.email ?? accountInfoMethods.getValues('email'),
          username: data.user?.username ?? accountInfoMethods.getValues('username'),
          currentPassword: '',
        });
        // Invalidate the getProfile query using manual key structure
        await queryClient.invalidateQueries({ queryKey: [['auth', 'getProfile']] });
      } else {
        toast.error(data.message || t('account.info.updateError', { message: 'Unknown error' }));
      }
    },
    onError: (error) => {
      let errorMessage = t('account.info.updateError', { message: error.message });
      if (error.data?.code === 'UNAUTHORIZED') {
        errorMessage = t('account.info.errorIncorrectPassword');
      } else if (error.data?.code === 'CONFLICT') {
        errorMessage = t('account.info.errorConflict', { message: error.message });
      }
      toast.error(errorMessage);
      console.error('Login info update failed:', error);
    },
  });

  const onAccountInfoSubmit = (data: AccountInfoFormData) => {
    const payload: UpdateLoginInfoMutationInput = {
      email: data.email,
      username: data.username,
      currentPassword: data.currentPassword,
    };
    updateLoginInfoMutation.mutate(payload);
  };

  // Handle loading state for initial data fetch
  if (sessionStatus === 'loading' || (sessionStatus === 'authenticated' && isLoadingProfileData)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  // Handle case where session exists but profile data couldn't be fetched
  if (sessionStatus === 'authenticated' && !userProfileData && profileDataError) {
    // You could show a specific error message here, or redirect
    // For now, let's show a generic error and log it.
    console.error('Error fetching profile data:', profileDataError);
    toast.error(t('common.error.generic')); // Add a generic error key
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p>{t('common.error.failedToLoadData')}</p>
      </div>
    );
  }

  // Handle case where user is not authenticated (should be caught by layout/auth flow but good for safety)
  if (sessionStatus !== 'authenticated') {
    // This should ideally trigger a redirect to login by a higher-order component or auth guard
    // For now, showing a spinner or null, as the main layout handles redirects for unauth users.
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  // Fallback if userProfileData is somehow still undefined after loading and no error
  // This state should ideally not be reached if logic above is correct.
  if (!userProfileData) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p>{t('common.error.generic')}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>
          {t('account.pageTitle')} | {APP_NAME}
        </title>
      </Head>
      <div className="mx-auto">
        <h1 className="text-primary-900 dark:text-primary-100 mb-6 text-2xl font-bold">
          {t('account.pageTitle')}
        </h1>
        <Tabs aria-label="Account Settings Options" size="lg" className="mb-6">
          <Tab key="info" title={t('account.info.title')}>
            <Card>
              <form onSubmit={accountInfoMethods.handleSubmit(onAccountInfoSubmit)}>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {t('account.info.formTitle')}
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4 p-6">
                  <div>
                    <Input
                      label={t('account.info.emailLabel')}
                      type="email"
                      placeholder={t('account.info.emailPlaceholder')}
                      {...accountInfoMethods.register('email')}
                      key={`email-${userProfileData.email}`}
                    />
                    {accountInfoMethods.formState.errors.email && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {accountInfoMethods.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label={t('account.info.usernameLabel')}
                      placeholder={t('account.info.usernamePlaceholder')}
                      {...accountInfoMethods.register('username')}
                      key={`username-${userProfileData.username}`}
                    />
                    {accountInfoMethods.formState.errors.username && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {accountInfoMethods.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      label={t('account.info.currentPasswordLabel')}
                      type="password"
                      placeholder={t('account.info.currentPasswordPlaceholder')}
                      {...accountInfoMethods.register('currentPassword')}
                    />
                    {accountInfoMethods.formState.errors.currentPassword && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {accountInfoMethods.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                </CardBody>
                <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/20">
                  <ResponsiveButton
                    type="submit"
                    color="primary"
                    isLoading={updateLoginInfoMutation.isPending}
                    disabled={
                      updateLoginInfoMutation.isPending || !accountInfoMethods.formState.isDirty
                    }
                    icon={<Save size={18} />}
                    label={t('account.info.saveButton')}
                  >
                    {t('account.info.saveButton')}
                  </ResponsiveButton>
                </CardFooter>
              </form>
            </Card>
          </Tab>
          <Tab key="profile" title={t('account.profile.title')}>
            <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
              <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {t('account.profile.title')}
                  </h2>
                </CardHeader>
                <CardBody className="space-y-6 p-6">
                  <div>
                    <Input
                      label={t('account.profile.nameLabel')}
                      placeholder={t('account.profile.namePlaceholder')}
                      {...registerProfile('name')}
                      key={`name-${userProfileData.name}`}
                    />
                    {profileErrors.name && (
                      <p className="text-danger-500 mt-1 text-sm">{profileErrors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      label={t('account.profile.imageLabel')}
                      placeholder="https://example.com/image.png"
                      {...registerProfile('image')}
                      key={`image-${userProfileData.image}`}
                    />
                    {profileErrors.image && (
                      <p className="text-danger-500 mt-1 text-sm">{profileErrors.image.message}</p>
                    )}
                  </div>
                </CardBody>
                <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/20">
                  <ResponsiveButton
                    type="submit"
                    color="primary"
                    isLoading={isSubmittingProfile || updateProfileMutation.isPending}
                    icon={<Save size={18} />}
                    label={t('account.profile.saveButton')}
                  >
                    {t('account.profile.saveButton')}
                  </ResponsiveButton>
                </CardFooter>
              </form>
            </Card>
          </Tab>
          <Tab key="security" title={t('account.security.title')}>
            <Card className="border border-gray-100 shadow-sm dark:border-gray-800">
              <form onSubmit={handleSubmitPasswordChange(onPasswordChangeSubmit)}>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {t('account.security.changePasswordTitle')}
                  </h2>
                </CardHeader>
                <CardBody className="space-y-6 p-6">
                  <div>
                    <Input
                      label={t('account.security.oldPasswordLabel')}
                      type="password"
                      {...registerPasswordChange('oldPassword')}
                    />
                    {passwordChangeErrors.oldPassword && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {passwordChangeErrors.oldPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label={t('account.security.newPasswordLabel')}
                      type="password"
                      {...registerPasswordChange('newPassword')}
                    />
                    {passwordChangeErrors.newPassword && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {passwordChangeErrors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label={t('account.security.confirmPasswordLabel')}
                      type="password"
                      {...registerPasswordChange('confirmPassword')}
                    />
                    {passwordChangeErrors.confirmPassword && (
                      <p className="text-danger-500 mt-1 text-sm">
                        {passwordChangeErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </CardBody>
                <CardFooter className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/20">
                  <ResponsiveButton
                    type="submit"
                    color="primary"
                    isLoading={isSubmittingPasswordChange || changePasswordMutation.isPending}
                    icon={<Save size={18} />}
                    label={t('account.security.savePasswordButton')}
                  >
                    {t('account.security.savePasswordButton')}
                  </ResponsiveButton>
                </CardFooter>
              </form>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

AccountSettingsPage.getLayout = (page: React.ReactNode) => {
  return <MainLayout>{page}</MainLayout>;
};

export default AccountSettingsPage;
