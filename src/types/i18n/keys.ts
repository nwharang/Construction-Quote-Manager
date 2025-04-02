// --- Grouped Key Types --- //

import type { QuoteStatusType, ProductCategoryType } from '~/server/db/schema-exports';

// Define namespaces used in LocaleResources
export type Namespaces = 
  | 'common' 
  | 'validation' 
  | 'auth' 
  | 'nav' 
  | 'dashboard' 
  | 'quotes' 
  | 'products' 
  | 'productFields' // Added namespace
  | 'productPlaceholders' // Added namespace
  | 'customers' 
  | 'settings' 
  | 'format' 
  | 'print' 
  | 'footer' 
  | 'quoteSummary' 
  | 'userMenu' 
  | 'button' // Keep existing namespaces
  | 'toast'; // Keep existing namespaces

// Define keys for the 'common' namespace
export type CommonKeys =
  | 'app.name'
  | 'app.tagline'
  | 'appName'
  | 'common.loading'
  | 'common.save'
  | 'common.cancel'
  | 'common.edit'
  | 'common.delete'
  | 'common.create'
  | 'common.update'
  | 'common.close'
  | 'common.confirmDeleteTitle'
  | 'common.confirmDeleteMessage'
  | 'common.searchPlaceholder'
  | 'common.noDescription'
  | 'common.noDataAvailable'
  | 'common.noResults'
  | 'common.noSKU'
  | 'common.home'
  | 'common.settings'
  | 'common.logout'
  | 'common.profile'
  | 'common.dashboard'
  | 'common.quotes'
  | 'common.products'
  | 'common.customers'
  | 'common.admin'
  | 'common.users'
  | 'common.requiredField'
  | 'common.optionalField'
  | 'common.actions'
  | 'common.view'
  | 'common.error'
  | 'common.notAvailable'
  | 'common.status'
  | 'common.unknown'
  | 'common.print'
  | 'common.export'
  | 'common.back'
  | 'common.remove'
  | 'common.validationErrorToast'
  | 'common.saveChanges'
  | 'common.discardChanges'
  | 'common.errorLoading'
  | 'common.saving'
  | 'common.search'
  | 'common.selectPlaceholder'
  | 'common.yesDelete'
  | 'common.noCancel'
  | 'common.fieldRequired'
  | 'common.page'
  | 'common.of'
  | 'common.menu'
  | 'common.closeSidebar'
  | 'common.openMenu'
  | 'common.user'
  | 'common.removeTask'
  | 'common.removeMaterial'
  | 'common.add'
  | 'common.all'
  | 'common.confirm'
  | 'common.optional'
  | 'common.new'
  | 'common.retry';

// Define keys for the 'validation' namespace
export type ValidationKeys =
  | 'validation.required'
  | 'validation.invalidEmail'
  | 'validation.minLength'
  | 'validation.maxLength'
  | 'validation.selectOption'
  | 'field.required'
  | 'field.email'
  | 'field.minLength'
  | 'field.maxLength'
  | 'validation.minValue'
  | 'errors.requiredField'
  | 'errors.invalidEmail'
  | 'errors.invalidFormat'
  | 'errors.invalidNumber'
  | 'errors.invalidDate'
  | 'errors.invalidUrl'
  | 'errors.invalidCurrencyFormat'
  | 'errors.minimumValue'
  | 'errors.maximumValue'
  | 'errors.minimumValuePercent'
  | 'errors.maximumValuePercent'
  | 'errors.arrayMinLength'
  | 'errors.requiredFieldsMissing'
  | 'quotes.validation.titleRequired'
  | 'quotes.validation.customerRequired';

