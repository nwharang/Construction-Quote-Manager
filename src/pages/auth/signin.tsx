import React from 'react';
import { type NextPage } from 'next';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { routes } from '~/config/routes';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Link,
  CardFooter,
  Alert,
} from '@heroui/react';
import { withAuthLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '~/hooks/useI18n';

const SignIn: NextPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentLocale } = useI18n();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError(t('auth.signIn.errorRequiredFields'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          const urlError = router.query.error;
          if (urlError === 'CredentialsSignin') {
            setError(t('auth.signIn.errorInvalidCredentials'));
          } else {
            setError(t('auth.signIn.errorInvalidCredentials'));
          }
        } else {
          setError(t('auth.signIn.errorUnexpected'));
        }
        setIsLoading(false);
      } else if (result?.ok) {
        await router.push(routes.admin.dashboard, routes.admin.dashboard, { locale: currentLocale });
      } else {
        setError(t('auth.signIn.errorUnexpected'));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setError(t('auth.signIn.errorUnexpected'));
      setIsLoading(false);
    }
  };

  // Handle navigation to sign up page with locale preservation
  const handleSignUpClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(routes.auth.signUp, routes.auth.signUp, { locale: currentLocale });
  };

  return (
    <Card className="w-full max-w-md" data-testid="signin-form">
      <CardHeader className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold" data-testid="signin-title">{t('auth.signIn.title')}</h2>
        <p className="text-sm text-gray-500">{t('auth.signIn.subtitle')}</p>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert color="danger" icon={<AlertTriangle size={18} />} className="mb-4" data-testid="signin-error">
              {error}
            </Alert>
          )}
          <Input
            label={t('auth.signIn.emailLabel')}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            isRequired
            disabled={isLoading}
            data-testid="email-input"
          />
          <Input
            label={t('auth.signIn.passwordLabel')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            isRequired
            disabled={isLoading}
            data-testid="password-input"
          />
          <Button 
            type="submit" 
            color="primary" 
            className="w-full" 
            isLoading={isLoading}
            data-testid="signin-button"
          >
            {t('auth.signIn.submitButton')}
          </Button>
        </form>
      </CardBody>
      <CardFooter>
        <div className="relative z-10">
          <p className="text-sm opacity-80">
            {t('auth.signIn.signUpPrompt')}{' '}
            <a 
              href="#" 
              onClick={handleSignUpClick} 
              className="text-sm underline hover:opacity-100"
              data-testid="signup-link"
            >
              {t('auth.signIn.signUpLink')}
            </a>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

// Pass translated title to HOC
const SignInPageWithLayout = withAuthLayout(SignIn);
export default SignInPageWithLayout;
