import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

const STORAGE_API_KEY = 'uber_api_base_url';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  readonly apiUrl = signal<string>(this.loadInitialUrl());

  private loadInitialUrl(): string {
    const saved = localStorage.getItem(STORAGE_API_KEY);
    return saved ? saved : environment.apiUrl;
  }

  get baseUrl(): string {
    return this.apiUrl();
  }

  setBaseUrl(url: string): void {
    const clean = url.trim().replace(/\/+$/, '');
    this.apiUrl.set(clean);
    localStorage.setItem(STORAGE_API_KEY, clean);
  }

  resetToDefault(): void {
    this.apiUrl.set(environment.apiUrl);
    localStorage.removeItem(STORAGE_API_KEY);
  }

  endpoint(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${cleanPath}`;
  }
}

