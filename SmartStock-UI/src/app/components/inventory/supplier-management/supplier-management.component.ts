import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../../../services/supplier.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-supplier-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-management.component.html'
})
export class SupplierManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  public supplierService = inject(SupplierService);
  public authService = inject(AuthService);
  private toastr = inject(ToastrService);

  supplierForm: FormGroup;
  isEditMode = false;
  editId: string | null = null;

  constructor() {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      contactPerson: [''],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+]{11,14}$/)]],
      email: ['', [Validators.email]],
      address: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.supplierService.getSuppliers().subscribe();
  }

  // Permission checks
  canCreate() { return this.authService.hasPermission('Permissions.Suppliers.Create'); }
  canEdit() { return this.authService.hasPermission('Permissions.Suppliers.Edit'); }
  canDelete() { return this.authService.hasPermission('Permissions.Suppliers.Delete'); }

  onSubmit() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const data = this.supplierForm.value;

    if (this.isEditMode && this.editId) {
      this.supplierService.updateSupplier(this.editId, { id: this.editId, ...data }).subscribe({
        next: () => {
          this.toastr.success('Supplier updated successfully');
          this.resetForm();
        }
      });
    } else {
      this.supplierService.saveSupplier(data).subscribe({
        next: () => {
          this.toastr.success('New supplier added');
          this.resetForm();
        },
        error: (err) => this.toastr.error(err.error || 'Failed to save supplier')
      });
    }
  }

  onEdit(s: Supplier) {
    this.isEditMode = true;
    this.editId = s.id!;
    this.supplierForm.patchValue(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.supplierService.deleteSupplier(id).subscribe(() => {
          this.toastr.success('Supplier removed');
        });
      }
    });
  }

  resetForm() {
    this.isEditMode = false;
    this.editId = null;
    this.supplierForm.reset({ isActive: true });
  }
}