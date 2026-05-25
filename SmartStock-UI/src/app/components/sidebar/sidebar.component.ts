import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, NavItem } from '../../services/menu.service';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit {
  private menuService = inject(MenuService);
  public authService = inject(AuthService);
  
  menuItems = signal<NavItem[]>([]);
  isCollapsed = signal<boolean>(localStorage.getItem('sidebarCollapsed') === 'true');

  ngOnInit() {
    this.menuService.getMenus().subscribe(data => {
      this.menuItems.set([...this.initializeMenus(data)]);
    });
  }

  // Initialize menu items recursively to handle nested levels
  initializeMenus(items: NavItem[]): NavItem[] {
    return items.map(item => ({
      ...item,
      isExpanded: false,
      children: item.children ? this.initializeMenus(item.children) : []
    }));
  }

  toggle(item: NavItem) {
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
    }
    item.isExpanded = !item.isExpanded;
    // Update signal to ensure view refresh
    this.menuItems.set([...this.menuItems()]);
  }

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
    localStorage.setItem('sidebarCollapsed', this.isCollapsed().toString());
  }
}