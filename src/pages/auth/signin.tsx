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

const SignIn: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // tRPC mutation for login
  const { mutate: login } = api.auth.login.useMutation({
    onSuccess: async () => {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('auth.signIn.errorInvalidCredentials'));
        setIsLoading(false);
      } else {
        await router.push(routes.admin.dashboard);
      }
    },
    onError: (error) => {
      setError(error.message || t('auth.signIn.errorUnexpected'));
      setIsLoading(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError(t('auth.signIn.errorRequiredFields'));
      return;
    }

    setIsLoading(true);

    try {
      login({
        email: formData.email,
        password: formData.password,
      });
    } catch {
      setError(t('auth.signIn.errorUnexpected'));
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold">{t('auth.signIn.title')}</h2>
        <p className="text-sm text-gray-500">{t('auth.signIn.subtitle')}</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Input
            label={t('auth.signIn.emailLabel')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isRequired
          />
          <Input
            label={t('auth.signIn.passwordLabel')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isRequired
          />
          <Button type="submit" color="primary" className="w-full" isLoading={isLoading}>
            {t('auth.signIn.submitButton')}
          </Button>
        </form>
      </CardBody>
      <CardFooter>
        <div className="relative z-10">
          <p className="text-sm opacity-80">
            {t('auth.signIn.signUpPrompt')}{' '}
            <Link href={routes.auth.signUp} className="text-sm underline hover:opacity-100">
              {t('auth.signIn.signUpLink')}
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Pass translated title to HOC
const SignInPageWithLayout = withAuthLayout(SignIn);
export default SignInPageWithLayout;
