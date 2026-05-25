import { Component, OnInit, inject, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit {
  public authService = inject(AuthService);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  users = signal<any[]>([]);
  roles = signal<any[]>([]);
  isEditMode = signal(false);
  selectedUserId = signal<string | null>(null);

  userForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    companyName: ['', Validators.required],
    role: ['']
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.userService.getAllUsers().subscribe({
      next: res => this.users.set(res),
      error: () => this.toastr.error('Failed to load user list', 'Error')
    });
    this.roleService.getRoles().subscribe(res => this.roles.set(res));
  }

  onEditUser(user: any) {
    this.isEditMode.set(true);
    this.selectedUserId.set(user.id);
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      companyName: user.companyName,
      role: user.role
    });
  }

  onSaveUser() {
    if (this.userForm.valid && this.selectedUserId()) {
      const userData = { ...this.userForm.value, id: this.selectedUserId() };
      this.userService.updateUser(this.selectedUserId()!, userData).subscribe({
        next: () => {
          this.toastr.success('User updated successfully', 'Success');
          this.loadData();
          this.cancelEdit();
        },
        error: () => this.toastr.error('Failed to update user', 'Error')
      });
    }
  }

  cancelEdit() {
    this.isEditMode.set(false);
    this.selectedUserId.set(null);
    this.userForm.reset();
  }

  changeUserRole(email: string, newRole: string) {
    this.roleService.assignRoleToUser(email, newRole).subscribe({
      next: () => {
        this.toastr.success(`Role updated for ${email}`, 'Success');
        this.loadData(); // Refresh list
      },
      error: () => this.toastr.error('Failed to update role', 'Error')
    });
  }

  onDeleteUser(id: string) {
    Swal.fire({
      title: 'Delete User?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(id).subscribe(() => {
          this.toastr.success('User removed successfully', 'Deleted');
          this.loadData();
        });
      }
    });
  }
}