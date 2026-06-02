import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../services/role.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2'; // SweetAlert Import
import { ToastrService } from 'ngx-toastr'; // Toastr Import

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-management.component.html'
})
export class RoleManagementComponent implements OnInit {
  public authService = inject(AuthService);
  private roleService = inject(RoleService);
  private toastr = inject(ToastrService);
  
  roles = signal<any[]>([]);
  rolePermissions = signal<any[]>([]);
  newRoleName = '';
  userEmail = '';
  selectedRoleForUser = '';
  selectedRole = signal<string | null>(null);

  // List of all permissions (Fetched from backend)
  allPermissions: string[] = [];

  ngOnInit() {
    this.loadRoles();
    this.loadAllPermissions();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe(res => this.roles.set(res));
  }

  loadAllPermissions() {
    this.roleService.getAllPermissions().subscribe(res => {
      this.allPermissions = res;
    });
  }

  // Fetch permissions associated with a role
selectRole(roleName: string) {
  this.selectedRole.set(roleName);
  
  // Get current permissions for the selected role
  this.roleService.getPermissionsByRole(roleName).subscribe(assignedPermissions => {
    // assignedPermissions is a string array (e.g. ['Permissions.Products.View', ...])
    
    // Map permissions to a selection list
    const mappedPermissions = this.allPermissions.map(p => ({
      name: p,
      isSelected: assignedPermissions.includes(p)
    }));
    
    this.rolePermissions.set(mappedPermissions);
  });
}

togglePermission(permissionObj: any) {
  const roleName = this.selectedRole()!;
  
  if (!permissionObj.isSelected) {
    // Add permission
    this.roleService.addPermission(roleName, permissionObj.name).subscribe({
      next: () => {
        permissionObj.isSelected = true;
        this.toastr.success('Permission added successfully', 'Success');
      }
    });
  } else {
    // Remove permission
    this.roleService.removePermission(roleName, permissionObj.name).subscribe({
      next: () => {
        permissionObj.isSelected = false;
        this.toastr.info('Permission removed', 'Updated');
      }
    });
  }
}

  onCreateRole() {
    if (!this.newRoleName) {
      this.toastr.warning('Please enter a role name', 'Warning');
      return;
    }

    this.roleService.createRole(this.newRoleName).subscribe({
      next: () => {
        this.newRoleName = '';
        this.loadRoles();
        // SweetAlert for success message
        Swal.fire({
          title: 'Success!',
          text: 'New role has been created successfully.',
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });
      },
      error: () => this.toastr.error('Failed to create role', 'Error')
    });
  }

  assignPermission(permission: string) {
    if (!this.selectedRole()) {
      this.toastr.info('Please select a role from the list first.', 'Information');
      return;
    }

    this.roleService.addPermission(this.selectedRole()!, permission).subscribe({
      next: () => {
        this.toastr.success(`Permission assigned to ${this.selectedRole()}`, 'Success');
      },
      error: () => this.toastr.error('This permission already exists for this role', 'Duplicate')
    });
  }

onAssignRole() {
  // Take values directly from ngModel variables
  const email = this.userEmail;
  const role = this.selectedRoleForUser;

  if (!email || !role) {
    this.toastr.warning('Please provide both email and role!', 'Validation Error');
    return;
  }

  // Service call to assign role
  this.roleService.assignRoleToUser(email, role).subscribe({
    next: () => {
      Swal.fire('Success', `User ${email} is now a ${role}`, 'success');
      this.userEmail = ''; // Reset
      this.selectedRoleForUser = ''; // Reset
      // Refresh user list if on same page
      this.loadRoles(); 
    },
    error: (err) => this.toastr.error('Assignment failed. Please check if the user exists.', 'Error')
  });
}
}