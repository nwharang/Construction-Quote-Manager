import { useEffect } from 'react';
import Head from 'next/head';
import { useTranslation } from '~/utils/i18n';

/**
 * Component to update HTML language attributes for accessibility
 * This updates the document language attribute based on the current locale
 */
export function LanguageMetaData() {
  const { locale } = useTranslation();
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.setAttribute('dir', 'ltr'); // Add RTL support if needed
    }
  }, [locale]);
  
  return (
    <Head>
      <meta httpEquiv="content-language" content={locale} />
    </Head>
  );
}

export default LanguageMetaData; 