export type AuthKeys =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'auth.email'
  | 'auth.password'
  | 'auth.forgotPassword'
  | 'auth.rememberMe'
  | 'auth.dontHaveAccount'
  | 'auth.alreadyHaveAccount'
  | 'auth.signIn.title'
  | 'auth.signIn.subtitle'
  | 'auth.signIn.emailLabel'
  | 'auth.signIn.passwordLabel'
  | 'auth.signIn.submitButton'
  | 'auth.signIn.signUpPrompt'
  | 'auth.signIn.signUpLink'
  | 'auth.signIn.errorInvalidCredentials'
  | 'auth.signIn.errorUnexpected'
  | 'auth.signIn.errorRequiredFields'
  | 'auth.signUp.title'
  | 'auth.signUp.subtitle'
  | 'auth.signUp.nameLabel'
  | 'auth.signUp.emailLabel'
  | 'auth.signUp.passwordLabel'
  | 'auth.signUp.confirmPasswordLabel'
  | 'auth.signUp.submitButton'
  | 'auth.signUp.signInPrompt'
  | 'auth.signUp.signInLink'
  | 'auth.signUp.errorPasswordsDoNotMatch'
  | 'auth.signUp.errorPasswordTooShort'
  | 'auth.signUp.errorSignInFailed'
  | 'auth.signUp.errorUnexpected'
  | 'auth.signUp.errorRequiredFields'
  | 'auth.signUp.passwordHint';

export type NavKeys =
  | 'nav.dashboard'
  | 'nav.quotes'
  | 'nav.customers'
  | 'nav.products'
  | 'nav.settings';

export type DashboardKeys =
  | 'dashboard.title'
  | 'dashboard.welcome'
  | 'dashboard.overview'
  | 'dashboard.quickActions'
  | 'dashboard.recentQuotes'
  | 'dashboard.totalCustomers'
  | 'dashboard.totalQuotes'
  | 'dashboard.totalProducts'
  | 'dashboard.totalRevenue'
  | 'dashboard.increase'
  | 'dashboard.decrease'
  | 'dashboard.fromLastMonth'
  | 'dashboard.noQuotes'
  | 'dashboard.createFirstQuote';

export type QuoteKeys =
  | 'quotes.title'
  | 'quotes.list.title'
  | 'quotes.new'
  | 'quotes.edit'
  | 'quotes.view'
  | 'quotes.delete'
  | 'quotes.id'
  | 'quotes.name'
  | 'quotes.customer'
  | 'quotes.status'
  | 'quotes.total'
  | 'quotes.date'
  | 'quotes.actions'
  | 'quotes.searchPlaceholder'
  | 'quotes.confirmDelete'
  | 'quotes.deleteSuccess'
  | 'quotes.deleteError'
  | 'quotes.createSuccess'
  | 'quotes.updateSuccess'
  | 'quotes.createError'
  | 'quotes.updateError'
  | 'quotes.print.title'
  | 'quotes.entityType'
  | 'quotes.entityName'
  | 'quotes.list.header'
  | 'quotes.list.searchPlaceholder'
  | 'quotes.createButton'
  | 'quotes.list.ariaLabel'
  | 'quotes.list.empty'
  | 'quotes.status.draft'
  | 'quotes.status.sent'
  | 'quotes.status.accepted'
  | 'quotes.status.rejected'
  | 'quotes.status.unknown'
  | 'quotes.viewModalTitle'
  | 'quotes.loadError'
  | 'quotes.detailsSectionTitle'
  | 'quotes.titleLabel'
  | 'quotes.customerLabel'
  | 'quotes.createdDateLabel'
  | 'quotes.notesLabel'
  | 'quotes.tasksSectionTitle'
  | 'quotes.materialTypeLumpSum'
  | 'quotes.materialsSectionTitle'
  | 'quotes.materialProductIdHeader'
  | 'quotes.materialQuantityHeader'
  | 'quotes.materialUnitPriceHeader'
  | 'quotes.materialLineTotalHeader'
  | 'quotes.noMaterialsForItemized'
  | 'quotes.noTasksAdded'
  | 'quotes.taskDescriptionLabel'
  | 'quotes.taskDescriptionPlaceholder'
  | 'quotes.taskPriceLabel'
  | 'quotes.materialTypeLabel'
  | 'quotes.materialTypeItemized'
  | 'quotes.estimatedMaterialCostLumpSumLabel'
  | 'quotes.materialProductIdLabel'
  | 'quotes.materialQuantityLabel'
  | 'quotes.materialUnitPriceLabel'
  | 'quotes.materialNotesLabel'
  | 'quotes.materialNotesPlaceholder'
  | 'quotes.addTaskButton'
  | 'quotes.addMaterialButton'
  | 'quotes.noTasksAddedEditable'
  | 'quotes.notes'
  | 'quotes.markupCharge'
  | 'quotes.placeholders.title'
  | 'quotes.placeholders.selectCustomer'
  | 'quotes.placeholders.notes'
  | 'quotes.list.id'
  | 'quotes.list.customer'
  | 'quotes.list.created'
  | 'quotes.list.status'
  | 'quotes.list.total'
  | 'quotes.materialNotesHeader'
  | 'quotes.materialQuantityHeader'
  | 'quotes.materialUnitPriceHeader'
  | 'quotes.materialLineTotalHeader'
  | 'quotes.actions.print'
  | 'quotes.list.noQuotesFound'
  | 'quotes.fields.title'
  | 'quotes.fields.customer'
  | 'quotes.fields.notes'
  | 'quotes.noMaterialsAdded'
  | 'quotes.noTasksAddedReadOnly'
  | 'quotes.updateSuccessToast'
  | 'quotes.updateErrorToast'
  | 'quotes.editModalTitle'
  | 'quotes.createModalTitle';

