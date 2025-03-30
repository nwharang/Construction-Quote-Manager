/**
 * Application route definitions
 * Centralized route configuration to avoid hardcoding URLs throughout the application
 */
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
      detail: (id: string) => `/admin/quotes/${id}`,
      /**
       * Generate a route to edit a specific quote
       * @param id Quote ID
       * @returns Quote edit URL
       */
      edit: (id: string) => `/admin/quotes/${id}/edit`,
    },
    products: {
      list: '/admin/products',
      new: '/admin/products/new',
      /**
       * Generate a route to a specific product details page
       * @param id Product ID
       * @returns Product detail URL
       */
      detail: (id: string) => `/admin/products/${id}`,
      /**
       * Generate a route to edit a specific product
       * @param id Product ID
       * @returns Product edit URL
       */
      edit: (id: string) => `/admin/products/${id}/edit`,
    },
    customers: {
      list: '/admin/customers',
      new: '/admin/customers/new',
      /**
       * Generate a route to a specific customer details page
       * @param id Customer ID
       * @returns Customer detail URL
       */
      detail: (id: string) => `/admin/customers/${id}`,
      /**
       * Generate a route to edit a specific customer
       * @param id Customer ID
       * @returns Customer edit URL
       */
      edit: (id: string) => `/admin/customers/${id}/edit`,
    },
    accessibility: {
      index: '/admin/accessibility',
      guidelines: '/admin/accessibility/guidelines',
      demo: '/admin/accessibility/demo',
    },
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
] as const;
