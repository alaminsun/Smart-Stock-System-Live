import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

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
  //private apiUrl = 'http://localhost:5049/api/Menus';
    private apiUrl = `${environment.apiUrl}/Menus`;

  // Get all menus (Tree Structure)
  getMenus(): Observable<NavItem[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(menus => this.normalizeMenus(menus))
    );
  }

  // Normalization logic to handle PascalCase vs camelCase from API
  private normalizeMenus(items: any[]): NavItem[] {
    if (!items) return [];
    return items.map(item => {
      const normalized: NavItem = {
        id: item.id !== undefined ? item.id : item.Id,
        title: item.title || item.Title || '',
        icon: item.icon || item.Icon,
        link: item.link || item.Link,
        permission: item.permission || item.Permission,
        parentId: item.parentId !== undefined ? item.parentId : item.ParentId,
        displayOrder: item.displayOrder !== undefined ? item.displayOrder : item.DisplayOrder,
        children: item.children || item.Children || []
      };

      if (normalized.children && normalized.children.length > 0) {
        normalized.children = this.normalizeMenus(normalized.children);
      }

      return normalized;
    });
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
