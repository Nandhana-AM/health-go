import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css'
})
export class CartDrawerComponent {
  private readonly cartService = inject(CartService);
  private readonly apiService = inject(ApiService);
  private readonly productService = inject(ProductService);

  @Input({ required: true }) isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() openAuth = new EventEmitter<void>(); // Added to prompt login on checkout

  // Expose signals from CartService
  readonly cartItems = this.cartService.cartItems;
  readonly totalPrice = this.cartService.totalPrice;
  readonly totalItems = this.cartService.totalItems;

  readonly isCheckingOut = signal<boolean>(false);

  updateQty(productId: number, event: Event, currentQty: number): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val)) {
      this.cartService.updateQuantity(productId, val);
    }
  }

  incrementItem(productId: number, currentQty: number): void {
    this.cartService.updateQuantity(productId, currentQty + 1);
  }

  decrementItem(productId: number, currentQty: number): void {
    this.cartService.updateQuantity(productId, currentQty - 1);
  }

  removeItem(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  checkout(): void {
    if (this.cartItems().length === 0) return;
    
    // Enforce login before checking out
    if (!this.apiService.isLoggedIn()) {
      this.close.emit();
      this.openAuth.emit();
      this.cartService.triggerToast('Please sign in or register to complete your order.', 'info');
      return;
    }

    this.isCheckingOut.set(true);
    
    // Calculate delivery charge (free shipping above ₹500)
    const deliveryFee = this.totalPrice() >= 500 ? 0 : 50;
    
    // Build order items payload
    const orderItems = this.cartItems().map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    this.apiService.placeOrder(orderItems, deliveryFee).subscribe({
      next: () => {
        this.isCheckingOut.set(false);
        this.cartService.clearCart();
        this.cartService.triggerToast('Thank you! Your order was placed successfully.', 'success');
        
        // Refresh product stock levels in store
        // We will call the public loadProductsFromApi method
        this.productService.loadProductsFromApi();
        
        this.close.emit();
      },
      error: (err) => {
        this.isCheckingOut.set(false);
        this.cartService.triggerToast(err.message || 'Checkout failed. Please check stock availability.', 'info');
      }
    });
  }
}
