import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Menu interface
export interface NavItem {
  id?: number;
  title: string;
  icon?: string;
  link?: string;
  permission?: string;
  parentId?: number | null;
  displayOrder?: number;
  children?: NavItem[];
  isExpanded?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5049/api/Menus';
  //private apiUrl = 'https://localhost:7125/api/Menus';
  //private apiUrl = '/api/Menus';


  // Get all menus (Tree Structure)
  getMenus(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(this.apiUrl);
  }

  // 1. Method to save a new menu
  saveMenu(menu: any): Observable<any> {
    return this.http.post(this.apiUrl, menu);
  }

  // 1.1 Method to update an existing menu
  updateMenu(id: number, menu: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, menu);
  }

  // 2. Method to delete a menu
  deleteMenu(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // 3. Get parent menus only (Optional)
  getParentMenus(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/parents`);
  }
}
