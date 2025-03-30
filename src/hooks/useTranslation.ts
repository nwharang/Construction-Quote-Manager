/**
 * @deprecated - Use `useTranslation` from `~/utils/i18n` directly
 */

import { useTranslation as useNewTranslation } from '~/utils/i18n';

export const useTranslation = useNewTranslation;

// Export the hook with the same interface as before
export default useTranslation; 