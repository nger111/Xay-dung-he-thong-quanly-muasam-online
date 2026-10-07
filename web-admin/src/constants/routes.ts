export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  INVENTORY: '/inventory',
  SUPPLIERS: '/suppliers',
  ORDERS: '/orders',
  IMPORTS: '/imports',
  USERS: '/users',
  REPORTS: '/reports',
  POS: '/pos',
} as const;

export type RouteKey = keyof typeof ROUTES;
