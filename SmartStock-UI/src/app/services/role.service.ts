import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Roles`; 


  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-roles`);
  }

  createRole(roleName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { roleName });
  }

  addPermission(roleName: string, permission: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-permission`, { roleName, permission });
  }

  // Assign a role to a user
  assignRoleToUser(email: string, roleName: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/assign-to-user`, { email, roleName });
  }

  // Get all permissions associated with a specific role
getPermissionsByRole(roleName: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/get-role-permissions/${roleName}`);
}
removePermission(roleName: string, permission: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/remove-permission`, {
    roleName: roleName,
    permission: permission
  });
}
}