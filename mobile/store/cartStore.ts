import { create } from 'zustand';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  stockQuantity: number;
  unit?: string;
  sellingPrice?: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  addItem: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const calcTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => {
    if (!item?.product) return sum;
    const price = item.product.sellingPrice ?? item.product.price ?? 0;
    return sum + price * (item.quantity || 0);
  }, 0);

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,

  addItem: (product: CartProduct) => {
    if (!product || !product.id || !product.name) return;
    const items = get().items.filter((i) => i?.product?.id && i?.product?.name);
    const existingIndex = items.findIndex((i) => i.product.id === product.id);
    let newItems: CartItem[];
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const maxStock = product.stockQuantity ?? 999;
      if (existing.quantity >= maxStock) return;
      newItems = items.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newItems = [...items, { product, quantity: 1 }];
    }
    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  removeItem: (productId: string) => {
    const newItems = get().items.filter((i) => i?.product?.id && i.product.id !== productId);
    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items
      .filter((i) => i?.product?.id)
      .map((item) => (item.product.id === productId ? { ...item, quantity } : item));
    set({ items: newItems, totalAmount: calcTotal(newItems) });
  },

  clearCart: () => set({ items: [], totalAmount: 0 }),
}));
