import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private userService = inject(UserService);

  profileForm!: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isSaving = false;

  ngOnInit() {
    this.initForm();
    this.loadUserProfile();
  }

  initForm() {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      companyName: [''],
      phoneNumber: [''],
      address: ['']
    });
  }

  loadUserProfile() {
    const userId = this.authService.user()?.id;
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user) => {
          this.profileForm.patchValue({
            fullName: user.fullName,
            email: user.email,
            companyName: user.companyName || '',
            phoneNumber: user.phoneNumber || '',
            address: user.address || ''
          });
          // Mock preview if image exists
          if (user.profilePicture) {
            this.previewUrl = user.profilePicture;
          }
        },
        error: (err) => {
          console.error('Error loading profile', err);
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) return;

    this.isSaving = true;
    const userId = this.authService.user()?.id;
    const updatedData = this.profileForm.getRawValue();

    // Mapping to API DTO
    const model = {
      id: userId,
      fullName: updatedData.fullName,
      email: updatedData.email,
      companyName: updatedData.companyName,
      phoneNumber: updatedData.phoneNumber,
      address: updatedData.address,
      profilePicture: this.previewUrl // Sending Base64 image string
    };

    this.userService.updateUser(userId, model).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your profile has been updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        this.isSaving = false;
        // Optionally reload page to update all UI signals
        setTimeout(() => window.location.reload(), 1500);
      },
      error: (err) => {
        console.error('Update Error:', err);
        const errorMsg = err.error?.message || (Array.isArray(err.error) ? err.error[0].description : 'Failed to update profile');
        Swal.fire('Error', errorMsg, 'error');
        this.isSaving = false;
      }
    });
  }

  onChangePassword() {
    Swal.fire({
      title: 'Change Password',
      html: `
        <div class="mb-3">
          <input type="password" id="currentPassword" class="swal2-input" placeholder="Current Password">
        </div>
        <div class="mb-3">
          <input type="password" id="newPassword" class="swal2-input" placeholder="New Password">
          <small class="text-muted d-block mt-1">Min 6 chars, with upper, lower, digit & special char</small>
        </div>
        <div class="mb-3">
          <input type="password" id="confirmPassword" class="swal2-input" placeholder="Confirm Password">
        </div>
      `,
      confirmButtonText: 'Change Password',
      showCancelButton: true,
      focusConfirm: false,
      preConfirm: () => {
        const currentPassword = (Swal.getPopup()?.querySelector('#currentPassword') as HTMLInputElement).value;
        const newPassword = (Swal.getPopup()?.querySelector('#newPassword') as HTMLInputElement).value;
        const confirmPassword = (Swal.getPopup()?.querySelector('#confirmPassword') as HTMLInputElement).value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage(`Please enter all fields`);
          return;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage(`New passwords do not match`);
          return;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage(`Password must be at least 6 characters`);
          return;
        }

        return { currentPassword, newPassword, confirmPassword };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.changePassword(result.value).subscribe({
          next: () => {
            Swal.fire('Success', 'Password changed successfully!', 'success');
          },
          error: (err) => {
            console.error('Password Change Error:', err);
            let errorMsg = 'Failed to change password';
            
            if (err.error) {
              if (typeof err.error === 'string') {
                errorMsg = err.error;
              } else if (err.error.message) {
                errorMsg = err.error.message;
              } else if (Array.isArray(err.error)) {
                errorMsg = err.error.map((e: any) => e.description).join('\n');
              } else if (typeof err.error === 'object') {
                // Handle ModelState errors from ASP.NET Core
                errorMsg = Object.values(err.error).flat().join('\n');
              }
            }
            
            Swal.fire('Error', errorMsg, 'error');
          }
        });
      }
    });
  }
}