export type ProductKeys =
  | 'products.title'
  | 'products.list.title'
  | 'products.list.id'
  | 'products.list.name'
  | 'products.list.category'
  | 'products.list.price'
  | 'products.new'
  | 'products.edit'
  | 'products.view'
  | 'products.delete'
  | 'products.id'
  | 'products.name'
  | 'products.category'
  | 'products.unitPrice'
  | 'products.actions'
  | 'products.actionsLabel'
  | 'products.searchPlaceholder'
  | 'products.confirmDelete'
  | 'products.deleteSuccess'
  | 'products.deleteError'
  | 'products.createSuccess'
  | 'products.updateSuccess'
  | 'products.createError'
  | 'products.updateError'
  | 'products.createModalTitle'
  | 'products.editModalTitle'
  | 'products.viewModalTitle'
  | 'products.createButton';

// Define keys for product fields (New type)
export type ProductFieldsKeys =
  | 'name'
  | 'description'
  | 'category'
  | 'unitPrice'
  | 'unit'
  | 'sku'
  | 'manufacturer'
  | 'supplier'
  | 'location'
  | 'notes';

// Define keys for product placeholders (New type)
export type ProductPlaceholdersKeys =
  | 'name'
  | 'description'
  | 'category'
  | 'unitPrice'
  | 'unit'
  | 'sku'
  | 'manufacturer'
  | 'supplier'
  | 'location'
  | 'notes';

export type CustomerKeys =
  | 'customers.deleteError'
  | 'customers.createError'
  | 'customers.updateError'
  | 'customers.title'
  | 'customers.list.title'
  | 'customers.new'
  | 'customers.edit'
  | 'customers.view'
  | 'customers.delete'
  | 'customers.id'
  | 'customers.name'
  | 'customers.contact'
  | 'customers.location'
  | 'customers.quotes'
  | 'customers.actions'
  | 'customers.searchPlaceholder'
  | 'customers.confirmDelete'
  | 'customers.deleteSuccess'
  | 'customers.createSuccess'
  | 'customers.updateSuccess'
  | 'customers.list.name'
  | 'customers.list.email'
  | 'customers.list.phone'
  | 'customers.list.created'
  | 'customers.list.searchPlaceholder'
  | 'customers.createButton';

export type ButtonKeys =
  | 'button.submit'
  | 'button.save'
  | 'button.cancel'
  | 'button.delete'
  | 'button.edit'
  | 'button.view'
  | 'button.back'
  | 'button.close'
  | 'button.create'
  | 'button.add'
  | 'button.print'
  | 'button.saveChanges';

