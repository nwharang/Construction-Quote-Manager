// --- Parameter Interfaces & Types --- //

export interface NoParams {} // For keys with no parameters

// Superset of all possible parameters
interface AllPossibleParams {
  field?: string;
  min?: number;
  year?: number;
  message?: string;
  id?: string;
  theme?: string;
  date?: string;
}

// Specific parameter types using Pick
export type FieldParams = Pick<AllPossibleParams, 'field'>;
export type MinParams = Pick<AllPossibleParams, 'min'>;
export type YearParams = Pick<AllPossibleParams, 'year'>;
export type MessageParams = Pick<AllPossibleParams, 'message'>;
export type IdParams = Pick<AllPossibleParams, 'id'>;
export type ThemeParams = Pick<AllPossibleParams, 'theme'>;
export type DateParams = Pick<AllPossibleParams, 'date'>;

// --- Grouped Key Types --- //

import type { QuoteStatusType } from '~/server/db/schema';

// Combine all keys into a single type for use with useTranslation
export type TranslationKey =
  | 'appName'
  | 'auth.login'
  | 'auth.signIn.emailLabel'
  | 'auth.signIn.errorInvalidCredentials'
  | 'auth.signIn.errorRequiredFields'
  | 'auth.signIn.errorUnexpected'
  | 'auth.signIn.passwordLabel'
  | 'auth.signIn.signUpLink'
  | 'auth.signIn.signUpPrompt'
  | 'auth.signIn.submitButton'
  | 'auth.signIn.subtitle'
  | 'auth.signIn.title'
  | 'auth.signUp.confirmPasswordLabel'
  | 'auth.signUp.emailLabel'
  | 'auth.signUp.errorPasswordsDoNotMatch'
  | 'auth.signUp.errorPasswordTooShort' // Params: { min: number }
  | 'auth.signUp.errorSignInFailed'
  | 'auth.signUp.errorUnexpected'
  | 'auth.signUp.nameLabel'
  | 'auth.signUp.passwordHint' // Params: { min: number }
  | 'auth.signUp.passwordLabel'
  | 'auth.signUp.signInLink'
  | 'auth.signUp.signInPrompt'
  | 'auth.signUp.submitButton'
  | 'auth.signUp.subtitle'
  | 'auth.signUp.title'
  | 'button.cancel'
  | 'button.create'
  | 'common.actions'
  | 'common.add'
  | 'common.back'
  | 'common.cancel'
  | 'common.close'
  | 'common.closeSidebar'
  | 'common.create'
  | 'common.delete'
  | 'common.edit'
  | 'common.error'
  | 'common.export'
  | 'common.loading'
  | 'common.menu'
  | 'common.noDataAvailable'
  | 'common.noDescription'
  | 'common.noResults'
  | 'common.noSKU'
  | 'common.notAvailable'
  | 'common.openMenu'
  | 'common.print'
  | 'common.removeMaterial'
  | 'common.removeTask'
  | 'common.retry'
  | 'common.saveChanges'
  | 'common.search'
  | 'common.status'
  | 'common.unknown'
  | 'common.update'
  | 'common.user'
  | 'common.view'
  | 'customers.contact'
  | 'customers.createError'
  | 'customers.createSuccess'
  | 'customers.deleteError'
  | 'customers.deleteSuccess'
  | 'customers.list.created'
  | 'customers.list.email'
  | 'customers.list.name'
  | 'customers.list.phone'
  | 'customers.list.searchPlaceholder'
  | 'customers.list.title'
  | 'customers.new'
  | 'customers.searchPlaceholder'
  | 'customers.title'
  | 'customers.updateError'
  | 'customers.updateSuccess'
  | 'errors.requiredFieldsMissing'
  | 'footer.allRightsReserved'
  | 'footer.copyright' // Params: { year: number }
  | 'nav.customers'
  | 'nav.dashboard'
  | 'nav.products'
  | 'nav.quotes'
  | 'print.document'
  | 'print.generatedOn' // Params: { date: string }
  | 'print.printNow'
  | 'productFields.category'
  | 'productFields.description'
  | 'productFields.location'
  | 'productFields.manufacturer'
  | 'productFields.name'
  | 'productFields.notes'
  | 'productFields.sku'
  | 'productFields.supplier'
  | 'productFields.unit'
  | 'productFields.unitPrice'
  | 'productPlaceholders.category'
  | 'productPlaceholders.description'
  | 'productPlaceholders.location'
  | 'productPlaceholders.manufacturer'
  | 'productPlaceholders.name'
  | 'productPlaceholders.notes'
  | 'productPlaceholders.sku'
  | 'productPlaceholders.supplier'
  | 'productPlaceholders.unit'
  | 'products.actionsLabel'
  | 'products.createError'
  | 'products.createModalTitle'
  | 'products.createSuccess'
  | 'products.deleteError'
  | 'products.deleteSuccess'
  | 'products.editModalTitle'
  | 'products.entityName'
  | 'products.list.category'
  | 'products.list.id'
  | 'products.list.name'
  | 'products.list.price'
  | 'products.new'
  | 'products.noProductsFound'
  | 'products.searchPlaceholder'
  | 'products.tableLabel'
  | 'products.title'
  | 'products.updateError'
  | 'products.updateSuccess'
  | 'products.viewModalTitle'
  | 'quoteSummary.grandTotal'
  | 'quoteSummary.markup'
  | 'quoteSummary.markupCalculated'
  | 'quoteSummary.markupInputLabel'
  | 'quoteSummary.subtotalCombined'
  | 'quoteSummary.subtotalMaterials'
  | 'quoteSummary.subtotalTasks'
  | 'quoteSummary.tax'
  | 'quoteSummary.title'
  | 'quotes.addMaterialButton'
  | 'quotes.addTaskButton'
  | 'quotes.createButton'
  | 'quotes.createError'
  | 'quotes.createModalTitle'
  | 'quotes.createSuccess'
  | 'quotes.createdDateLabel'
  | 'quotes.customerLabel'
  | 'quotes.date'
  | 'quotes.deleteError' // Params: { message: string }
  | 'quotes.deleteSuccess'
  | 'quotes.detailsSectionTitle'
  | 'quotes.editModalTitle'
  | 'quotes.entityName'
  | 'quotes.estimatedMaterialCostLumpSumLabel'
  | 'quotes.fields.customer'
  | 'quotes.fields.notes'
  | 'quotes.fields.title'
  | 'quotes.id'
  | 'quotes.list.created'
  | 'quotes.list.customer'
  | 'quotes.list.header'
  | 'quotes.list.id'
  | 'quotes.list.noQuotesFound'
  | 'quotes.list.status'
  | 'quotes.list.title'
  | 'quotes.list.total'
  | 'quotes.loadError'
  | 'quotes.materialLineTotalHeader'
  | 'quotes.materialNotesHeader'
  | 'quotes.materialProductIdHeader'
  | 'quotes.materialProductIdLabel'
  | 'quotes.materialQuantityHeader'
  | 'quotes.materialQuantityLabel'
  | 'quotes.materialTypeItemized'
  | 'quotes.materialTypeLabel'
  | 'quotes.materialTypeLumpSum'
  | 'quotes.materialUnitPriceHeader'
  | 'quotes.materialUnitPriceLabel'
  | 'quotes.materialsSectionTitle'
  | 'quotes.noMaterialsAdded'
  | 'quotes.noMaterialsForItemized'
  | 'quotes.noTasksAdded'
  | 'quotes.noTasksAddedEditable'
  | 'quotes.noTasksAddedReadOnly'
  | 'quotes.notesLabel'
  | 'quotes.placeholders.notes'
  | 'quotes.placeholders.selectCustomer'
  | 'quotes.placeholders.title'
  | 'quotes.print.title' // Params: { id: string }
  | 'quotes.status.accepted' // Added for QuoteStatusSettings
  | 'quotes.status.draft' // Added for QuoteStatusSettings
  | 'quotes.status.rejected' // Added for QuoteStatusSettings
  | 'quotes.status.sent' // Added for QuoteStatusSettings
  | 'quotes.taskDescriptionLabel'
  | 'quotes.taskDescriptionPlaceholder'
  | 'quotes.taskPriceLabel'
  | 'quotes.tasksSectionTitle'
  | 'quotes.titleLabel'
  | 'quotes.updateErrorToast'
  | 'quotes.updateSuccessToast'
  | 'quotes.validation.titleRequired' // Params: { field: string }
  | 'quotes.validation.customerRequired' // Params: { field: string }
  | 'quotes.viewModalTitle'
  | 'settings.appearance'
  | 'settings.changeTheme'
  | 'settings.changeThemeTitle' // Params: { theme: string }
  | 'settings.companyAddress'
  | 'settings.companyEmail'
  | 'settings.companyInfo'
  | 'settings.companyName'
  | 'settings.companyPhone'
  | 'settings.currency'
  | 'settings.darkMode'
  | 'settings.dateFormat'
  | 'settings.dateFormatDescription'
  | 'settings.defaultComplexityCharge'
  | 'settings.defaultMarkupCharge'
  | 'settings.defaultMaterialPrice'
  | 'settings.defaultTaskPrice'
  | 'settings.emailNotifications'
  | 'settings.emailNotificationsDescription'
  | 'settings.fetchError' // Params: { message: string }
  | 'settings.general'
  | 'settings.language'
  | 'settings.languageDescription'
  | 'settings.loadError'
  | 'settings.localization'
  | 'settings.notificationPreferences'
  | 'settings.notifications'
  | 'settings.quoteDefaults'
  | 'settings.quoteNotifications'
  | 'settings.quoteNotificationsDescription'
  | 'settings.saveError' // Params: { message: string }
  | 'settings.saveSuccess'
  | 'settings.selectLanguage'
  | 'settings.selectLanguagePlaceholder'
  | 'settings.taskNotifications'
  | 'settings.taskNotificationsDescription'
  | 'settings.theme'
  | 'settings.timeFormat'
  | 'settings.timeFormatDescription'
  | 'settings.title'
  | 'settings.validationError'
  | 'userMenu.profile'
  | 'userMenu.settings'
  | 'userMenu.signOut'
  | 'userMenu.title'
  | 'validation.required'
  | 'validation.selectOption'
  | 'validation.minValue' // Params: { min: number }
  | 'quotes.materialProductLabel'
  | 'quotes.materialProductPlaceholder';

