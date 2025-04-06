import React from 'react';
import { type NextPage } from 'next';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Card, CardBody, CardHeader, Input, Button, Link, CardFooter, Alert } from '@heroui/react';
import { withAuthLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '~/hooks/useI18n';

type UserRole = 'contractor' | 'subcontractor' | 'supplier' | 'other';

const SignUp: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentLocale } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'contractor' as UserRole,
    acceptTerms: false,
    receiveUpdates: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutation for registration
  const { mutate: register } = api.auth.register.useMutation({
    onSuccess: async () => {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.signUp.errorSignInFailed'));
        setIsLoading(false);
      } else if (result?.ok) {
        await router.push(routes.admin.dashboard);
      } else {
        setError(t('auth.signUp.errorSignInFailed'));
        setIsLoading(false);
      }
    },
    onError: (error) => {
      setError(error.message || t('auth.signUp.errorUnexpected'));
      setIsLoading(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.signUp.errorPasswordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 8) {
      setError(t('auth.signUp.errorPasswordTooShort', { min: 8 }));
      return;
    }

    setIsLoading(true);

    try {
      // Call tRPC register mutation
      register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      console.error("Sign up form error:", err);
      setError(t('auth.signUp.errorUnexpected'));
      setIsLoading(false);
    }
  };

  // Handle navigation to sign in page with locale preservation
  const handleSignInClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(routes.auth.signIn, routes.auth.signIn, { locale: currentLocale });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">{t('auth.signUp.title')}</h2>
        <p className="text-sm text-gray-500">{t('auth.signUp.subtitle')}</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert color="danger" icon={<AlertTriangle size={18} />} className="mb-4">
              {error}
            </Alert>
          )}
          <Input
            label={t('auth.signUp.nameLabel')}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            isRequired
            disabled={isLoading}
          />
          <Input
            label={t('auth.signUp.emailLabel')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isRequired
            disabled={isLoading}
          />
          <Input
            label={t('auth.signUp.passwordLabel')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isRequired
            description={t('auth.signUp.passwordHint', { min: 8 })}
            disabled={isLoading}
          />
          <Input
            label={t('auth.signUp.confirmPasswordLabel')}
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            isRequired
            disabled={isLoading}
          />

          <Button type="submit" color="primary" className="w-full" isLoading={isLoading}>
            {t('auth.signUp.submitButton')}
          </Button>
        </form>
      </CardBody>
      <CardFooter>
        <div className="relative z-10">
          <p className="text-sm opacity-80">
            {t('auth.signUp.signInPrompt')}{' '}
            <a href="#" onClick={handleSignInClick} className="text-sm underline hover:opacity-100">
              {t('auth.signUp.signInLink')}
            </a>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Remove static title pass from HOC - Title should be set via Head component or similar
const SignUpPageWithLayout = withAuthLayout(SignUp);
export default SignUpPageWithLayout;
