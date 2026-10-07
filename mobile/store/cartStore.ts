import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Product } from '../services/api';
export type { Product } from '../services/api';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  sellingPrice: number;
  barcode: string;
  stockQuantity: number;
  unit?: string;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  addItem: (product: Product | CartProduct) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalAmount: 0,

      addItem: (product) => {
        if (product.stockQuantity <= 0) return false;
        const current = get().items.find((item) => item.product.id === product.id);
        if (current) {
          if (current.quantity >= product.stockQuantity) return false;
          const items = get().items.map((item) =>
            item.product.id === product.id
              ? { product, quantity: item.quantity + 1 }
              : item
          );
          const availableItems = items.filter((item) => item.quantity > 0);
          set({ items: availableItems, totalAmount: getCartTotal(availableItems) });
        } else {
          const items = [...get().items, { product, quantity: 1 }];
          set({ items, totalAmount: getCartTotal(items) });
        }
        return true;
      },

      removeItem: (productId) => {
        const items = get().items.filter((item) => item.product.id !== productId);
        set({ items, totalAmount: getCartTotal(items) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const items = get().items.map((item) => {
          if (item.product.id !== productId) return item;
          return {
            ...item,
            quantity: Math.min(quantity, item.product.stockQuantity),
          };
        });
        const availableItems = items.filter((item) => item.quantity > 0);
        set({ items: availableItems, totalAmount: getCartTotal(availableItems) });
      },

      clearCart: () => set({ items: [], totalAmount: 0 }),
    }),
    {
      name: 'customer-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, totalAmount: state.totalAmount }),
    }
  )
);

export const getCartTotal = (items: CartItem[]) =>
  items.reduce(
    (total, item) => total + item.product.sellingPrice * item.quantity,
    0
  );
