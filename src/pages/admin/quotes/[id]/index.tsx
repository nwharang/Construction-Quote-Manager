import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Spinner } from '@heroui/react';
import { routes } from '~/config/routes';

export default function QuoteRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      // Redirect to the view page
      router.replace(routes.admin.quotes.detail(id as string));
    }
  }, [id, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
} 