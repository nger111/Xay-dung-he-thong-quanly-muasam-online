import type { Href } from 'expo-router';

export const routes = {
  login: '/login' as Href,
  register: '/register' as Href,
  home: '/' as Href,
  catalog: '/catalog' as Href,
  catalogSearch: (query: string) => `/catalog?q=${encodeURIComponent(query)}` as Href,
  catalogCategory: (id: string) => `/catalog?category_id=${encodeURIComponent(id)}` as Href,
  scan: '/scan' as Href,
  cart: '/cart' as Href,
  checkout: '/checkout' as Href,
  orders: '/orders' as Href,
  product: (id: string) => `/product/${encodeURIComponent(id)}` as Href,
  order: (id: string) => `/order/${encodeURIComponent(id)}` as Href,
};
