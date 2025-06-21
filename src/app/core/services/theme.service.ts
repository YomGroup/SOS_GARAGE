import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemePersistenceService, THEME_CONSTANTS } from './theme-persistence.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DARK_THEME = 'dark';
  private readonly LIGHT_THEME = 'light';
  private platformId = inject(PLATFORM_ID);
  private themePersistence = inject(ThemePersistenceService);

  isDarkMode = signal<boolean>(this.getInitialTheme());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme(this.isDarkMode());
    }
  }

  private getInitialTheme(): boolean {
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
      const theme = isDark ? THEME_CONSTANTS.DARK : THEME_CONSTANTS.LIGHT;
      document.documentElement.classList.toggle(THEME_CONSTANTS.DARK, isDark);
      this.themePersistence.saveTheme(theme);
    }
  }
} 