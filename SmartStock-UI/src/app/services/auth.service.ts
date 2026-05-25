import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/auth'; 
  //private apiUrl = 'https://localhost:7125/api/auth';
  //private apiUrl = '/api/auth';


  // 1. Signal to hold the current token
  currentUser = signal<string | null>(localStorage.getItem('token'));

  // 2. Computed signal to decode the token automatically
  private decodedToken = computed(() => {
    const token = this.currentUser();
    if (!token) return null; 
    try {
      return jwtDecode<any>(token);
    } catch {
      return null;
    }  
  });

  // 3. Extract user role from token
  userRole = computed(() => {
    const decoded = this.decodedToken();
    if (!decoded) return null;
    return decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  });

  // 4. Extract user profile information
  user = computed(() => {
    const decoded = this.decodedToken();
    if (!decoded) return null;
    return {
      id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded["nameid"] || decoded["sub"],
      userName: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded["sub"] || 'User',
      fullName: decoded["FullName"] || decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 'User',
      profilePicture: decoded["ProfilePicture"] || null,
      role: this.userRole() || 'User'
    };
  });

  // 5. Extract permissions from token
  userPermissions = computed<string[]>(() => {
    const decoded = this.decodedToken();
    if (!decoded || !decoded.Permission) return [];
    
    // Normalize permissions to an array
    return Array.isArray(decoded.Permission) ? decoded.Permission : [decoded.Permission];
  });

  // Helper method to check specific permissions
  hasPermission(permissionName: string): boolean {
    return this.userPermissions().includes(permissionName);
  }

  // 6. Check if user has Admin role
  isAdmin = computed(() => {
    const role = this.userRole();
    if (Array.isArray(role)) {
      return role.includes('Admin');
    }
    return role === 'Admin';
  });

  login(model: any) {
    return this.http.post<{token: string}>(`${this.apiUrl}/login`, model).pipe(
      tap(response => {
        if (response.token) {
        localStorage.setItem('token', response.token);
        console.log(response.token);
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
    this.currentUser.set(null);
  }

  changePassword(model: any) {
    return this.http.post(`${this.apiUrl}/change-password`, model);
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}