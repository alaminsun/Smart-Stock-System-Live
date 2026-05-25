import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../../services/customer.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: '../customer-managment/customer-management.component.html'
})
export class CustomerManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  public customerService = inject(CustomerService);
  private toastr = inject(ToastrService);
  public authService = inject(AuthService);

  customerForm = this.fb.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.email]],
    address: ['']
  });

  isEditMode = false;
  editId: string | null = null;

  ngOnInit() {
    this.customerService.getCustomers().subscribe();
  }

  onSubmit() {
    if (this.customerForm.invalid) return;

    const data = this.customerForm.value as Customer;

    if (this.isEditMode && this.editId) {
      this.customerService.updateCustomer(this.editId, { id: this.editId, ...data }).subscribe(() => {
        this.toastr.success('Customer updated');
        this.reset();
      });
    } else {
      this.customerService.saveCustomer(data).subscribe(() => {
        this.toastr.success('Customer saved');
        this.reset();
      });
    }
  }

  onEdit(c: Customer) {
    this.isEditMode = true;
    this.editId = c.id!;
    this.customerForm.patchValue(c);
  }

  reset() {
    this.isEditMode = false;
    this.editId = null;
    this.customerForm.reset();
  }
}