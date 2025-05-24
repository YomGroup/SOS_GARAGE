import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const THEME_CONSTANTS = {
  DARK: 'dark',
  LIGHT: 'light',
  STORAGE_KEY: 'theme'
};

@Injectable({
  providedIn: 'root'
})
export class ThemePersistenceService {
  private platformId = inject(PLATFORM_ID);

  saveTheme(theme: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(THEME_CONSTANTS.STORAGE_KEY, theme);
    }
  }

  getTheme(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(THEME_CONSTANTS.STORAGE_KEY);
    }
    return null;
  }

  getSystemTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }
} 