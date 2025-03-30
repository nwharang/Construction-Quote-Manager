import { useRouter } from 'next/router';
import { useLocalStorage } from '~/hooks/useLocalStorage';

// Define all available locales
export const locales = {
  en: 'English',
  vi: 'Tiếng Việt'
};

// Define types for translations
export type TranslationKey = string;
export type TranslationValues = Record<string, string | number>;

// Base translation objects for each locale
export const translations: Record<string, Record<TranslationKey, string>> = {
  // English translations
  en: {
    // Common
    'app.name': 'Construction Quote Manager',
    'app.tagline': 'Simple, fast, reliable quoting for contractors',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember Me',
    'auth.dontHaveAccount': 'Don\'t have an account?',
    'auth.alreadyHaveAccount': 'Already have an account?',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.quotes': 'Quotes',
    'nav.customers': 'Customers',
    'nav.products': 'Products',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome to your Construction Quote Manager dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.recentQuotes': 'Recent Quotes',
    'dashboard.totalCustomers': 'Total Customers',
    'dashboard.totalQuotes': 'Total Quotes',
    'dashboard.totalProducts': 'Total Products',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.increase': '{value}% increase',
    'dashboard.decrease': '{value}% decrease',
    'dashboard.fromLastMonth': 'from last month',
    'dashboard.noQuotes': 'No quotes yet',
    'dashboard.createFirstQuote': 'Create your first quote to get started',
    
    // Quotes
    'quotes.title': 'Quotes',
    'quotes.new': 'New Quote',
    'quotes.edit': 'Edit Quote',
    'quotes.view': 'View Quote',
    'quotes.delete': 'Delete Quote',
    'quotes.id': 'ID',
    'quotes.name': 'Quote Name',
    'quotes.customer': 'Customer',
    'quotes.status': 'Status',
    'quotes.total': 'Total',
    'quotes.date': 'Date',
    'quotes.actions': 'Actions',
    'quotes.searchPlaceholder': 'Search quotes...',
    'quotes.confirmDelete': 'Are you sure you want to delete this quote?',
    'quotes.deleteSuccess': 'Quote deleted successfully',
    'quotes.deleteError': 'Error deleting quote: {message}',
    'quotes.createSuccess': 'Quote created successfully',
    'quotes.updateSuccess': 'Quote updated successfully',
    
    // Quote Status
    'quotes.status.draft': 'Draft',
    'quotes.status.sent': 'Sent',
    'quotes.status.accepted': 'Accepted',
    'quotes.status.rejected': 'Rejected',
    
    // Customers
    'customers.title': 'Customers',
    'customers.new': 'New Customer',
    'customers.edit': 'Edit Customer',
    'customers.view': 'View Customer',
    'customers.delete': 'Delete Customer',
    'customers.id': 'ID',
    'customers.name': 'Name',
    'customers.contact': 'Contact',
    'customers.location': 'Location',
    'customers.quotes': 'Quotes',
    'customers.actions': 'Actions',
    'customers.searchPlaceholder': 'Search customers...',
    'customers.confirmDelete': 'Are you sure you want to delete this customer?',
    'customers.deleteSuccess': 'Customer deleted successfully',
    'customers.deleteError': 'Error deleting customer: {message}',
    'customers.createSuccess': 'Customer created successfully',
    'customers.updateSuccess': 'Customer updated successfully',
    
    // Products
    'products.title': 'Products',
    'products.new': 'New Product',
    'products.edit': 'Edit Product',
    'products.view': 'View Product',
    'products.delete': 'Delete Product',
    'products.id': 'ID',
    'products.name': 'Name',
    'products.category': 'Category',
    'products.unitPrice': 'Unit Price',
    'products.actions': 'Actions',
    'products.searchPlaceholder': 'Search products...',
    'products.confirmDelete': 'Are you sure you want to delete this product?',
    'products.deleteSuccess': 'Product deleted successfully',
    'products.deleteError': 'Error deleting product: {message}',
    'products.createSuccess': 'Product created successfully',
    'products.updateSuccess': 'Product updated successfully',
    
    // Buttons
    'button.submit': 'Submit',
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.delete': 'Delete',
    'button.edit': 'Edit',
    'button.view': 'View',
    'button.back': 'Back',
    'button.close': 'Close',
    'button.create': 'Create',
    'button.add': 'Add',
    'button.print': 'Print',
    
    // Form Fields
    'field.required': 'This field is required',
    'field.email': 'Please enter a valid email address',
    'field.minLength': 'Must be at least {min} characters',
    'field.maxLength': 'Cannot exceed {max} characters',
    
    // Toast Messages
    'toast.success': 'Success',
    'toast.error': 'Error',
    'toast.loading': 'Loading',
    
    // Settings
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.general': 'General',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.currency': 'Currency',
    'settings.dateFormat': 'Date Format',
    
    // Format placeholders
    'format.currency': '${value}',
    'format.date.short': 'MM/DD/YYYY',
    'format.date.long': 'MMMM D, YYYY',
    'format.phone': '+1 {value}',
  },
  
  // Vietnamese translations
  vi: {
    // Common
    'app.name': 'Phần Mềm Báo Giá Xây Dựng',
    'app.tagline': 'Báo giá đơn giản, nhanh chóng, đáng tin cậy cho nhà thầu',
    
    // Auth
    'auth.login': 'Đăng nhập',
    'auth.logout': 'Đăng xuất',
    'auth.register': 'Đăng ký',
    'auth.email': 'Email',
    'auth.password': 'Mật khẩu',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.rememberMe': 'Ghi nhớ đăng nhập',
    'auth.dontHaveAccount': 'Chưa có tài khoản?',
    'auth.alreadyHaveAccount': 'Đã có tài khoản?',
    
    // Navigation
    'nav.dashboard': 'Trang chủ',
    'nav.quotes': 'Báo giá',
    'nav.customers': 'Khách hàng',
    'nav.products': 'Sản phẩm',
    'nav.settings': 'Cài đặt',
    
    // Dashboard
    'dashboard.title': 'Trang chủ',
    'dashboard.welcome': 'Chào mừng đến với phần mềm báo giá xây dựng',
    'dashboard.overview': 'Tổng quan',
    'dashboard.quickActions': 'Thao tác nhanh',
    'dashboard.recentQuotes': 'Báo giá gần đây',
    'dashboard.totalCustomers': 'Tổng số khách hàng',
    'dashboard.totalQuotes': 'Tổng số báo giá',
    'dashboard.totalProducts': 'Tổng số sản phẩm',
    'dashboard.totalRevenue': 'Tổng doanh thu',
    'dashboard.increase': 'Tăng {value}%',
    'dashboard.decrease': 'Giảm {value}%',
    'dashboard.fromLastMonth': 'so với tháng trước',
    'dashboard.noQuotes': 'Chưa có báo giá nào',
    'dashboard.createFirstQuote': 'Tạo báo giá đầu tiên để bắt đầu',
    
    // Quotes
    'quotes.title': 'Báo giá',
    'quotes.new': 'Báo giá mới',
    'quotes.edit': 'Chỉnh sửa báo giá',
    'quotes.view': 'Xem báo giá',
    'quotes.delete': 'Xóa báo giá',
    'quotes.id': 'Mã',
    'quotes.name': 'Tên báo giá',
    'quotes.customer': 'Khách hàng',
    'quotes.status': 'Trạng thái',
    'quotes.total': 'Tổng cộng',
    'quotes.date': 'Ngày tạo',
    'quotes.actions': 'Thao tác',
    'quotes.searchPlaceholder': 'Tìm kiếm báo giá...',
    'quotes.confirmDelete': 'Bạn có chắc chắn muốn xóa báo giá này?',
    'quotes.deleteSuccess': 'Xóa báo giá thành công',
    'quotes.deleteError': 'Lỗi khi xóa báo giá: {message}',
    'quotes.createSuccess': 'Tạo báo giá thành công',
    'quotes.updateSuccess': 'Cập nhật báo giá thành công',
    
    // Quote Status
    'quotes.status.draft': 'Nháp',
    'quotes.status.sent': 'Đã gửi',
    'quotes.status.accepted': 'Đã chấp nhận',
    'quotes.status.rejected': 'Đã từ chối',
    
    // Customers
    'customers.title': 'Khách hàng',
    'customers.new': 'Khách hàng mới',
    'customers.edit': 'Chỉnh sửa khách hàng',
    'customers.view': 'Xem khách hàng',
    'customers.delete': 'Xóa khách hàng',
    'customers.id': 'Mã',
    'customers.name': 'Tên',
    'customers.contact': 'Liên hệ',
    'customers.location': 'Địa chỉ',
    'customers.quotes': 'Báo giá',
    'customers.actions': 'Thao tác',
    'customers.searchPlaceholder': 'Tìm kiếm khách hàng...',
    'customers.confirmDelete': 'Bạn có chắc chắn muốn xóa khách hàng này?',
    'customers.deleteSuccess': 'Xóa khách hàng thành công',
    'customers.deleteError': 'Lỗi khi xóa khách hàng: {message}',
    'customers.createSuccess': 'Tạo khách hàng thành công',
    'customers.updateSuccess': 'Cập nhật khách hàng thành công',
    
    // Products
    'products.title': 'Sản phẩm',
    'products.new': 'Sản phẩm mới',
    'products.edit': 'Chỉnh sửa sản phẩm',
    'products.view': 'Xem sản phẩm',
    'products.delete': 'Xóa sản phẩm',
    'products.id': 'Mã',
    'products.name': 'Tên',
    'products.category': 'Danh mục',
    'products.unitPrice': 'Đơn giá',
    'products.actions': 'Thao tác',
    'products.searchPlaceholder': 'Tìm kiếm sản phẩm...',
    'products.confirmDelete': 'Bạn có chắc chắn muốn xóa sản phẩm này?',
    'products.deleteSuccess': 'Xóa sản phẩm thành công',
    'products.deleteError': 'Lỗi khi xóa sản phẩm: {message}',
    'products.createSuccess': 'Tạo sản phẩm thành công',
    'products.updateSuccess': 'Cập nhật sản phẩm thành công',
    
    // Buttons
    'button.submit': 'Gửi',
    'button.save': 'Lưu',
    'button.cancel': 'Hủy',
    'button.delete': 'Xóa',
    'button.edit': 'Sửa',
    'button.view': 'Xem',
    'button.back': 'Quay lại',
    'button.close': 'Đóng',
    'button.create': 'Tạo mới',
    'button.add': 'Thêm',
    'button.print': 'In',
    
    // Form Fields
    'field.required': 'Trường này là bắt buộc',
    'field.email': 'Vui lòng nhập địa chỉ email hợp lệ',
    'field.minLength': 'Phải có ít nhất {min} ký tự',
    'field.maxLength': 'Không được vượt quá {max} ký tự',
    
    // Toast Messages
    'toast.success': 'Thành công',
    'toast.error': 'Lỗi',
    'toast.loading': 'Đang tải',
    
    // Settings
    'settings.title': 'Cài đặt',
    'settings.appearance': 'Giao diện',
    'settings.general': 'Chung',
    'settings.notifications': 'Thông báo',
    'settings.language': 'Ngôn ngữ',
    'settings.theme': 'Chủ đề',
    'settings.currency': 'Tiền tệ',
    'settings.dateFormat': 'Định dạng ngày',
    
    // Format placeholders
    'format.currency': '{value}₫',
    'format.date.short': 'DD/MM/YYYY',
    'format.date.long': 'D MMMM, YYYY',
    'format.phone': '{value}',
  },
};

