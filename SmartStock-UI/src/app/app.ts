import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent ,CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  authService = inject(AuthService); // Public for signal access in template
  private themeService = inject(ThemeService); // Just inject to activate
  private router = inject(Router);

  isProfileMenuOpen = signal(false);

  constructor() {
    this.applyInitialTheme();
  }

  private applyInitialTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.closeProfileMenu();
    }
  }

  toggleProfileMenu() {
    this.isProfileMenuOpen.set(!this.isProfileMenuOpen());
  }

  closeProfileMenu() {
    this.isProfileMenuOpen.set(false);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  title = 'SmartStock-UI';

}
