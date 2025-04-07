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
  percent?: number;
  count?: number;
}

// Specific parameter types using Pick
export type FieldParams = Pick<AllPossibleParams, 'field'>;
export type MinParams = Pick<AllPossibleParams, 'min'>;
export type YearParams = Pick<AllPossibleParams, 'year'>;
export type MessageParams = Pick<AllPossibleParams, 'message'>;
export type IdParams = Pick<AllPossibleParams, 'id'>;
export type ThemeParams = Pick<AllPossibleParams, 'theme'>;
export type DateParams = Pick<AllPossibleParams, 'date'>;
export type PercentParams = Pick<AllPossibleParams, 'percent'>;
export type CountParams = Pick<AllPossibleParams, 'count'>;

// --- Grouped Key Types --- //

import type { QuoteStatusType } from '~/server/db/schema';

// Combine all keys into a single type for use with useTranslation
export type TranslationKey = 'appName'
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
  | 'common.actions'
  | 'common.back'
  | 'common.close'
  | 'common.closeSidebar'
  | 'common.create'
  | 'common.delete'
  | 'common.edit'
  | 'common.error'
  | 'common.noDescription'
  | 'common.noResults'
  | 'common.new'
  | 'common.openMenu'
  | 'common.retry'
  | 'common.update'
  | 'common.user'
  | 'common.view'
  | 'customers.contact'
  | 'customers.createError'
  | 'customers.createSuccess'
  | 'customers.deleteError'
  | 'customers.deleteSuccess'
  | 'customers.entityName'
  | 'customers.list.created'
  | 'customers.list.email'
  | 'customers.list.name'
  | 'customers.list.pageDescription'
  | 'customers.list.pageTitle'
  | 'customers.list.phone'
  | 'customers.list.searchPlaceholder'
  | 'customers.new'
  | 'customers.updateSuccess'
  | 'errors.requiredFieldsMissing'
  | 'nav.customers'
  | 'nav.dashboard'
  | 'nav.products'
  | 'nav.quotes'
  | 'nav.settings'
  | 'print.document'
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
  | 'products.createModalTitle'
  | 'products.createSuccess'
  | 'products.deleteError'
  | 'products.deleteSuccess'
  | 'products.editModalTitle'
  | 'products.entityName'
  | 'products.list.category'
  | 'products.list.name'
  | 'products.list.pageDescription'
  | 'products.list.price'
  | 'products.noProductsFound'
  | 'products.searchPlaceholder'
  | 'products.title'
  | 'products.updateSuccess'
  | 'products.viewModalTitle'
  | 'quoteSummary.grandTotal'
  | 'quoteSummary.markupCalculated'
  | 'quoteSummary.markupInputLabel'
  | 'quoteSummary.subtotalCombined'
  | 'quoteSummary.subtotalMaterials'
  | 'quoteSummary.subtotalTasks'
  | 'quoteSummary.title'
  | 'quotes.deleteError'
  | 'quotes.deleteSuccess'
  | 'quotes.detailsSectionTitle'
  | 'quotes.entityName'
  | 'quotes.estimatedMaterialCostLumpSumLabel'
  | 'quotes.fields.customer'
  | 'quotes.fields.title'
  | 'quotes.list.created'
  | 'quotes.list.customer'
  | 'quotes.list.header'
  | 'quotes.list.id'
  | 'quotes.list.status'
  | 'quotes.list.title'
  | 'quotes.list.total'
  | 'quotes.materialTypeItemized'
  | 'quotes.materialTypeLabel'
  | 'quotes.materialTypeLumpSum'
  | 'quotes.materialsSectionTitle'
  | 'quotes.notesLabel'
  | 'quotes.placeholders.notes'
  | 'quotes.placeholders.selectCustomer'
  | 'quotes.placeholders.title'
  | 'quotes.status.accepted'
  | 'quotes.status.draft'
  | 'quotes.status.rejected'
  | 'quotes.status.sent'
  | 'quotes.taskDescriptionLabel'
  | 'quotes.taskDescriptionPlaceholder'
  | 'quotes.taskPriceLabel'
  | 'quotes.tasksSectionTitle'
  | 'settings.changeTheme'
  | 'settings.changeThemeTitle'
  | 'settings.fetchError'
  | 'settings.language'
  | 'settings.loadError'
  | 'settings.saveError'
  | 'settings.saveSuccess'
  | 'settings.selectLanguage'
  | 'settings.title'
  | 'settings.validationError'
  | 'userMenu.profile'
  | 'userMenu.settings'
  | 'userMenu.signOut'
  | 'userMenu.title'
  | 'categories.entityName'
  | 'categories.title'
  | 'categories.searchPlaceholder'
  | 'categories.noCategories'
  | 'categories.list.name'
  | 'categories.list.description'
  | 'categories.list.productCount'
  | 'quotes.list.searchPlaceholder'
  | 'breadcrumb.categories.list'
  | 'breadcrumb.categories.new'
  | 'breadcrumb.customers.list'
  | 'breadcrumb.edit'
  | 'breadcrumb.products.list'
  | 'breadcrumb.products.new'
  | 'breadcrumb.quotes.list'
  | 'breadcrumb.quotes.new'
  | 'breadcrumb.settings'
  | 'categories.createError'
  | 'categories.createSuccess'
  | 'categories.deleteSuccess'
  | 'categories.edit'
  | 'categories.entityName'
  | 'categories.list.description'
  | 'categories.list.name'
  | 'categories.list.productCount'
  | 'categories.new'
  | 'categories.noCategories'
  | 'categories.searchPlaceholder'
  | 'categories.title'
  | 'categories.updateError'
  | 'categories.updateSuccess'
  | 'common.back'
  | 'common.createdAt'
  | 'common.error'
  | 'common.notSpecified'
  | 'common.updatedAt'
  | 'dashboard.overview.liveData'
  | 'dashboard.overview.title'
  | 'dashboard.quickActions.addCustomer'
  | 'dashboard.quickActions.addProduct'
  | 'dashboard.quickActions.createQuote'
  | 'dashboard.quickActions.title'
  | 'dashboard.recentQuotes.acceptedCount'
  | 'dashboard.recentQuotes.conversionRate'
  | 'dashboard.recentQuotes.newQuote'
  | 'dashboard.recentQuotes.noQuotes'
  | 'dashboard.recentQuotes.revenueInfo'
  | 'dashboard.recentQuotes.title'
  | 'dashboard.recentQuotes.viewAll'
  | 'dashboard.stats.productsUsed'
  | 'dashboard.stats.productsUsed.subtitle'
  | 'dashboard.stats.revenue'
  | 'dashboard.stats.revenue.subtitle'
  | 'dashboard.stats.timeframe.lastQuarter'
  | 'dashboard.stats.timeframe.thisMonth'
  | 'dashboard.stats.timeframe.vsTarget'
  | 'dashboard.stats.totalCustomers'
  | 'dashboard.stats.totalCustomers.subtitle'
  | 'dashboard.stats.totalQuotes'
  | 'dashboard.stats.totalQuotes.subtitle'
  | 'dashboard.title'
  | 'dashboard.welcome'
  | 'products.createSuccess'
  | 'products.deleteSuccess'
  | 'products.form.category'
  | 'products.form.description'
  | 'products.form.location'
  | 'products.form.manufacturer'
  | 'products.form.name'
  | 'products.form.notes'
  | 'products.form.price'
  | 'products.form.selectCategory'
  | 'products.form.sku'
  | 'products.form.supplier'
  | 'products.form.unit'
  | 'products.formTitle'
  | 'products.list.category'
  | 'products.list.description'
  | 'products.list.header'
  | 'products.list.location'
  | 'products.list.manufacturer'
  | 'products.list.notes'
  | 'products.list.pageDescription'
  | 'products.list.sku'
  | 'products.list.supplier'
  | 'products.list.unit'
  | 'products.new.pageTitle'
  | 'products.updateSuccess'
  | 'quotes.title'
  | 'customers.list.address'
  | 'customers.list.notes'
  | 'common.save'
  | 'categories.edit.pageTitle'
  | 'customers.edit.pageTitle'
  | 'products.edit.pageTitle'
  | 'quotes.new.pageTitle'
  | 'breadcrumb.customers.new'
  | 'settings.pageTitle';

// --- Conditional Mapping Type --- //

// Maps a TranslationKey to its specific parameter type
export type KeyToParams<K extends TranslationKey> = 
  K extends 'errors.requiredFieldsMissing' ? FieldParams :
  K extends 'auth.signUp.errorPasswordTooShort' | 'auth.signUp.passwordHint' ? MinParams :
  K extends 'customers.createError' | 'customers.deleteError' | 'products.deleteError' | 
           'quotes.deleteError' | 'settings.saveError' | 'settings.fetchError' | 
           'categories.createError' | 'categories.updateError' ? MessageParams :
  K extends 'quotes.placeholders.title' ? IdParams :
  K extends 'settings.changeThemeTitle' ? ThemeParams :
  K extends 'print.document' ? DateParams :
  K extends 'quoteSummary.grandTotal' ? PercentParams :
  K extends 'dashboard.recentQuotes.revenueInfo' ? CountParams :
  K extends 'categories.edit.pageTitle' | 'customers.edit.pageTitle' | 'products.edit.pageTitle' ? { name: string } :
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