/**
 * Custom hook for translations and internationalization
 * Uses Next.js router for locale detection and provides translation functions
 */
export function useTranslation() {
  const router = useRouter();
  // Get locale from router or default to 'en'
  const routerLocale = router.locale || router.defaultLocale || 'en';
  // Use localStorage to persist locale preference
  const [persistedLocale, setPersistedLocale] = useLocalStorage('app-locale', routerLocale);
  
  // If router locale is different from persisted locale, update the persisted locale
  // This can happen when the user changes the locale via URL or when the app first loads
  if (routerLocale !== persistedLocale) {
    setPersistedLocale(routerLocale);
  }
  
  // Current active locale - use persisted locale as the source of truth
  const locale = persistedLocale as keyof typeof locales; 
  
  /**
   * Translate a key with optional value interpolation
   */
  const translate = (key: TranslationKey, values?: TranslationValues): string => {
    // Get the translation for the current locale, with fallbacks
    const currentTranslations = translations[locale] || {};
    const defaultTranslations = translations.en || {};
    const translation = currentTranslations[key] || defaultTranslations[key] || key;
    
    // If no values to interpolate, return the translation as is
    if (!values) {
      return translation;
    }
    
    // Interpolate values into the translation
    return Object.entries(values).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }, translation);
  };
  
  /**
   * Format a currency value according to the current locale
   */
  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    try {
      // Use the built-in Intl.NumberFormat for accurate currency formatting
      if (locale === 'vi') {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      }
      
      // Default (English) formatting
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(numValue);
    } catch (e) {
      // Fallback to basic formatting if Intl is not supported
      if (locale === 'vi') {
        return `${numValue.toLocaleString()}₫`;
      }
      return `$${numValue.toFixed(2)}`;
    }
  };
  
  /**
   * Format a date according to the current locale
   */
  const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      // Use Intl.DateTimeFormat for accurate date formatting
      if (locale === 'vi') {
        if (format === 'long') {
          return new Intl.DateTimeFormat('vi-VN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }).format(dateObj);
        }
        return new Intl.DateTimeFormat('vi-VN').format(dateObj);
      }
      
      // Default (English) formatting
      if (format === 'long') {
        return new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(dateObj);
      }
      return new Intl.DateTimeFormat('en-US').format(dateObj);
    } catch (e) {
      // Fallback to basic formatting
      return dateObj.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
    }
  };
  
  /**
   * Format a phone number according to the current locale
   */
  const formatPhone = (phone: string): string => {
    // Basic phone formatting - would need a proper library for comprehensive formatting
    if (locale === 'vi') {
      // Vietnamese phone format
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        return `(+84) ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
      }
      return phone;
    }
    
    // US phone format
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };
  
  /**
   * Change the current locale
   */
  const changeLocale = (newLocale: string) => {
    if (locales[newLocale as keyof typeof locales]) {
      // Persist the locale preference to localStorage
      setPersistedLocale(newLocale);
      
      // Update the URL with the new locale
      const { pathname, asPath, query } = router;
      router.push({ pathname, query }, asPath, { locale: newLocale, scroll: false });
      
      // Update the HTML lang attribute for accessibility
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
      }
    }
  };
  
  return {
    locale,
    locales,
    t: translate,
    formatCurrency,
    formatDate,
    formatPhone,
    changeLocale
  };
}

/**
 * Standalone function for formatting dates outside of React components
 */
export function formatDateStandalone(
  date: Date | string,
  locale: string = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    // Use Intl.DateTimeFormat with the provided locale and options
    return new Intl.DateTimeFormat(
      locale === 'vi' ? 'vi-VN' : 'en-US',
      options
    ).format(dateObj);
  } catch (e) {
    // Fallback to basic formatting
    return dateObj.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US');
  }
}

/**
 * Standalone function for formatting currency outside of React components
 */
export function formatCurrencyStandalone(
  value: number | string,
  locale: string = 'en'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  try {
    if (locale === 'vi') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numValue);
  } catch (e) {
    // Fallback to basic formatting
    if (locale === 'vi') {
      return `${numValue.toLocaleString()}₫`;
    }
    return `$${numValue.toFixed(2)}`;
  }
}

export default useTranslation; 