import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject, of } from 'rxjs';
import { Product } from './product.service';

export interface UserResponse {
  id: number;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface OrderItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  product: any; // Raw backend product
}

export interface OrderResponse {
  id: number;
  total_price: number;
  delivery_fee: number;
  status: string;
  created_at: string;
  items: OrderItemResponse[];
}

export interface ChatbotResponse {
  text: string;
  matched_product_id?: number | null;
  suggestions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BASE_URL = 'http://127.0.0.1:8000/api';
  private readonly TOKEN_KEY = 'health_go_token';

  // Signals for state management
  readonly currentUser = signal<UserResponse | null>(null);
  readonly isLoggedIn = computed(() => !!this.currentUser());
  readonly isAuthLoading = signal<boolean>(true);

  constructor(private readonly http: HttpClient) {
    this.checkSession();
  }

  // Check if token exists and load user info
  private checkSession(): void {
    const token = this.getToken();
    if (!token) {
      this.isAuthLoading.set(false);
      return;
    }

    this.getMe().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isAuthLoading.set(false);
      },
      error: () => {
        // Token is stale or invalid, clear session
        this.clearSession();
        this.isAuthLoading.set(false);
      }
    });
  }

  // Token management
  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (e) {
      console.warn('Could not save auth token to localStorage', e);
    }
  }

  private clearSession(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch {}
    this.currentUser.set(null);
  }

  // Headers helper
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // --- API CALLS ---

  // Auth: Register
  register(email: string, password: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.BASE_URL}/auth/register`, { email, password }).pipe(
      catchError(this.handleError)
    );
  }

  // Auth: Login
  login(email: string, password: string): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.BASE_URL}/auth/login`, { email, password }).pipe(
      tap(res => {
        this.setToken(res.access_token);
      }),
      tap(() => {
        // Load user details upon successful login
        this.getMe().subscribe(user => this.currentUser.set(user));
      }),
      catchError(this.handleError)
    );
  }

  // Auth: Get Current User
  getMe(): Observable<UserResponse> {
    const headers = this.getHeaders();
    return this.http.get<UserResponse>(`${this.BASE_URL}/auth/me`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Auth: Logout
  logout(): void {
    this.clearSession();
  }

  // Products: Get All
  getProducts(): Observable<Product[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/products`).pipe(
      tap(products => console.log('Fetched products:', products)),
      catchError(this.handleError)
    );
  }

  // Orders: Place checkout order
  placeOrder(items: { product_id: number; quantity: number }[], deliveryFee: number): Observable<OrderResponse> {
    const headers = this.getHeaders();
    const payload = { items, delivery_fee: deliveryFee };
    return this.http.post<OrderResponse>(`${this.BASE_URL}/orders`, payload, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Orders: Get User Order History
  getOrders(): Observable<OrderResponse[]> {
    const headers = this.getHeaders();
    return this.http.get<OrderResponse[]>(`${this.BASE_URL}/orders`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Chatbot: Query AI Bot
  queryChatbot(message: string): Observable<ChatbotResponse> {
    return this.http.post<ChatbotResponse>(`${this.BASE_URL}/chatbot`, { message }).pipe(
      catchError(this.handleError)
    );
  }

  // Central Error Handler
  private handleError(error: any) {
    let errorMessage = 'An unknown error occurred.';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.detail) {
      // Backend structured HTTP exceptions
      errorMessage = error.error.detail;
    } else if (error.status) {
      errorMessage = `Backend returned code ${error.status}: ${error.statusText || error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
