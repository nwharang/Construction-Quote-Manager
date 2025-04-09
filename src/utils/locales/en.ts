import type { TranslationKey } from '~/types/i18n/keys';

const enTranslations: Record<TranslationKey, string> = {
  appName: 'Quote Tool Deluxe',
  'auth.signIn.emailLabel': 'Email',
  'auth.signIn.errorInvalidCredentials': 'Invalid email or password.',
  'auth.signIn.errorRequiredFields': 'Please fill in both email and password.',
  'auth.signIn.errorUnexpected': 'An unexpected error occurred. Please try again.',
  'auth.signIn.passwordLabel': 'Password',
  'auth.signIn.signUpLink': 'Sign up',
  'auth.signIn.signUpPrompt': "Don't have an account?",
  'auth.signIn.submitButton': 'Sign In',
  'auth.signIn.subtitle': 'Enter your credentials to access your account',
  'auth.signIn.title': 'Sign In',
  'auth.signUp.confirmPasswordLabel': 'Confirm Password',
  'auth.signUp.emailLabel': 'Email',
  'auth.signUp.errorPasswordTooShort': 'Password must be at least {min} characters long.',
  'auth.signUp.errorPasswordsDoNotMatch': 'Passwords do not match.',
  'auth.signUp.errorSignInFailed':
    'Registration successful, but failed to sign you in automatically. Please try signing in manually.',
  'auth.signUp.errorUnexpected':
    'An unexpected error occurred during registration. Please try again.',
  'auth.signUp.nameLabel': 'Name',
  'auth.signUp.passwordHint': 'Minimum {min} characters',
  'auth.signUp.passwordLabel': 'Password',
  'auth.signUp.signInLink': 'Sign in',
  'auth.signUp.signInPrompt': 'Already have an account?',
  'auth.signUp.submitButton': 'Sign Up',
  'auth.signUp.subtitle': 'Create your account to get started',
  'auth.signUp.title': 'Sign Up',
  'common.actions': 'Actions',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.closeSidebar': 'Close sidebar',
  'common.create': 'Create',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.error': 'Error',
  'common.loading': 'Loading...',
  'common.noDescription': 'No description provided',
  'common.noResults': 'No results found',
  'common.new': 'New',
  'common.openMenu': 'Open menu',
  'common.print': 'Print',
  'common.retry': 'Retry',
  'common.update': 'Update',
  'common.user': 'User',
  'common.view': 'View',
  'customers.contact': 'Contact Info',
  'customers.createError': 'Error creating customer: {message}',
  'customers.createSuccess': 'Customer created successfully',
  'customers.deleteError': 'Error deleting customer: {message}',
  'customers.deleteSuccess': 'Customer deleted successfully',
  'customers.entityName': 'Customer',
  'customers.list.created': 'Created',
  'customers.list.email': 'Email',
  'customers.list.name': 'Name',
  'customers.list.pageDescription': 'Manage your customer records.',
  'customers.list.pageTitle': 'Customers List',
  'customers.list.phone': 'Phone',
  'customers.list.searchPlaceholder': 'Search customers by name or email...',
  'customers.new': 'New Customer',
  'customers.updateSuccess': 'Customer updated successfully',
  'errors.requiredFieldsMissing': 'Please fill in all required fields.',
  'nav.customers': 'Customers',
  'nav.dashboard': 'Dashboard',
  'nav.products': 'Products',
  'nav.quotes': 'Quotes',
  'nav.settings': 'Settings',
  'print.document': 'Print Document',
  'print.printNow': 'Print Now',
  'productFields.category': 'Category',
  'productFields.description': 'Description',
  'productFields.location': 'Storage Location',
  'productFields.manufacturer': 'Manufacturer',
  'productFields.name': 'Product Name',
  'productFields.notes': 'Notes',
  'productFields.sku': 'SKU / Part No.',
  'productFields.supplier': 'Supplier',
  'productFields.unit': 'Unit',
  'productFields.unitPrice': 'Unit Price',
  'productPlaceholders.category': 'e.g., Electrical, Plumbing',
  'productPlaceholders.description': 'Enter product description...',
  'productPlaceholders.location': 'e.g., Warehouse A, Shelf 3B',
  'productPlaceholders.manufacturer': 'e.g., Acme Corp',
  'productPlaceholders.name': 'Enter product name...',
  'productPlaceholders.notes': 'Enter any notes about the product...',
  'productPlaceholders.sku': 'e.g., ABC-12345',
  'productPlaceholders.supplier': 'e.g., Supply Co.',
  'productPlaceholders.unit': 'e.g., piece, box, ft, m',
  'products.createModalTitle': 'Create New Product',
  'products.createSuccess': 'Product created successfully',
  'products.deleteError': 'Error deleting product: {message}',
  'products.deleteSuccess': 'Product deleted successfully',
  'products.editModalTitle': 'Edit Product',
  'products.entityName': 'Product',
  'products.list.category': 'Category',
  'products.list.name': 'Name',
  'products.list.pageDescription': 'Manage your product catalog.',
  'products.list.price': 'Price',
  'products.noProductsFound': 'No products found.',
  'products.searchPlaceholder': 'Search products...',
  'products.title': 'Products',
  'products.updateSuccess': 'Product updated successfully',
  'products.viewModalTitle': 'View Product Details',
  'quoteSummary.grandTotal': 'Grand Total',
  'quoteSummary.markupCalculated': 'Markup',
  'quoteSummary.markupInputLabel': 'Markup %',
  'quoteSummary.subtotalCombined': 'Subtotal (Tasks + Materials)',
  'quoteSummary.subtotalMaterials': 'Materials Subtotal',
  'quoteSummary.subtotalTasks': 'Tasks Subtotal',
  'quoteSummary.title': 'Quote Summary',
  'quotes.deleteError': 'Error deleting quote: {message}',
  'quotes.deleteSuccess': 'Quote deleted successfully',
  'quotes.detailsSectionTitle': 'Quote Details',
  'quotes.entityName': 'Quote',
  'quotes.estimatedMaterialCostLumpSumLabel': 'Estimated Material Cost (Lump Sum)',
  'quotes.fields.customer': 'Customer',
  'quotes.fields.title': 'Quote Title',
  'quotes.list.created': 'Created',
  'quotes.list.customer': 'Customer',
  'quotes.list.header': 'Quotes',
  'quotes.list.id': 'ID',
  'quotes.list.status': 'Status',
  'quotes.list.title': 'Title',
  'quotes.list.total': 'Total',
  'quotes.materialTypeItemized': 'Itemized',
  'quotes.materialTypeLabel': 'Materials',
  'quotes.materialTypeLumpSum': 'Lump Sum',
  'quotes.materialsSectionTitle': 'Materials',
  'quotes.notesLabel': 'Notes',
  'quotes.placeholders.notes': 'Enter any internal notes about this quote...',
  'quotes.placeholders.selectCustomer': 'Select a customer...',
  'quotes.placeholders.title': 'Enter quote title...',
  'quotes.status.accepted': 'Accepted',
  'quotes.status.draft': 'Draft',
  'quotes.status.rejected': 'Rejected',
  'quotes.status.sent': 'Sent',
  'quotes.statusChange.title': 'Change Quote Status',
  'quotes.statusChange.current': 'Current Status',
  'quotes.statusChange.new': 'New Status',
  'quotes.statusChange.submit': 'Update Status',
  'quotes.statusChange.cancel': 'Cancel',
  'quotes.statusChange.success': 'Quote status updated successfully',
  'quotes.statusChange.error': 'Failed to update quote status: {message}',
  'quotes.print.customer': 'Customer Information',
  'quotes.print.details': 'Quote Details',
  'quotes.print.laborTotal': 'Labor Total',
  'quotes.print.materialsTotal': 'Materials Total',
  'quotes.print.subtotal': 'Subtotal',
  'quotes.print.markup': 'Markup ({percentage}%)',
  'quotes.print.grandTotal': 'Grand Total',
  'quotes.print.footerNote': 'This document was generated on {date} and is for estimation purposes only.',
  'quotes.print.quoteInformation': 'Quote Information',
  'quotes.print.title': 'Title:',
  'quotes.print.tasksAndMaterials': 'Tasks & Materials',
  'quotes.print.description': 'Description',
  'quotes.print.labor': 'Labor',
  'quotes.print.materials': 'Materials',
  'quotes.print.summary': 'Summary',
  'quotes.print.notes': 'Notes',
  'quotes.print.generatedMessage': 'This document was generated on {date} and is for estimation purposes only.',
  'quotes.taskDescriptionLabel': 'Task Description',
  'quotes.taskDescriptionPlaceholder': 'Enter task description...',
  'quotes.taskPriceLabel': 'Task Price',
  'quotes.tasksSectionTitle': 'Tasks & Materials',
  'settings.changeTheme': 'Change Theme',
  'settings.changeThemeTitle': 'Change to {theme} theme',
  'settings.fetchError': 'Failed to fetch settings: {message}',
  'settings.language': 'Language',
  'settings.loadError': 'Failed to load settings.',
  'settings.saveError': 'Failed to save settings: {message}',
  'settings.saveSuccess': 'Settings saved successfully.',
  'settings.selectLanguage': 'Select Language',
  'settings.title': 'Settings',
  'settings.validationError': 'Please correct the errors before saving.',
  'userMenu.profile': 'Profile',
  'userMenu.settings': 'Settings',
  'userMenu.signOut': 'Sign Out',
  'userMenu.title': 'User Menu',
  'categories.title': 'Categories',
  'categories.list.name': 'Name',
  'categories.list.description': 'Description',
  'categories.list.productCount': 'Products',
  'categories.new': 'New Category',
  'categories.edit': 'Edit Category',
  'categories.createSuccess': 'Category created successfully',
  'categories.createError': 'Error creating category: {message}',
  'categories.updateSuccess': 'Category updated successfully',
  'categories.updateError': 'Error updating category: {message}',
  'categories.deleteSuccess': 'Category deleted successfully',
  'categories.entityName': 'Category',
  'categories.noCategories': 'No categories found.',
  'categories.searchPlaceholder': 'Search categories...',
  'breadcrumb.categories.list': 'Categories',
  'breadcrumb.categories.new': 'New Category',
  'breadcrumb.customers.list': 'Customers',
  'breadcrumb.customers.new': 'New Customer',
  'breadcrumb.edit': 'Edit',
  'breadcrumb.products.list': 'Products',
  'breadcrumb.products.new': 'New Product',
  'breadcrumb.quotes.list': 'Quotes',
  'breadcrumb.quotes.new': 'New Quote',
  'breadcrumb.settings': 'Settings',
  'common.createdAt': 'Created At',
  'common.notSpecified': 'Not specified',
  'common.save': 'Save',
  'common.updatedAt': 'Updated At',
  'customers.edit.pageTitle': 'Edit Customer',
  'customers.list.address': 'Address',
  'customers.list.notes': 'Notes',
  'dashboard.overview.liveData': 'Live Data',
  'dashboard.overview.title': 'Overview',
  'dashboard.quickActions.addCustomer': 'Add Customer',
  'dashboard.quickActions.addProduct': 'Add Product',
  'dashboard.quickActions.createQuote': 'Create Quote',
  'dashboard.quickActions.title': 'Quick Actions',
  'dashboard.recentQuotes.acceptedCount': 'accepted quotes',
  'dashboard.recentQuotes.conversionRate': 'conversion rate',
  'dashboard.recentQuotes.newQuote': 'New Quote',
  'dashboard.recentQuotes.noQuotes': 'No recent quotes found.',
  'dashboard.recentQuotes.revenueInfo': 'revenue from {count} quotes',
  'dashboard.recentQuotes.title': 'Recent Quotes',
  'dashboard.recentQuotes.viewAll': 'View All',
  'dashboard.stats.productsUsed': 'Products Used',
  'dashboard.stats.productsUsed.subtitle': 'in active quotes',
  'dashboard.stats.revenue': 'Revenue',
  'dashboard.stats.revenue.subtitle': 'from accepted quotes',
  'dashboard.stats.timeframe.lastQuarter': 'vs last quarter',
  'dashboard.stats.timeframe.thisMonth': 'this month',
  'dashboard.stats.timeframe.vsTarget': 'vs target',
  'dashboard.stats.totalCustomers': 'Total Customers',
  'dashboard.stats.totalCustomers.subtitle': 'active accounts',
  'dashboard.stats.totalQuotes': 'Total Quotes',
  'dashboard.stats.totalQuotes.subtitle': 'across all customers',
  'dashboard.title': 'Dashboard',
  'dashboard.welcome': "Welcome back! Here's an overview of your business.",
  'products.edit.pageTitle': 'Edit Product',
  'products.form.category': 'Category',
  'products.form.description': 'Description',
  'products.form.location': 'Location',
  'products.form.manufacturer': 'Manufacturer',
  'products.form.name': 'Name',
  'products.form.notes': 'Notes',
  'products.form.price': 'Price',
  'products.form.selectCategory': 'Select Category',
  'products.form.sku': 'SKU',
  'products.form.supplier': 'Supplier',
  'products.form.unit': 'Unit',
  'products.formTitle': 'Product Form',
  'products.list.description': 'Description',
  'products.list.header': 'Product List',
  'products.list.location': 'Location',
  'products.list.manufacturer': 'Manufacturer',
  'products.list.notes': 'Notes',
  'products.list.sku': 'SKU',
  'products.list.supplier': 'Supplier',
  'products.list.unit': 'Unit',
  'products.new.pageTitle': 'Create New Product',
  'quotes.list.searchPlaceholder': 'Search quotes...',
  'quotes.new.pageTitle': 'Create New Quote',
  'quotes.title': 'Quote',
  'settings.pageTitle': 'Settings',
  'categories.edit.pageTitle': 'Edit Category',
  'settings.company.title': 'Company Information',
  'settings.company.name': 'Company Name',
  'settings.company.email': 'Company Email',
  'settings.company.phone': 'Phone Number',
  'settings.company.address': 'Address',
  'settings.company.taxId': 'Tax ID',
  'settings.company.logo': 'Company Logo',
  'settings.company.website': 'Website',
  'settings.profile.title': 'Profile',
  'settings.profile.name': 'Name',
  'settings.profile.email': 'Email',
  'settings.profile.phone': 'Phone',
  'settings.profile.position': 'Position',
  'settings.profile.language': 'Preferred Language',
  'settings.appearance.title': 'Appearance',
  'settings.appearance.theme': 'Theme',
  'settings.appearance.density': 'Display Density',
  'settings.appearance.density.compact': 'Compact',
  'settings.appearance.density.comfortable': 'Comfortable',
  'settings.notifications.title': 'Notifications',
  'settings.notifications.email': 'Email Notifications',
  'settings.notifications.app': 'App Notifications',
  'settings.notifications.quotes': 'Quote Updates',
  'settings.notifications.customers': 'Customer Updates',
  'settings.defaults.title': 'Defaults',
  'settings.defaults.currency': 'Currency',
  'settings.defaults.taxRate': 'Tax Rate',
  'settings.defaults.quoteExpiry': 'Quote Expiry (days)',
  'settings.defaults.terms': 'Default Terms & Conditions',
  'settings.security.title': 'Security',
  'settings.security.changePassword': 'Change Password',
  'settings.security.twoFactor': 'Two-Factor Authentication',
  'settings.security.sessions': 'Active Sessions',
  'settings.security.apiKeys': 'API Keys',
  'settings.actions.save': 'Save changes',
  'settings.actions.cancel': 'Cancel',
  'settings.actions.reset': 'Reset to Defaults',
  'settings.actions.upload': 'Upload',
  'settings.actions.remove': 'Remove',
  'settings.localization.title': 'Localization',
  'settings.localization.description': 'Configure language and region settings',
  
  // Quote view page translations
  'quotes.view.title': 'Quote Details',
  'quotes.view.backToQuotes': 'Back to Quotes',
  'quotes.view.changeStatus': 'Change Status',
  'quotes.view.notFound': 'Quote not found',
  'quotes.view.customerInfo': 'Customer Information',
  'quotes.view.quoteInfo': 'Quote Details',
  'quotes.view.createdOn': 'Created on:',
  'quotes.view.lastUpdated': 'Last updated:',
  'quotes.view.markup': 'Markup:',
  'quotes.view.subtotal': 'Subtotal:',
  'quotes.view.grandTotal': 'Grand Total:',
  'quotes.view.costBreakdown': 'Cost Breakdown',
  'quotes.view.labor': 'Labor',
  'quotes.view.materials': 'Materials',
  'quotes.view.percentOfTotal': '% of total',
  'quotes.view.notes': 'Notes',
  'quotes.view.tasks': 'Tasks',
  'quotes.view.noTasks': 'No tasks added to this quote',
  'quotes.view.taskDetails': 'Task Details',
  'quotes.view.costDistribution': 'Cost Distribution',
  'quotes.view.item': 'Item',
  'quotes.view.quantity': 'Qty',
  'quotes.view.unitPrice': 'Unit Price',
  'quotes.view.total': 'Total',
  'quotes.view.lumpSum': 'Lump Sum',
  'quotes.view.itemized': 'Itemized',
  'quotes.view.materialsLumpSum': 'Materials (Lump Sum)',
};

export default enTranslations;
