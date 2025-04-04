import React from 'react';
import { type NextPage } from 'next';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '~/utils/api';
import { routes } from '~/config/routes';
import { Card, CardBody, CardHeader, Input, Button, Link, CardFooter } from '@heroui/react';
import { withAuthLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';

type UserRole = 'contractor' | 'subcontractor' | 'supplier' | 'other';

const SignUp: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'contractor' as UserRole,
    acceptTerms: false,
    receiveUpdates: false,
  });
  const [error, setError] = useState('');
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
      } else {
        await router.push(routes.admin.dashboard);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
    } catch {
      setError(t('auth.signUp.errorUnexpected'));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">{t('auth.signUp.title')}</h2>
        <p className="text-sm text-gray-500">{t('auth.signUp.subtitle')}</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Input
            label={t('auth.signUp.nameLabel')}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            isRequired
          />
          <Input
            label={t('auth.signUp.emailLabel')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isRequired
          />
          <Input
            label={t('auth.signUp.passwordLabel')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isRequired
            description={t('auth.signUp.passwordHint', { min: 8 })}
          />
          <Input
            label={t('auth.signUp.confirmPasswordLabel')}
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            isRequired
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
            <Link href={routes.auth.signIn} className="text-sm underline hover:opacity-100">
              {t('auth.signUp.signInLink')}
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Remove static title pass from HOC - Title should be set via Head component or similar
const SignUpPageWithLayout = withAuthLayout(SignUp);
export default SignUpPageWithLayout;
