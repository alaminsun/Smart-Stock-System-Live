import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, NavItem } from '../../services/menu.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-management.component.html'
})
export class MenuManagementComponent implements OnInit {
  private menuService = inject(MenuService);
  private toastr = inject(ToastrService);

  menus = signal<any[]>([]);
  isEditMode = signal(false);
  editId = signal<number | null>(null);
  
  // Form model
  newMenu = {
    id: 0,
    title: '',
    icon: '',
    link: '',
    permission: '',
    parentId: null as number | null,
    displayOrder: 0
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.menuService.getMenus().subscribe(res => this.menus.set(res));
  }

  // Populate form with data on edit button click
  onEdit(menu: any) {
    this.isEditMode.set(true);
    this.editId.set(menu.id);
    this.newMenu = {
      id: menu.id,
      title: menu.title,
      icon: menu.icon || '',
      link: menu.link || '',
      permission: menu.permission || '',
      parentId: menu.parentId || null,
      displayOrder: menu.displayOrder || 0
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit() {
    if (!this.newMenu.title) {
      this.toastr.warning('Title is required', 'Validation Error');
      return;
    }

    // Prepare object for backend (including ID)
    const menuToSave = { ...this.newMenu, id: this.editId() || 0 };

    if (this.isEditMode() && this.editId()) {
      this.menuService.updateMenu(this.editId()!, menuToSave).subscribe({
        next: () => {
          this.toastr.success('Menu updated successfully', 'Success');
          this.resetForm();
          this.loadData();
        },
        error: () => this.toastr.error('Update failed', 'Error')
      });
    } else {
      this.menuService.saveMenu(this.newMenu).subscribe({
        next: () => {
          this.toastr.success('Menu added successfully', 'Success');
          this.resetForm();
          this.loadData();
        },
        error: () => this.toastr.error('Failed to save menu', 'Error')
      });
    }
  }

  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "Children menus will also be affected!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.menuService.deleteMenu(id).subscribe(() => {
          this.toastr.success('Menu deleted');
          this.loadData();
        });
      }
    });
  }

  resetForm() {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.newMenu = { 
      id: 0, 
      title: '', 
      icon: '', 
      link: '', 
      permission: '', 
      parentId: null, 
      displayOrder: 0 
    };
  }

  cancelEdit() {
    this.resetForm();
  }
}
