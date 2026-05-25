import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { InventoryService, InventoryTransaction } from '../../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-stock-out',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './stock-out.component.html'
})
export class StockOutComponent implements OnInit {
  // Service references
  public productService = inject(ProductService);
  public customerService = inject(CustomerService);
  public inventoryService = inject(InventoryService);
  public authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  stockOutForm = this.fb.group({
    productId: ['', Validators.required],
    customerId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    remarks: ['']
  });

  ngOnInit() {
    this.productService.getProducts().subscribe();
    this.customerService.getCustomers().subscribe();
  }

  onSubmit() {
    if (this.stockOutForm.invalid) {
      this.stockOutForm.markAllAsTouched();
      this.toastr.warning('Please fill in the form correctly.', 'Validation Error');
      return;
    }

    // Cast to unknown then to InventoryTransaction to avoid type errors
    const payload = this.stockOutForm.value as unknown as InventoryTransaction;

    this.inventoryService.stockOut(payload).subscribe({
      next: () => {
        this.toastr.success('Stock decreased (sold) successfully.', 'Success');
        // Reset form to initial state
        this.stockOutForm.reset({ 
          quantity: 1, 
          productId: '', 
          customerId: '', 
          remarks: '' 
        });
      },
      error: (err) => {
        // Show error message from backend
        const errorMsg = typeof err.error === 'string' ? err.error : 'Insufficient stock available!';
        this.toastr.error(errorMsg, 'Operation Failed');
      }
    });
  }
}