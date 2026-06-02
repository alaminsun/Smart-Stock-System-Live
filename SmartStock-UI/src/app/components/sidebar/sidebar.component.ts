import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService, NavItem } from '../../services/menu.service';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent {
  private menuService = inject(MenuService);
  public authService = inject(AuthService);
  public translationService = inject(TranslationService);
  
  // 1. Get raw menus as a signal
  private rawMenus = toSignal(this.menuService.getMenus(), { initialValue: [] });

  // 2. Computed signal for filtered and initialized menus
  menuItems = computed(() => {
    const data = this.rawMenus();
    
    // পারমিশন অনুযায়ী ফিল্টার করা
    const filtered = this.filterMenus(data);
    
    // UI এর জন্য ইনিশিয়ালাইজ করা
    return this.initializeMenus(filtered);
  });

  isCollapsed = signal<boolean>(localStorage.getItem('sidebarCollapsed') === 'true');

  // Recursive filtering based on permissions
  filterMenus(items: NavItem[]): NavItem[] {
    if (!items) return [];

    return items
      .map(item => ({ ...item, children: item.children ? [...item.children] : [] })) 
      .filter(item => {
        // ১. আগে চাইল্ডদের ফিল্টার করা (Recursive)
        if (item.children && item.children.length > 0) {
          item.children = this.filterMenus(item.children);
        }

        // ২. এই মেনুটির নিজের পারমিশন চেক করা
        const hasDirectPermission = this.authService.hasPermission(item.permission);
        const hasPermissionDefined = item.permission && item.permission.trim() !== '';
        const isGroup = !item.link || item.link.trim() === '';

        // ৩. দৃশ্যমান হওয়ার লজিক:
        if (!isGroup) {
          // এটি একটি সরাসরি লিঙ্ক (Leaf node) - পারমিশন থাকলেই দেখাবে
          return hasDirectPermission;
        } else {
          // এটি একটি প্যারেন্ট মেনু (Group) - 
          // শর্ত ১: যদি পারমিশন ডিফাইন করা থাকে, তবে ইউজারের সেই পারমিশন থাকতে হবে।
          // শর্ত ২: অন্তত একটি চাইল্ড দৃশ্যমান থাকতে হবে।
          const permissionPass = !hasPermissionDefined || hasDirectPermission;
          const hasVisibleChildren = item.children && item.children.length > 0;
          
          return permissionPass && hasVisibleChildren;
        }
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
  }

  toggleCollapse() {
    this.isCollapsed.update(val => !val);
    localStorage.setItem('sidebarCollapsed', this.isCollapsed().toString());
  }
}
