import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService, Category } from '../../services/category.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './product-management.component.html'
})
export class ProductManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  public productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);
  public authService = inject(AuthService);
  public settingsService = inject(SettingsService);

  // একটি লোডার সিগনাল (বাটন স্পিনারের জন্য)
  isAiLoading = signal<boolean>(false);

  productForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  editId: string | null = null;
  searchTerm: string = '';

  // Computed signal for filtered products
  filteredProducts = computed(() => {
    const term = this.searchTerm.toLowerCase().trim();
    const products = this.productService.products();
    if (!term) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku.toLowerCase().includes(term) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(term))
    );
  });

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      sku: ['', [Validators.required]],
      description: [''],
      quantity: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [5, [Validators.required, Validators.min(1)]],
      categoryId: ['', [Validators.required]],
      costPrice: [0, [Validators.required, Validators.min(0.01)]],
      salePrice: [0, [Validators.required, Validators.min(0.01)]]
    }, { validators: this.priceCompareValidator });
  }

  // Custom validator to ensure selling price is not lower than cost price
  priceCompareValidator(group: FormGroup) {
    const cost = group.get('costPrice')?.value;
    const sale = group.get('salePrice')?.value;
    return sale >= cost ? null : { priceError: true };
  }

  ngOnInit() {
    this.loadData();
  }

  // Load initial data (Products and Categories)
  loadData() {
    this.productService.getProducts().subscribe();
    this.categoryService.getCategories().subscribe(res => this.categories = res);
  }

  // Method to save or update a product
  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.toastr.warning("Please fill in all required fields correctly", "Validation Warning");
      return;
    }

    const cost = this.productForm.value.costPrice;
    const sale = this.productForm.value.salePrice;

    // Business Logic: Warn if selling price is lower than cost price
    if (sale < cost) {
      Swal.fire({
        title: 'Are you sure?',
        text: "The sale price is lower than the cost price. Do you want to proceed?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Save it',
        cancelButtonText: 'No, let me change'
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeSave();
        }
      });
    } else {
      this.executeSave();
    }
  }

  // Core logic to execute the save/update operation
  private executeSave() {
    const formValue = this.productForm.value;
    const payload: any = {
      name: formValue.name,
      sku: formValue.sku,
      description: formValue.description || "",
      quantity: Number(formValue.quantity),
      costPrice: Number(formValue.costPrice),
      salePrice: Number(formValue.salePrice),
      minStockLevel: Number(formValue.minStockLevel),
      categoryId: Number(formValue.categoryId)
    };

    if (this.isEditMode && this.editId) {
      payload.id = this.editId;
      this.productService.updateProduct(this.editId, payload).subscribe({
        next: () => {
          this.toastr.success('Product updated successfully', 'Success');
          this.resetForm();
          this.loadData();
        },
        error: (err) => this.handleError(err)
      });
    } else {
      this.productService.saveProduct(payload).subscribe({
        next: () => {
          this.toastr.success('New product added successfully', 'Success');
          this.resetForm();
          this.loadData();
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  // Standard error handling method
  private handleError(err: any) {
    console.error("Error:", err);
    this.toastr.error(err.error || "An unexpected error occurred", "Operation Failed");
  }

  // Switch to edit mode and populate form
  onEdit(p: Product) {
    this.isEditMode = true;
    this.editId = p.id!;
    this.productForm.patchValue(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Delete operation with SweetAlert confirmation
  onDelete(id: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.deleteProduct(id).subscribe(() => {
          this.toastr.success('Product deleted successfully', 'Deleted');
          this.loadData();
        });
      }
    });
  }

  // Reset form to default values
  resetForm() {
    this.isEditMode = false;
    this.editId = null;
    this.productForm.reset({ costPrice: 0, salePrice: 0, quantity: 0, minStockLevel: 5 });
  }

  // Handle CSV file selection for bulk upload
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        this.processCSV(text);
      };
      reader.readAsText(file);
    }
  }

  // Parse CSV and send to backend
  private processCSV(csvText: string) {
    const lines = csvText.split('\n');
    const products: any[] = [];
    
    // Skip header (Assume format: Name, SKU, CostPrice, SalePrice, Quantity, MinStock, CategoryId, Description)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',');
      if (cols.length >= 7) {
        products.push({
          name: cols[0].trim(),
          sku: cols[1].trim(),
          costPrice: parseFloat(cols[2]),
          salePrice: parseFloat(cols[3]),
          quantity: parseInt(cols[4]),
          minStockLevel: parseInt(cols[5]),
          categoryId: parseInt(cols[6]),
          description: cols[7]?.trim() || ""
        });
      }
    }

    if (products.length === 0) {
      this.toastr.error('No valid products found in CSV', 'Upload Error');
      return;
    }

    Swal.fire({
      title: 'Bulk Upload',
      text: `Are you sure you want to upload ${products.length} products?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Upload'
    }).then((result) => {
      if (result.isConfirmed) {
        this.productService.bulkUpload(products).subscribe({
          next: (res) => {
            this.toastr.success(`${res.count} products uploaded successfully!`, 'Success');
            this.loadData();
          },
          error: (err) => this.toastr.error('Bulk upload failed', 'Error')
        });
      }
    });
  }

  // এআই ডেসক্রিপশন জেনারেট করার মেথড 🚀
  generateAiDescription() {
    const productName = this.productForm.get('name')?.value;

    if (!productName) {
      alert('Please enter a product name first!');
      return;
    }

    this.isAiLoading.set(true);

    this.productService.generateProductDescription(productName).subscribe({
      next: (res) => {
        // এআই-এর দেওয়া রেসপন্সটি সরাসরি ডেসক্রিপশন এবং SKU ফিল্ডে প্যাচ (Patch) করে দেওয়া
        this.productForm.patchValue({
          description: res.description,
          sku: res.sku
        });
        this.isAiLoading.set(false);
      },
      error: (err) => {
        console.error('AI generation failed', err);
        this.isAiLoading.set(false);
      }
    });
  }
}
