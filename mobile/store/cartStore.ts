import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;      // giá bán (sellingPrice / exportPrice)
  barcode: string;
  code: string;
  importPrice: number;
  stockQuantity: number;
  unit?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;

  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const calcTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,

  addItem: (product: Product) => {
    const items = get().items;
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    let newItems: CartItem[];
    if (existingIndex >= 0) {
      newItems = items.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newItems = [...items, { product, quantity: 1 }];
    }

    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  removeItem: (productId: string) => {
    const newItems = get().items.filter((i) => i.product.id !== productId);
    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  clearCart: () => set({ items: [], totalAmount: 0 }),
}));
