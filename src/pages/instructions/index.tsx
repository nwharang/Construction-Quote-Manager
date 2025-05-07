import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import Head from 'next/head';
import { Card, CardBody, CardHeader, Divider, Listbox, ListboxItem } from '@heroui/react';
import { withMainLayout } from '~/utils/withAuth';
import { useTranslation } from '~/hooks/useTranslation';
import { routes } from '~/config/routes';
import type { NextPageWithLayout } from '~/types/next';
import { APP_NAME } from '~/config/constants';
import type { GetStaticPropsContext } from 'next';
import type { TranslationKey } from '~/types/i18n/keys';

interface InstructionTopic {
  slug: string;
  title: string;
  description?: string;
}

interface InstructionsIndexPageProps {
  topics: InstructionTopic[];
}

const InstructionsIndexPage: NextPageWithLayout<InstructionsIndexPageProps> = ({ topics }) => {
  const { t } = useTranslation();
  const pageTitle = `${t('instructions.pageTitle')} | ${APP_NAME}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <div className="mb-4 sm:mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('instructions.pageTitle')}
        </h1>
        <span className="text-gray-600 dark:text-gray-400">{t('instructions.description')}</span>
      </div>
      <Card>
        <CardBody>
          <Listbox aria-label="Instruction Topics" items={topics} variant="flat" className="p-0">
            {(item) => (
              <ListboxItem
                key={item.slug}
                href={`/instructions/${item.slug}`}
                as={Link}
                className="mb-2 data-[hover=true]:bg-default-100/80 dark:data-[hover=true]:bg-default-50/20 border border-gray-200 p-3 dark:border-gray-700"
              >
                <span className="text-primary text-base font-medium">{item.title}</span>
                {item.description && (
                  <p className="text-default-600 dark:text-default-400 mt-1 text-sm">
                    {item.description}
                  </p>
                )}
              </ListboxItem>
            )}
          </Listbox>
        </CardBody>
      </Card>
    </>
  );
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const instructionsDir = path.join(process.cwd(), 'src/instructions');
  let topics: InstructionTopic[] = [];
  try {
    const filenames = fs.readdirSync(instructionsDir);
    topics = filenames
      .filter((filename) => filename.endsWith('.md'))
      .map((filename) => {
        const slug = filename.replace(/\.md$/, '');
        const locale = context.locale || context.defaultLocale || 'en';
        const filePath = path.join(instructionsDir, locale, filename);
        let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        let description = '';
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const firstLine = fileContent.split('\n')[0];
          if (firstLine?.startsWith('# ')) {
            title = firstLine.substring(2).trim();
          }
          const lines = fileContent.split('\n');
          let h1Found = false;
          for (const line of lines) {
            if (line.startsWith('# ')) {
              h1Found = true;
              continue;
            }
            if (h1Found && line.trim().length > 0 && !line.startsWith('#')) {
              description = line.trim();
              break;
            }
          }
        } catch (e) {
          console.warn(`Could not read ${filePath} for title/description.`);
        }
        return { slug, title, description };
      });
  } catch (error) {
    console.error('Error reading instructions directory:', error);
    // Return empty topics array or handle error as needed
  }

  return {
    props: {
      topics,
    },
  };
};

export default withMainLayout(InstructionsIndexPage);
