import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModalComponent {
  private readonly apiService = inject(ApiService);
  private readonly cartService = inject(CartService);

  @Input({ required: true }) isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly email = signal<string>('');
  readonly password = signal<string>('');
  readonly isRegisterMode = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly isLoading = signal<boolean>(false);

  toggleMode(): void {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.errorMessage.set('');
  }

  onSubmit(): void {
    const emailVal = this.email().trim();
    const pwdVal = this.password().trim();

    if (!emailVal || !pwdVal) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (this.isRegisterMode()) {
      // Register logic
      this.apiService.register(emailVal, pwdVal).subscribe({
        next: () => {
          // Auto login after registration
          this.apiService.login(emailVal, pwdVal).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.cartService.triggerToast('Account created and logged in!', 'success');
              this.resetForm();
              this.close.emit();
            },
            error: (loginErr) => {
              this.isLoading.set(false);
              this.errorMessage.set(loginErr.message || 'Login failed after registration.');
            }
          });
        },
        error: (regErr) => {
          this.isLoading.set(false);
          this.errorMessage.set(regErr.message || 'Registration failed.');
        }
      });
    } else {
      // Login logic
      this.apiService.login(emailVal, pwdVal).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.cartService.triggerToast('Welcome back to Health Go!', 'success');
          this.resetForm();
          this.close.emit();
        },
        error: (loginErr) => {
          this.isLoading.set(false);
          this.errorMessage.set(loginErr.message || 'Invalid email or password.');
        }
      });
    }
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.email.set('');
    this.password.set('');
    this.isRegisterMode.set(false);
    this.errorMessage.set('');
    this.isLoading.set(false);
  }
}