// --- Conditional Mapping Type --- //

// Maps a TranslationKey to its specific parameter type
export type KeyToParams<K extends TranslationKey> = K extends
  | 'quotes.validation.titleRequired'
  | 'quotes.validation.customerRequired'
  ? FieldParams
  : K extends
        | 'auth.signUp.errorPasswordTooShort'
        | 'auth.signUp.passwordHint'
        | 'validation.minValue'
    ? MinParams
    : K extends 'footer.copyright'
      ? YearParams
      : K extends
            | 'customers.createError'
            | 'customers.deleteError'
            | 'customers.updateError'
            | 'products.createError'
            | 'products.deleteError'
            | 'products.updateError'
            | 'quotes.deleteError'
            | 'settings.saveError'
            | 'settings.fetchError'
        ? MessageParams
        : K extends 'quotes.print.title'
          ? IdParams
          : K extends 'settings.changeThemeTitle'
            ? ThemeParams
            : K extends 'print.generatedOn'
              ? DateParams
              : // Default to NoParams for keys without specific parameters
                NoParams;

// --- Helper Types for Overloading --- //

// Extracts keys that require specific parameters (i.e., KeyToParams<K> is not NoParams)
export type KeysWithParams = {
  [K in TranslationKey]: KeyToParams<K> extends NoParams ? never : K;
}[TranslationKey];

// Extracts keys that do not require specific parameters (i.e., KeyToParams<K> is NoParams)
export type KeysWithoutParams = {
  [K in TranslationKey]: KeyToParams<K> extends NoParams ? K : never;
}[TranslationKey];

// --- Helper Types --- //

// Helper type for mapping QuoteStatusType to TranslationKey
// export type QuoteStatusTranslationKey = `quotes.status.${QuoteStatusType | 'unknown'}`;

// Helper type for mapping ProductCategoryType to TranslationKey

export type TranslationParams<T> = (key: TranslationKey, params: T) => string;
