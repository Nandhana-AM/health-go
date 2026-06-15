import { Injectable, signal, computed } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'health_go_cart';

  // State
  readonly cartItems = signal<CartItem[]>(this.loadCartFromStorage());
  readonly toasts = signal<ToastMessage[]>([]);

  // Computed state (reactive)
  readonly totalItems = computed(() => {
    return this.cartItems().reduce((total, item) => total + item.quantity, 0);
  });

  readonly totalPrice = computed(() => {
    return this.cartItems().reduce((total, item) => total + (item.product.price * item.quantity), 0);
  });

  constructor() {}

  private loadCartFromStorage(): CartItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('LocalStorage not available, running in-memory', e);
      return [];
    }
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage write failed', e);
    }
  }

  addToCart(product: Product, quantityToAdd: number = 1): void {
    if (product.stock_quantity <= 0) {
      this.triggerToast(`Sorry, ${product.name} is out of stock!`, 'info');
      return;
    }

    const currentItems = this.cartItems();
    const existing = currentItems.find(item => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const allowedQty = product.stock_quantity - currentQty;

    if (allowedQty <= 0) {
      this.triggerToast(`All available stock (${product.stock_quantity} units) of ${product.name} is already in your cart!`, 'info');
      return;
    }

    let finalAdd = quantityToAdd;
    if (quantityToAdd > allowedQty) {
      this.triggerToast(`Only ${product.stock_quantity} units of ${product.name} left in stock!`, 'info');
      finalAdd = allowedQty;
    }

    let updatedItems: CartItem[];
    if (existing) {
      updatedItems = currentItems.map(item => {
        if (item.product.id === product.id) {
          return { ...item, quantity: item.quantity + finalAdd };
        }
        return item;
      });
    } else {
      updatedItems = [...currentItems, { product, quantity: finalAdd }];
    }

    this.cartItems.set(updatedItems);
    this.saveCartToStorage(updatedItems);
    this.triggerToast(`Added ${finalAdd}x ${product.name} to cart!`);
  }

  removeFromCart(productId: number): void {
    const currentItems = this.cartItems();
    const product = currentItems.find(item => item.product.id === productId)?.product;
    const updatedItems = currentItems.filter(item => item.product.id !== productId);
    
    this.cartItems.set(updatedItems);
    this.saveCartToStorage(updatedItems);
    
    if (product) {
      this.triggerToast(`Removed ${product.name} from cart`, 'info');
    }
  }

  updateQuantity(productId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentItems = this.cartItems();
    const item = currentItems.find(i => i.product.id === productId);
    if (!item) return;

    let finalQty = newQuantity;
    if (newQuantity > item.product.stock_quantity) {
      this.triggerToast(`Only ${item.product.stock_quantity} units of ${item.product.name} left in stock!`, 'info');
      finalQty = item.product.stock_quantity;
    }

    const updatedItems = currentItems.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: finalQty };
      }
      return item;
    });

    this.cartItems.set(updatedItems);
    this.saveCartToStorage(updatedItems);
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.saveCartToStorage([]);
    this.triggerToast('Cart cleared', 'info');
  }

  // Toast Management
  triggerToast(message: string, type: 'success' | 'info' = 'success'): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type };
    
    this.toasts.update(current => [...current, newToast]);

    // Automatically remove toast after 3.2 seconds (matches CSS animation duration)
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, 3200);
  }
}
