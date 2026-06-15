import { Component, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, OrderResponse } from '../../services/api.service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.html',
  styleUrl: './order-history.css'
})
export class OrderHistoryComponent {
  private readonly apiService = inject(ApiService);

  @Input({ required: true }) isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly orders = signal<OrderResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  
  // Track expanded order IDs
  readonly expandedOrders = signal<{ [key: number]: boolean }>({});

  constructor() {
    // Reload orders when the drawer is opened
    effect(() => {
      if (this.isOpen && this.apiService.isLoggedIn()) {
        this.loadOrders();
      }
    }, { allowSignalWrites: true });
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.apiService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch orders:', err);
        this.errorMessage.set(err.message || 'Could not load your orders.');
        this.isLoading.set(false);
      }
    });
  }

  toggleExpand(orderId: number): void {
    const current = this.expandedOrders();
    this.expandedOrders.set({
      ...current,
      [orderId]: !current[orderId]
    });
  }

  isExpanded(orderId: number): boolean {
    return !!this.expandedOrders()[orderId];
  }

  trackByOrderId(index: number, order: OrderResponse): number {
    return order.id;
  }
}
