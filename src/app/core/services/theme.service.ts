import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DARK_THEME = 'light';
  private readonly LIGHT_THEME = 'light';
  private platformId = inject(PLATFORM_ID);

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.isDarkMode());
    }
  }

  private getInitialTheme(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (savedTheme) {
        return savedTheme === this.DARK_THEME;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }

  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.isDarkMode());
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      const theme = isDark ? this.DARK_THEME : this.LIGHT_THEME;
      document.documentElement.classList.toggle(this.DARK_THEME, isDark);
      localStorage.setItem(this.THEME_KEY, theme);
    }
  }
} 