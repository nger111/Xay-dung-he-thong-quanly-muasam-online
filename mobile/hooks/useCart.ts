import { useCartStore } from '../store/cartStore';

export function useCart() {
  const { items, totalAmount, totalItems, addItem, removeItem, updateQuantity, clearCart } =
    useCartStore();

  const isInCart = (productId: string) => items.some((i) => i.productId === productId);

  const getQuantity = (productId: string) =>
    items.find((i) => i.productId === productId)?.quantity ?? 0;

  const formatPrice = (price: number) =>
    price.toLocaleString('vi-VN') + 'đ';

  return {
    items,
    totalAmount,
    totalItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isInCart,
    getQuantity,
    formatPrice,
  };
}
