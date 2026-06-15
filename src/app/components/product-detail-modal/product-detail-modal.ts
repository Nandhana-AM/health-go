import { Component, Input, Output, EventEmitter, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../services/product.service';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.css'
})
export class ProductDetailModalComponent {
  @Input({ required: true }) product: Product | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<{ product: Product, quantity: number }>();

  // Local state for quantity select
  readonly quantity = signal<number>(1);

  constructor() {
    // Reset quantity back to 1 whenever product input changes
    effect(() => {
      if (this.product) {
        this.quantity.set(1);
      }
    });
  }

  increment(): void {
    this.quantity.update(q => q + 1);
  }

  decrement(): void {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
    }
  }

  submitAddToCart(): void {
    if (this.product) {
      this.addToCart.emit({
        product: this.product,
        quantity: this.quantity()
      });
      this.close.emit();
    }
  }
}
