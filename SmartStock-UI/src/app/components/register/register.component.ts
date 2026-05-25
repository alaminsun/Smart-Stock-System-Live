import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService); 
  private router = inject(Router);
  private toastr = inject(ToastrService);

  registerForm = this.fb.group({
    fullName: ['', Validators.required],
    username: [''], // Optional: If empty, backend will use email
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    companyName: ['', Validators.required]
  });

  onRegister() {
    if (this.registerForm.valid) {
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.toastr.success('Account created successfully!', 'Success');
          this.router.navigate(['/login']);
        },
        error: (err) => this.toastr.error('Registration failed. Please try again.', 'Error')
      });
    }
  }
}
