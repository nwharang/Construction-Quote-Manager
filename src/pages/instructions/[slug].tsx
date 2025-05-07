import React from 'react';
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps, GetStaticPaths } from 'next';
import ReactMarkdown from 'react-markdown';
import { Card, CardBody, CardHeader, Breadcrumbs, BreadcrumbItem, Button } from '@heroui/react';
import { withMainLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import type { NextPageWithLayout } from '~/types/next';
import { APP_NAME } from '~/config/constants';
import { routes } from '~/config/routes';
import { ArrowLeft } from 'lucide-react';

interface InstructionDetailPageProps {
  slug: string;
  title: string;
  content: string;
}

const InstructionDetailPage: NextPageWithLayout<InstructionDetailPageProps> = ({
  slug,
  title,
  content,
}) => {
  const { t } = useTranslation();
  const pageTitle = `${title} | ${t('instructions.pageTitle')} | ${APP_NAME}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <div className="mx-auto flex size-full flex-col gap-4">
        <div className="flex justify-between">
          <Button as={Link} href={routes.instruction.list} variant="light">
            <ArrowLeft size={16} />
            {t('common.back')}
          </Button>
        </div>
        <Card>
          <CardBody>
            <article className="prose prose-sm dark:prose-invert max-w-none p-3">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async (context) => {
  const instructionsDir = path.join(process.cwd(), 'src/instructions');
  const locales = context.locales || [];
  let paths: Array<{ params: { slug: string }; locale: string }> = [];

  for (const locale of locales) {
    try {
      const localeSpecificDir = path.join(instructionsDir, locale);
      if (fs.existsSync(localeSpecificDir)) {
        const filenames = fs.readdirSync(localeSpecificDir);
        filenames
          .filter((filename) => filename.endsWith('.md'))
          .forEach((filename) => {
            paths.push({
              params: { slug: filename.replace(/\.md$/, '') },
              locale: locale,
            });
          });
      }
    } catch (error) {
      console.error(`Error reading instructions directory for locale ${locale} paths:`, error);
    }
  }

  return {
    paths,
    fallback: false, // Means other routes should 404
  };
};

export const getStaticProps: GetStaticProps<InstructionDetailPageProps, { slug: string }> = async (
  context
) => {
  const slug = context.params?.slug;
  const locale = context.locale || context.defaultLocale || 'en';

  if (!slug) {
    return { notFound: true };
  }

  const filePath = path.join(process.cwd(), 'src/instructions', locale, `${slug}.md`);
  let content = '';
  let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  try {
    content = fs.readFileSync(filePath, 'utf8');
    const firstLine = content.split('\n')[0];
    if (firstLine?.startsWith('## ')) {
      title = firstLine.substring(2).trim();
    }
  } catch (error) {
    console.error(`Error reading instruction file ${locale}/${slug}.md:`, error);
    return { notFound: true };
  }

  return {
    props: {
      slug,
      title,
      content,
    },
  };
};

export default withMainLayout(InstructionDetailPage);
