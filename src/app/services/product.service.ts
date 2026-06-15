import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: string;
  stock_quantity: number; // Added for live stock checking
  colorTheme: string;      // Gradient details for card visuals
  emoji: string;           // Fallback emoji icon
  svgPath: string;         // Custom SVG representation
  ingredients: string[];
  benefits: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiService = inject(ApiService);
  private readonly products = signal<Product[]>([]);

  constructor() {
    this.loadProductsFromApi();
  }

  loadProductsFromApi(): void {
    this.apiService.getProducts().subscribe({
      next: (data) => {
        const mapped = data.map((item: any) => this.mapBackendProduct(item));
        this.products.set(mapped);
      },
      error: (err) => {
        console.error('Failed to load products from local API, database might not be running:', err);
      }
    });
  }

  private mapBackendProduct(bp: any): Product {
    return {
      id: bp.id,
      name: bp.name,
      category: bp.category,
      price: bp.price,
      quantity: bp.quantity_description, // maps quantity_description to quantity
      stock_quantity: bp.stock_quantity,
      colorTheme: bp.color_theme,          // maps color_theme to colorTheme
      emoji: bp.emoji || '',
      svgPath: bp.svg_path || '',
      ingredients: bp.ingredients || [],
      benefits: bp.benefits || []
    };
  }

  getProducts(): Product[] {
    return this.products();
  }

  getCategories(): string[] {
    return ['All', 'Vegetables', 'Fruits', 'Grains & Seeds', 'Beverages', 'Superfoods'];
  }

  getFilteredProducts(
    searchQuery: string,
    category: string,
    maxPrice: number
  ): Product[] {
    const query = searchQuery.trim().toLowerCase();
    return this.products().filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(query) || 
                            product.category.toLowerCase().includes(query) ||
                            product.ingredients.some(i => i.toLowerCase().includes(query));
      
      const matchesCategory = category === 'All' || product.category === category;
      
      const matchesPrice = product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }

  getMaxProductPrice(): number {
    const list = this.products();
    if (list.length === 0) return 500; // sensible default limit
    return Math.ceil(Math.max(...list.map(p => p.price)));
  }
}

