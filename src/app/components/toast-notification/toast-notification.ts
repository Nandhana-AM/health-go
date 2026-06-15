import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-notification.html',
  styleUrl: './toast-notification.css'
})
export class ToastNotificationComponent {
  private readonly cartService = inject(CartService);
  
  readonly toasts = this.cartService.toasts;
}