export type ToastKeys =
  | 'toast.success'
  | 'toast.error'
  | 'toast.loading';

export type SettingsKeys =
  | 'settings.title'
  | 'settings.appearance'
  | 'settings.general'
  | 'settings.notifications'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.currency'
  | 'settings.dateFormat'
  | 'settings.selectLanguage'
  | 'settings.toggleTheme'
  | 'settings.changeTheme'
  | 'settings.changeThemeTitle'
  | 'settings.darkMode'
  | 'settings.quoteDefaults'
  | 'settings.companyInfo'
  | 'settings.companyName'
  | 'settings.companyEmail'
  | 'settings.companyPhone'
  | 'settings.companyAddress'
  | 'settings.languageDescription'
  | 'settings.themeDescription'
  | 'settings.defaultValues'
  | 'settings.defaultMarkupCharge'
  | 'settings.defaultComplexityCharge'
  | 'settings.defaultTaskPrice'
  | 'settings.defaultMaterialPrice'
  | 'settings.currencyExample'
  | 'settings.shortFormat'
  | 'settings.longFormat'
  | 'settings.timeFormat'
  | 'settings.timeFormatDescription'
  | 'settings.emailNotifications'
  | 'settings.emailNotificationsDescription'
  | 'settings.quoteNotifications'
  | 'settings.quoteNotificationsDescription'
  | 'settings.taskNotifications'
  | 'settings.taskNotificationsDescription'
  | 'settings.saveSuccess'
  | 'settings.saveError'
  | 'settings.fetchError'
  | 'settings.loadError'
  | 'settings.validationError'
  | 'settings.localization'
  | 'settings.currencySymbol'
  | 'settings.notificationPreferences'
  | 'theme.dark'
  | 'theme.light'
  | 'theme.system'
  | 'settings.theme.light'
  | 'settings.theme.dark'
  | 'settings.theme.system'
  | 'settings.selectLanguagePlaceholder'
  | 'settings.languageChangeNote';

export type FormatKeys =
  | 'format.currency'
  | 'format.date.short'
  | 'format.date.long'
  | 'format.phone';

export type PrintKeys =
  | 'print.document'
  | 'print.printNow'
  | 'print.generatedOn';

export type FooterKeys =
  | 'footer.allRightsReserved'
  | 'footer.copyright';

export type QuoteSummaryKeys =
  | 'quoteSummary.title'
  | 'quoteSummary.subtotalTasks'
  | 'quoteSummary.subtotalMaterials'
  | 'quoteSummary.subtotalCombined'
  | 'quoteSummary.markupCalculated'
  | 'quoteSummary.grandTotal'
  | 'quoteSummary.markup'
  | 'quoteSummary.markupInputLabel'
  | 'quoteSummary.tax';

export type UserMenuKeys =
  | 'userMenu.title'
  | 'userMenu.profile'
  | 'userMenu.settings'
  | 'userMenu.signOut';

// Combine all keys into a single type for use with useTranslation
export type TranslationKey =
  | CommonKeys
  | ValidationKeys
  | AuthKeys
  | NavKeys
  | DashboardKeys
  | QuoteKeys
  | ProductKeys
  | ProductFieldsKeys
  | ProductPlaceholdersKeys
  | CustomerKeys
  | SettingsKeys
  | FormatKeys
  | PrintKeys
  | FooterKeys
  | QuoteSummaryKeys
  | UserMenuKeys
  | ButtonKeys
  | ToastKeys;

// --- Helper Types --- //

// Helper type for mapping QuoteStatusType to TranslationKey
export type QuoteStatusTranslationKey = `quotes.status.${QuoteStatusType | 'unknown'}`;

// Helper type for mapping ProductCategoryType to TranslationKey
export type ProductCategoryTranslationKey = `products.category.${ProductCategoryType}`;

