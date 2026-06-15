import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ProductCardComponent } from '../product-card/product-card';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ProductCardComponent, 
    ProductDetailModalComponent
  ],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css'
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  // Filter States (using signals)
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('All');
  readonly maxPriceLimit = computed(() => this.productService.getMaxProductPrice());
  readonly maxPrice = signal<number>(500);

  constructor() {
    // When the product prices load from the backend, automatically adjust the slider default
    effect(() => {
      this.maxPrice.set(this.maxPriceLimit());
    });
  }

  // Selected product for popup modal
  readonly selectedProduct = signal<Product | null>(null);

  // Reactive computed listing
  readonly categories = this.productService.getCategories();

  
  readonly filteredProducts = computed(() => {
    return this.productService.getFilteredProducts(
      this.searchQuery(),
      this.selectedCategory(),
      this.maxPrice()
    );
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('All');
    this.maxPrice.set(this.maxPriceLimit());
  }

  // Card click triggers details
  openDetails(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeDetails(): void {
    this.selectedProduct.set(null);
  }

  // Add to cart hooks
  addProductToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  addMultipleToCart(event: { product: Product, quantity: number }): void {
    this.cartService.addToCart(event.product, event.quantity);
  }
}
