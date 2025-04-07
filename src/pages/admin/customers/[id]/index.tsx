import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { routes } from '~/config/routes';
import { Spinner } from '@heroui/react';

export default function CustomerRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;

  useEffect(() => {
    if (customerId) {
      router.replace(routes.admin.customers.detail(customerId));
    }
  }, [customerId, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" color="primary" />
    </div>
  );
} 