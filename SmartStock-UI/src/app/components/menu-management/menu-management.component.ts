import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, NavItem } from '../../services/menu.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html'
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuService);
  private toastr = inject(ToastrService);
  public authService = inject(AuthService);

  menus = signal<NavItem[]>([]);
  parentMenus = signal<any[]>([]);
  
  editingMenu = signal<NavItem | null>(null);
  newMenu: NavItem = this.resetMenu();

  ngOnInit() {
    this.loadMenus();
    this.loadParents();
  }

  loadMenus() {
    this.menuService.getMenus().subscribe(res => this.menus.set(res));
  }

  loadParents() {
    this.menuService.getMenus().subscribe(res => {
      const flattened: any[] = [];
      res.forEach(m => {
        flattened.push({ id: m.id, title: m.title });
        if (m.children) {
          m.children.forEach(c => {
            flattened.push({ id: c.id, title: `↳ ${c.title}` });
          });
        }
      });
      this.parentMenus.set(flattened);
    });
  }

  resetMenu(): NavItem {
    return {
      title: '',
      icon: 'bi bi-folder',
      link: '',
      permission: '',
      parentId: null,
      displayOrder: 0
    };
  }

  onSave() {
    const action = this.editingMenu() 
      ? this.menuService.updateMenu(this.editingMenu()!.id!, this.newMenu)
      : this.menuService.saveMenu(this.newMenu);

    action.subscribe({
      next: () => {
        this.toastr.success('Menu saved successfully', 'Success');
        this.loadMenus();
        this.loadParents();
        this.cancelEdit();
      },
      error: () => this.toastr.error('Failed to save menu', 'Error')
    });
  }

  editMenu(menu: NavItem) {
    this.editingMenu.set(menu);
    this.newMenu = { ...menu };
  }

  deleteMenu(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will delete the menu!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.menuService.deleteMenu(id).subscribe({
          next: () => {
            this.loadMenus();
            this.loadParents();
            Swal.fire('Deleted!', 'Menu has been removed.', 'success');
          },
          error: (err) => {
            console.error('Delete error:', err);
            const errorMsg = err.error || 'Failed to delete menu. It might have active submenus or other constraints.';
            this.toastr.error(errorMsg, 'Delete Failed');
          }
        });
      }
    });
  }

  cancelEdit() {
    this.editingMenu.set(null);
    this.newMenu = this.resetMenu();
  }
}
