import { Injectable, inject, effect } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private settingsService = inject(SettingsService);

  constructor() {
    // Listen for changes in global settings and apply theme
    effect(() => {
      const primaryColor = this.settingsService.settings()['PrimaryColor'] || '#4f46e5';
      this.applyTheme(primaryColor);
    });
  }

  applyTheme(color: string) {
    document.documentElement.style.setProperty('--primary-color', color);
    // Generate a slightly darker hover color (Simple implementation)
    const hoverColor = this.adjustColor(color, -20);
    document.documentElement.style.setProperty('--primary-hover', hoverColor);
  }

  private adjustColor(col: string, amt: number) {
    let usePound = false;
    if (col[0] === "#") {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }
}
