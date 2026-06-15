import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  private readonly cartService = inject(CartService);
  private readonly apiService = inject(ApiService);
  
  readonly totalItems = this.cartService.totalItems;
  readonly isLoggedIn = this.apiService.isLoggedIn;
  readonly currentUser = this.apiService.currentUser;

  readonly showDropdown = signal<boolean>(false);

  @Output() openCart = new EventEmitter<void>();
  @Output() openAuth = new EventEmitter<void>();
  @Output() openOrders = new EventEmitter<void>();

  toggleUserDropdown(): void {
    this.showDropdown.set(!this.showDropdown());
  }

  viewOrders(): void {
    this.showDropdown.set(false);
    this.openOrders.emit();
  }

  onLogout(): void {
    this.showDropdown.set(false);
    this.apiService.logout();
    this.cartService.triggerToast('Logged out successfully', 'info');
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
