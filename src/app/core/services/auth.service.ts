import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { AuthResponse, RegisterPayload, User } from '../models/api.models';

const TOKEN_KEY = 'uber_jwt_token';
const USER_KEY = 'uber_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiConfig = inject(ApiConfigService);

  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  readonly isAuthenticated = computed(() => !!this.token() && !!this.currentUser());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiConfig.endpoint('/auth/register'), payload).pipe(
      tap((res) => {
        if (res.access_token && res.user) {
          this.saveSession(res.access_token, res.user);
        }
      })
    );
  }

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiConfig.endpoint('/auth/login'), { login, password }).pipe(
      tap((res) => {
        if (res.access_token && res.user) {
          this.saveSession(res.access_token, res.user);
        }
      })
    );
  }

  getMe(): Observable<{ success: boolean; user: User }> {
    return this.http.get<{ success: boolean; user: User }>(this.apiConfig.endpoint('/auth/me')).pipe(
      tap((res) => {
        if (res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }
      })
    );
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(this.apiConfig.endpoint('/auth/logout'), {}).pipe(
      tap({
        next: () => this.clearSession(),
        error: () => this.clearSession()
      })
    );
  }

  forgotPassword(email: string, new_password: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      this.apiConfig.endpoint('/auth/forgot-password'),
      { email, new_password }
    );
  }

  saveSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  navigateByRole(role?: string): void {
    const targetRole = role || this.currentUser()?.role;
    if (targetRole === 'admin') {
      this.router.navigate(['/admin']);
    } else if (targetRole === 'driver') {
      this.router.navigate(['/driver']);
    } else {
      this.router.navigate(['/client']);
    }
  }
}

