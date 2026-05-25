import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
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

  // Theme State
  isDarkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  // Email Settings State (Mock)
  emailSettings = signal({
    orderConfirmation: true,
    lowStockAlert: true,
    weeklyReport: false,
    securityAlerts: true
  });

  ngOnInit() {
    this.applyTheme();
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
