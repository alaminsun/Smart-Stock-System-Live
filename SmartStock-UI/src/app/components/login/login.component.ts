import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // Required for reactive forms and routing
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private menuService = inject(MenuService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  // Login form with validation
  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.toastr.success('Welcome back!', 'Login Successful');
          this.redirectUser();
        },
        error: (err) => {
          this.toastr.error('Invalid username/email or password', 'Authentication Failed');
          console.error(err);
        }
      });
    }
  }

  fillLogin(role: string) {
    if (role === 'admin') {
      this.loginForm.patchValue({
        usernameOrEmail: 'sunmoon843@gmail.com',
        password: 'Admin@123'
      });
    } else if (role === 'staff') {
      this.loginForm.patchValue({
        usernameOrEmail: 'alaminsun@test.com',
        password: 'Test@123'
      });
    }
  }

  private redirectUser() {
    console.log('Redirecting user. Current permissions:', this.authService.userPermissions());

    // 1. Check if user has dashboard permission
    if (this.authService.hasPermission('Permissions.Dashboard.View')) {
      console.log('Dashboard access granted. Redirecting...');
      this.router.navigate(['/dashboard']);
      return;
    }

    // 2. Otherwise, find the first menu they have permission for
    this.menuService.getMenus().subscribe(menus => {
      console.log('Available Menus for redirect check:', menus);
      const firstAccessible = this.findFirstAccessible(menus);
      console.log('First accessible path found:', firstAccessible);

      if (firstAccessible) {
        this.router.navigate([firstAccessible]);
      } else {
        console.warn('No accessible menus found for this user. Fallback to profile.');
        this.router.navigate(['/profile']);
      }
    });
  }

  private findFirstAccessible(menus: any[]): string | null {
    for (const menu of menus) {
      // ইউজারের এই মেনুটি দেখার অনুমতি আছে কিনা তা AuthService এর মাধ্যমে চেক করা
      const hasPermission = this.authService.hasPermission(menu.permission);
      
      console.log(`Checking menu: ${menu.title}, Permission: ${menu.permission}, HasAccess: ${hasPermission}`);

      // যদি লিংক থাকে এবং পারমিশন থাকে, তবে এটিই আমাদের টার্গেট
      if (menu.link && hasPermission) {
        return menu.link;
      }
      
      // চাইল্ড মেনু থাকলে সেগুলোর ভেতর সার্চ করা
      if (menu.children && menu.children.length > 0) {
        const childLink = this.findFirstAccessible(menu.children);
        if (childLink) return childLink;
      }
    }
    return null;
  }
}
