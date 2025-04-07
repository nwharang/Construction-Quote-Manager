import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { routes } from '~/config/routes';
import { Spinner } from '@heroui/react';

export default function CategoryRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params?.id as string;

  useEffect(() => {
    if (categoryId) {
      router.replace(routes.admin.categories.detail(categoryId));
    }
  }, [categoryId, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" color="primary" />
    </div>
  );
} 