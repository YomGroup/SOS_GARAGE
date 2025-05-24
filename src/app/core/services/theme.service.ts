import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemePersistenceService, THEME_CONSTANTS } from './theme-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private themePersistence = inject(ThemePersistenceService);

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.isDarkMode());
    }
  }

  private getInitialTheme(): boolean {
    const savedTheme = this.themePersistence.getTheme();
    if (savedTheme) {
      return savedTheme === THEME_CONSTANTS.DARK;
    }
    return this.themePersistence.getSystemTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.isDarkMode());
    }
  }

  private applyTheme(isDark: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      const theme = isDark ? THEME_CONSTANTS.DARK : THEME_CONSTANTS.LIGHT;
      document.documentElement.classList.toggle(THEME_CONSTANTS.DARK, isDark);
      this.themePersistence.saveTheme(theme);
    }
  }
} 