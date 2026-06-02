import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SettingsService, GlobalSetting } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  private settingsService = inject(SettingsService);

  // Global Settings State
  globalSettings = signal<GlobalSetting[]>([]);
  groupedSettings = signal<any>({});

  // Theme State
  isDarkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  ngOnInit() {
    this.applyTheme();
    this.loadSettings();
  }

  loadSettings() {
    this.settingsService.getSettings().subscribe(res => {
      this.globalSettings.set(res);
      this.groupSettings(res);
    });
  }

  groupSettings(settings: GlobalSetting[]) {
    const groups = settings.reduce((acc: any, curr) => {
      const group = curr.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(curr);
      return acc;
    }, {});
    this.groupedSettings.set(groups);
  }

  saveGlobalSettings() {
    this.settingsService.updateSettings(this.globalSettings()).subscribe({
      next: () => {
        Swal.fire('Success', 'Global settings updated successfully', 'success');
      },
      error: () => {
        Swal.fire('Error', 'Failed to update settings', 'error');
      }
    });
  }

  // Get Object Keys for template iteration
  getGroups() {
    return Object.keys(this.groupedSettings());
  }

  toggleTheme() {
    this.isDarkMode.update(val => !val);
    localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkMode()) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  saveEmailSettings() {
    // In a real app, this would call a service to save to the backend
    Swal.fire({
      icon: 'success',
      title: 'Settings Saved',
      text: 'Your email notification preferences have been updated.',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
