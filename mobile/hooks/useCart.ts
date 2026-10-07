import { useCartStore } from '../store/cartStore';

export function useCart() {
  const { items, totalAmount, addItem, removeItem, updateQuantity, clearCart } = useCartStore();
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const isInCart = (productId: string) =>
    items.some((item) => item.product.id === productId);

  const getQuantity = (productId: string) =>
    items.find((item) => item.product.id === productId)?.quantity ?? 0;

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
