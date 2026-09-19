import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  //private apiUrl = 'http://localhost:5049/api/auth';
    private apiUrl = `${environment.apiUrl}/Auth`;

  // 1. Signal to hold the current token
  currentUser = signal<string | null>(localStorage.getItem('token'));

  // 2. Computed signal to decode the token automatically
  private decodedToken = computed(() => {
    const token = this.currentUser();
    if (!token) return null; 
    try {
      const decoded = jwtDecode<any>(token);
      console.log('Decoded JWT Token Payload:', decoded); // Debug logging
      return decoded;
    } catch {
      return null;
    }  
  });

  // 3. Extract user role from token
  userRole = computed(() => {
    const decoded = this.decodedToken();
    if (!decoded) return null;
    return decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded["role"];
  });

  // 4. Extract user profile information
  user = computed(() => {
    const decoded = this.decodedToken();
    if (!decoded) return null;
    return {
      id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded["nameid"] || decoded["sub"],
      userName: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded["sub"] || 'User',
      fullName: decoded["FullName"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 'User',
      profilePicture: localStorage.getItem('profilePicture') || decoded["ProfilePicture"] || null,
      role: this.userRole() || 'User'
    };
  });

  // 5. Extract permissions from token - Handling multiple possible keys
  userPermissions = computed<string[]>(() => {
    const decoded = this.decodedToken();
    if (!decoded) return [];
    
    // Check various keys where permissions might be stored
    // Note: Case sensitivity matters in some JWT libraries, so we check both
    const perms = decoded["Permission"] || 
                  decoded["permission"] || 
                  decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/permission"] ||
                  decoded["permissions"];
                  
    if (!perms) return [];
    
    // Normalize to an array of strings
    const permArray = Array.isArray(perms) ? perms : [perms];
    console.log('--- Auth Debug ---');
    console.log('User Role:', this.userRole());
    console.log('User Permissions Extracted:', permArray);
    return permArray;
  });

  // Helper method to check specific permissions
  hasPermission(permissionName: string | null | undefined): boolean {
    // 1. Admin always has all permissions
    if (this.isAdmin()) return true;

    // 2. If no permission is required (null/empty), we should decide if it's public or hidden.
    // In this app, we default to HIDDEN for security if a menu item is defined but lacks a permission string.
    if (!permissionName || permissionName.trim() === '') {
       return false; 
    }

    // 3. Check against user's extracted permissions (case-insensitive)
    const permissions = this.userPermissions();
    return permissions.some(p => p.toLowerCase() === permissionName.toLowerCase());
  }

  // 6. Check if user is logged in
  isLoggedIn = computed(() => !!this.currentUser());

  // 7. Check if user has Admin role
  isAdmin = computed(() => {
    const role = this.userRole();
    if (!role) return false;
    if (Array.isArray(role)) {
      return role.some(r => typeof r === 'string' && r.toLowerCase() === 'admin');
    }
    return typeof role === 'string' && role.toLowerCase() === 'admin';
  });

  login(model: any) {
    return this.http.post<{token: string, profilePicture?: string}>(`${this.apiUrl}/login`, model).pipe(
      tap(response => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          if (response.profilePicture) {
            localStorage.setItem('profilePicture', response.profilePicture);
          } else {
            localStorage.removeItem('profilePicture');
          }
          this.currentUser.set(response.token);
        }
      })
    );
  }

  register(model: any) {
    return this.http.post(`${this.apiUrl}/register`, model);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('profilePicture');
    this.currentUser.set(null);
  }

  changePassword(model: any) {
    return this.http.post(`${this.apiUrl}/change-password`, model);
  }
}
