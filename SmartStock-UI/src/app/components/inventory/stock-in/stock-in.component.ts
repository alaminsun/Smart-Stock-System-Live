import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { InventoryService } from '../../../services/inventory.service';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { SupplierService } from '../../../services/supplier.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  templateUrl: './stock-in.component.html'
})
export class StockInComponent implements OnInit {
  private fb = inject(FormBuilder);
  public productService = inject(ProductService);
  public supplierService = inject(SupplierService);
  public inventoryService = inject(InventoryService);
  public authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  selectedProductId: string | null = null;

  stockInForm: FormGroup;

  constructor() {
    this.stockInForm = this.fb.group({
      productId: ['', [Validators.required]],
      supplierId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      remarks: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit() {
    // Refresh product and supplier list on page load
    this.productService.getProducts().subscribe();
    this.supplierService.getSuppliers().subscribe();

    this.route.queryParams.subscribe(params => {
      const productIdFromDash = params['id'];
      if (productIdFromDash) {
        this.selectedProductId = productIdFromDash;
        this.stockInForm.patchValue({
          productId: productIdFromDash
        });
        console.log('Product selected from dashboard:', productIdFromDash);
      }
    });
  }

  onSubmit() {
    if (this.stockInForm.invalid) {
      this.stockInForm.markAllAsTouched();
      this.toastr.warning('Please fill in all required fields correctly', 'Validation Error');
      return;
    }

    const payload = this.stockInForm.value;

    this.inventoryService.stockIn(payload).subscribe({
      next: (res) => {
        this.toastr.success('Stock increased successfully!', 'Success');
        this.stockInForm.reset({ quantity: 1, productId: '', supplierId: '', remarks: '' });
      },
      error: (err) => {
        this.toastr.error(err.error || 'Failed to process Stock In', 'Operation Failed');
      }
    });
  }
}