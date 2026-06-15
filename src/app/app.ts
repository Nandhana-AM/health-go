import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { HeroComponent } from './components/hero/hero';
import { ProductListComponent } from './components/product-list/product-list';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { ToastNotificationComponent } from './components/toast-notification/toast-notification';
import { ChatbotComponent } from './components/chatbot/chatbot';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { OrderHistoryComponent } from './components/order-history/order-history';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    NavbarComponent,
    HeroComponent,
    ProductListComponent,
    CartDrawerComponent,
    ToastNotificationComponent,
    ChatbotComponent,
    AuthModalComponent,
    OrderHistoryComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly isCartOpen = signal<boolean>(false);
  readonly isAuthOpen = signal<boolean>(false);
  readonly isOrdersOpen = signal<boolean>(false);

  openCart(): void {
    this.isCartOpen.set(true);
  }

  closeCart(): void {
    this.isCartOpen.set(false);
  }

  openAuth(): void {
    this.isAuthOpen.set(true);
  }

  closeAuth(): void {
    this.isAuthOpen.set(false);
  }

  openOrders(): void {
    this.isOrdersOpen.set(true);
  }

  closeOrders(): void {
    this.isOrdersOpen.set(false);
  }
}

