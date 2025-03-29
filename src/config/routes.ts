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
      detail: (id: string) => `/admin/quotes/${id}`,
      edit: (id: string) => `/admin/quotes/${id}/edit`,
    },
    products: {
      list: '/admin/products',
      new: '/admin/products/new',
      detail: (id: string) => `/admin/products/${id}`,
      edit: (id: string) => `/admin/products/${id}/edit`,
    },
    customers: {
      list: '/admin/customers',
      new: '/admin/customers/new',
      detail: (id: string) => `/admin/customers/${id}`,
      edit: (id: string) => `/admin/customers/${id}/edit`,
    },
  },
} as const;

export type AppRoutes = typeof routes;

// Navigation menu structure
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