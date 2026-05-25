import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html'
})
export class CategoryManagementComponent implements OnInit {
  // Injecting Services
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private toastr = inject(ToastrService);

  // State Management
  categories = signal<Category[]>([]);
  categoryForm: FormGroup;
  isEditMode = false;
  currentEditId: number | null = null;

  constructor() {
    // Form initialization and validation logic
    // Business rule: Category name must be at least 3 characters
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  // Load category list
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.toastr.error('Failed to load categories', 'Error')
    });
  }

  // Save or update action
  onSubmit() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched(); // Show validation errors to user
      this.toastr.warning('Please provide a valid category name', 'Validation Error');
      return;
    }

    const categoryData: Category = this.categoryForm.value;

    if (this.isEditMode && this.currentEditId) {
      // Update logic
      this.categoryService.updateCategory(this.currentEditId, categoryData).subscribe({
        next: () => {
          this.toastr.success('Category updated successfully', 'Success');
          this.resetForm();
          this.loadCategories();
        },
        error: (err) => this.toastr.error(err.error || 'Update failed', 'Error')
      });
    } else {
      // Create new category logic
      this.categoryService.saveCategory(categoryData).subscribe({
        next: () => {
          this.toastr.success('New category added successfully', 'Success');
          this.resetForm();
          this.loadCategories();
        },
        error: (err) => this.toastr.error(err.error || 'Save failed', 'Error')
      });
    }
  }

  // Populate form for editing
  onEdit(category: Category) {
    this.isEditMode = true;
    this.currentEditId = category.id!;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Delete action with confirmation
  onDelete(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            this.toastr.success('Category deleted successfully', 'Deleted');
            this.loadCategories();
          },
          error: (err) => {
            // Error if backend rejects deletion (e.g. if category has products)
            this.toastr.error(err.error || 'Cannot delete category', 'Operation Failed');
          }
        });
      }
    });
  }

  resetForm() {
    this.isEditMode = false;
    this.currentEditId = null;
    this.categoryForm.reset();
  }
}