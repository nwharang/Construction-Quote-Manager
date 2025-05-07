/**
 * Application route definitions
 * Centralized route configuration to avoid hardcoding URLs throughout the application
 */

export type BreadcrumbItem = {
  label: string;
  href: string;
};

/**
 * Helper type for entity names used in breadcrumbs
 */
export type EntityNames = {
  singular: string;
  plural: string;
};

/**
 * Entity definitions for consistent naming throughout the application
 */
export const entities = {
  dashboard: {
    singular: 'Dashboard',
    plural: 'Dashboard',
  },
  product: {
    singular: 'Product',
    plural: 'Products',
  },
  category: {
    singular: 'Category',
    plural: 'Categories',
  },
  customer: {
    singular: 'Customer',
    plural: 'Customers',
  },
  quote: {
    singular: 'Quote',
    plural: 'Quotes',
  },
  instruction: {
    singular: 'Instruction',
    plural: 'Instructions',
  },
} as const;

export const routes = {
  auth: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    signOut: '/auth/signout',
  },
  admin: {
    dashboard: '/admin/dashboard',
    quotes: {
      list: '/admin/quotes',
      new: '/admin/quotes/new',
      /**
       * Generate a route to a specific quote details page
       * @param id Quote ID
       * @returns Quote detail URL
       */
      detail: (id: string) => `/admin/quotes/${id}/view`,
      /**
       * Generate a route to edit a specific quote
       * @param id Quote ID
       * @returns Quote edit URL
       */
      edit: (id: string) => `/admin/quotes/${id}/edit`,
      /**
       * Generate a route to print a specific quote
       * @param id Quote ID
       * @returns Quote print URL
       */
      print: (id: string) => `/admin/quotes/${id}/print`,
    },
    products: {
      list: '/admin/products',
      new: '/admin/products/new',
      /**
       * Generate a route to a specific product details page
       * @param id Product ID
       * @returns Product detail URL
       */
      detail: (id: string) => `/admin/products/${id}/view`,
      /**
       * Generate a route to edit a specific product
       * @param id Product ID
       * @returns Product edit URL
       */
      edit: (id: string) => `/admin/products/${id}/edit`,
    },
    categories: {
      list: '/admin/categories',
      new: '/admin/categories/new',
      /**
       * Generate a route to a specific category details page
       * @param id Category ID
       * @returns Category detail URL
       */
      detail: (id: string) => `/admin/categories/${id}/view`,
      /**
       * Generate a route to edit a specific category
       * @param id Category ID
       * @returns Category edit URL
       */
      edit: (id: string) => `/admin/categories/${id}/edit`,
    },
    customers: {
      list: '/admin/customers',
      new: '/admin/customers/new',
      /**
       * Generate a route to a specific customer details page
       * @param id Customer ID
       * @returns Customer detail URL
       */
      detail: (id: string) => `/admin/customers/${id}/view`,
      /**
       * Generate a route to edit a specific customer
       * @param id Customer ID
       * @returns Customer edit URL
       */
      edit: (id: string) => `/admin/customers/${id}/edit`,
    },
    settings: '/admin/settings',
  },
  instruction: {
    list: '/instructions',
  },
} as const;

/**
 * Type definition for application routes
 */
export type AppRoutes = typeof routes;

/**
 * Navigation menu structure for sidebar navigation
 * Maps routes to labels and icons
 */
export const navigationMenu = [
  {
    label: 'Dashboard',
    href: routes.admin.dashboard,
    icon: 'HomeIcon', // You can map these to actual icons in your components
  },
  {
    label: 'Quotes',
    href: routes.admin.quotes.list,
    icon: 'DocumentTextIcon',
  },
  {
    label: 'Products',
    href: routes.admin.products.list,
    icon: 'CubeIcon',
  },
  {
    label: 'Customers',
    href: routes.admin.customers.list,
    icon: 'UserIcon',
  },
  {
    label: 'Instructions',
    href: routes.instruction.list,
    icon: 'BookOpenIcon',
  },
] as const;
